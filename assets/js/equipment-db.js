// REAL平台 - 設備數據庫處理工具

// 加載設備數據
async function loadEquipmentData() {
    try {
        const response = await fetch('assets/database/ctv_Equipment_250405.csv');
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error('加載設備數據失敗:', error);
        return [];
    }
}

// 解析CSV數據
function parseCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).filter(line => line.trim() !== '').map(line => {
        const values = line.split(',');
        const equipment = {};
        
        headers.forEach((header, index) => {
            equipment[header] = values[index];
        });
        
        return equipment;
    });
}

// 獲取可用設備列表
async function getAvailableEquipment(category = null, difficultyLevel = null, searchQuery = null) {
    const equipmentList = await loadEquipmentData();
    
    return equipmentList.filter(item => {
        // 檢查是否可用
        const isAvailable = item['Status for rent'] === 'Available';
        
        // 類別篩選
        const categoryMatch = !category || category === 'all' || item['Item Category'] === category;
        
        // 難度等級篩選
        const difficultyMatch = !difficultyLevel || parseInt(item.DifficultyLevel) <= parseInt(difficultyLevel);
        
        // 搜索查詢
        const searchMatch = !searchQuery || 
            item['Item Name'].toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.Brand.toLowerCase().includes(searchQuery.toLowerCase());
        
        return isAvailable && categoryMatch && difficultyMatch && searchMatch;
    });
}

// 獲取設備詳情
async function getEquipmentDetails(itemCode) {
    const equipmentList = await loadEquipmentData();
    return equipmentList.find(item => item['Item Code'] === itemCode);
}

// 獲取設備預訂狀態
async function getEquipmentBookings(itemCode) {
    try {
        const response = await fetch('assets/database/bookings.csv');
        const csvData = await response.text();
        
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        const bookings = lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
                const values = line.split(',');
                const booking = {};
                
                headers.forEach((header, index) => {
                    booking[header] = values[index];
                });
                
                return booking;
            });
        
        return bookings.filter(booking => booking.ItemCode === itemCode && booking.BookingStatus !== 'Cancelled');
    } catch (error) {
        console.error('獲取預訂狀態失敗:', error);
        return [];
    }
}

// 檢查設備在指定日期是否可用
async function isEquipmentAvailable(itemCode, startDate, endDate) {
    const equipment = await getEquipmentDetails(itemCode);
    
    // 檢查設備是否存在且狀態為可用
    if (!equipment || equipment['Status for rent'] !== 'Available') {
        return false;
    }
    
    // 獲取該設備的所有預訂
    const bookings = await getEquipmentBookings(itemCode);
    
    // 轉換日期格式
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 檢查是否與現有預訂衝突
    for (const booking of bookings) {
        const bookingStart = new Date(booking.StartDate);
        const bookingEnd = new Date(booking.EndDate);
        
        // 檢查日期重疊
        if (
            (start >= bookingStart && start <= bookingEnd) || // 開始日期在現有預訂範圍內
            (end >= bookingStart && end <= bookingEnd) || // 結束日期在現有預訂範圍內
            (start <= bookingStart && end >= bookingEnd) // 完全包含現有預訂
        ) {
            return false;
        }
    }
    
    return true;
}

// 計算租借所需總積分
function calculateTotalPoints(equipment, days) {
    return parseInt(equipment.PointsPerDay) * parseInt(days);
}

// 創建設備預訂
async function createBooking(userId, itemCode, startDate, endDate) {
    try {
        // 檢查設備在指定時間是否可用
        const isAvailable = await isEquipmentAvailable(itemCode, startDate, endDate);
        if (!isAvailable) {
            return {
                success: false,
                message: '設備在所選時間段不可用'
            };
        }
        
        // 獲取用戶信息
        const userInfo = await getUserInfo(userId);
        if (!userInfo) {
            return {
                success: false,
                message: '無法獲取用戶信息'
            };
        }
        
        // 獲取設備信息
        const equipment = await getEquipmentDetails(itemCode);
        if (!equipment) {
            return {
                success: false,
                message: '無法獲取設備信息'
            };
        }
        
        // 檢查用戶等級是否足夠
        if (parseInt(userInfo.level) < parseInt(equipment.DifficultyLevel)) {
            return {
                success: false,
                message: '用戶等級不足以借用此設備'
            };
        }
        
        // 計算天數
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        // 計算所需積分
        const totalPoints = calculateTotalPoints(equipment, days);
        
        // 檢查用戶積分是否足夠
        if (parseInt(userInfo.points) < totalPoints) {
            return {
                success: false,
                message: '用戶積分不足'
            };
        }
        
        // 創建預訂記錄（實際應用中應寫入數據庫）
        const booking = {
            BookingID: generateBookingId(),
            UserID: userId,
            ItemCode: itemCode,
            StartDate: startDate,
            EndDate: endDate,
            BookingStatus: 'Confirmed'
        };
        
        // 創建租借歷史記錄
        const rental = {
            id: booking.BookingID,
            userId: userId,
            equipmentName: equipment['Item Name'],
            'Item QR Code': equipment['Item QR Code'],
            startDate: startDate,
            endDate: endDate,
            'Total Points': totalPoints,
            status: 'Confirmed'
        };
        
        // 在Demo版中，我們將預訂信息保存到localStorage
        saveBooking(booking);
        saveRental(rental);
        
        // 更新用戶積分（從用戶積分中扣除）
        updateUserPoints(userId, -totalPoints);
        
        return {
            success: true,
            message: '預訂成功',
            booking: booking,
            pointsDeducted: totalPoints
        };
    } catch (error) {
        console.error('創建預訂失敗:', error);
        return {
            success: false,
            message: '預訂過程中發生錯誤'
        };
    }
}

// 生成唯一預訂ID
function generateBookingId() {
    return 'BK' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
}

// 保存預訂到localStorage
function saveBooking(booking) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// 保存租借記錄到localStorage
function saveRental(rental) {
    const rentals = JSON.parse(localStorage.getItem('rentals')) || [];
    rentals.push(rental);
    localStorage.setItem('rentals', JSON.stringify(rentals));
}

// 獲取用戶信息
async function getUserInfo(userId) {
    try {
        const response = await fetch('assets/database/users.csv');
        const csvData = await response.text();
        
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        const users = lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
                const values = line.split(',');
                const user = {};
                
                headers.forEach((header, index) => {
                    user[header] = values[index];
                });
                
                return user;
            });
        
        return users.find(user => user.id === userId);
    } catch (error) {
        console.error('獲取用戶信息失敗:', error);
        return null;
    }
}

// 更新用戶積分
function updateUserPoints(userId, pointsChange) {
    // 在實際應用中，這應該是一個API調用來更新數據庫
    // 在Demo版中，我們通過localStorage更新
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser === userId) {
        const userPoints = parseInt(localStorage.getItem('userPoints') || '0');
        localStorage.setItem('userPoints', (userPoints + pointsChange).toString());
    }
}

// 獲取用戶預訂歷史
function getUserBookings(userId) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    return bookings.filter(booking => booking.UserID === userId);
}

// 獲取用戶租借歷史
function getUserRentals(userId) {
    const rentals = JSON.parse(localStorage.getItem('rentals')) || [];
    return rentals.filter(rental => rental.userId === userId);
}

// 檢查多個日期設備的可用性
async function checkDateAvailability(itemCode, dateStart, dateEnd) {
    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    const dateMap = {};
    
    // 創建日期範圍內的每一天
    let currentDate = new Date(start);
    while (currentDate <= end) {
        const dateString = currentDate.toISOString().split('T')[0];
        dateMap[dateString] = true; // 假設所有日期都可用
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 獲取設備的所有預訂
    const bookings = await getEquipmentBookings(itemCode);
    
    // 標記不可用的日期
    for (const booking of bookings) {
        const bookingStart = new Date(booking.StartDate);
        const bookingEnd = new Date(booking.EndDate);
        
        let current = new Date(bookingStart);
        while (current <= bookingEnd) {
            const dateString = current.toISOString().split('T')[0];
            if (dateMap.hasOwnProperty(dateString)) {
                dateMap[dateString] = false; // 此日期不可用
            }
            
            current.setDate(current.getDate() + 1);
        }
    }
    
    return dateMap;
}

// 導出函數
window.EquipmentDB = {
    getAvailableEquipment,
    getEquipmentDetails,
    isEquipmentAvailable,
    calculateTotalPoints,
    createBooking,
    getUserBookings,
    getUserRentals,
    checkDateAvailability
}; 