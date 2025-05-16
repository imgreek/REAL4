// REAL平台 - 數據庫處理模塊
// 該模塊負責所有數據的加載和處理，作為前後端溝通的橋樑

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

// 加載用戶數據
async function loadUserData() {
    try {
        const response = await fetch('assets/database/users.csv');
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error('加載用戶數據失敗:', error);
        return [];
    }
}

// 加載預約數據
async function loadBookingsData() {
    try {
        const response = await fetch('assets/database/bookings.csv');
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error('加載預約數據失敗:', error);
        return [];
    }
}

// 加載租借歷史數據
async function loadRentalHistoryData() {
    try {
        const response = await fetch('assets/database/rental_history.csv');
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error('加載租借歷史失敗:', error);
        return [];
    }
}

// 加載課程數據
async function loadCoursesData() {
    try {
        const response = await fetch('assets/database/courses.csv');
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error('加載課程數據失敗:', error);
        return [];
    }
}

// 加載學習進度數據
async function loadLearningProgressData() {
    try {
        const response = await fetch('assets/database/earning_progress.csv');
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error('加載學習進度數據失敗:', error);
        return [];
    }
}

// 解析CSV數據
function parseCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).filter(line => line.trim() !== '').map(line => {
        const values = line.split(',');
        const data = {};
        
        headers.forEach((header, index) => {
            data[header.trim()] = values[index] ? values[index].trim() : '';
        });
        
        return data;
    });
}

// 獲取當前用戶完整資料
async function getCurrentUserData(userId) {
    const users = await loadUserData();
    return users.find(user => user.id === userId) || null;
}

// 獲取用戶的租借歷史
async function getUserRentalHistory(userId) {
    const rentalHistory = await loadRentalHistoryData();
    return rentalHistory.filter(rental => rental.userId === userId);
}

// 獲取用戶的當前預約
async function getUserBookings(userId) {
    const bookings = await loadBookingsData();
    return bookings.filter(booking => booking.UserID === userId && booking.BookingStatus !== 'Cancelled');
}

// 獲取用戶的學習進度
async function getUserLearningProgress(userId) {
    const learningProgress = await loadLearningProgressData();
    return learningProgress.filter(progress => progress.userId === userId);
}

// 獲取所有課程資料
async function getAllCourses() {
    return await loadCoursesData();
}

// 更新本地存儲的數據
function updateLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// 從本地存儲獲取數據
function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// 創建新的預約記錄
async function createBooking(bookingData) {
    const numberOfDemoQrImages = 9; // RH001 to RH009
    const randomDemoQrIndex = Math.floor(Math.random() * numberOfDemoQrImages) + 1;
    // Assign a demo SVG QR code URL to new bookings for demonstration
    bookingData.qrCodeUrl = `assets/images/demo_QR/RH00${randomDemoQrIndex}.svg`;

    bookings.push(bookingData);
    localStorage.setItem('db_bookings', JSON.stringify(bookings));
    
    const newRentalEntry = {
        id: bookingData.BookingID, 
        userId: bookingData.UserID,
        equipmentId: bookingData.ItemCode, 
        equipmentName: bookingData.ItemName,
        startDate: bookingData.StartDate,
        endDate: bookingData.EndDate,
        totalPoints: bookingData.TotalPoints,
        status: bookingData.BookingStatus, 
        qrCodeUrl: bookingData.qrCodeUrl, 
        BookingDate: bookingData.BookingDate 
    };
    rentalHistory.push(newRentalEntry);
    localStorage.setItem('db_rentalHistory', JSON.stringify(rentalHistory));
    
    console.log("Database: Booking created (simulated) with QR Code:", bookingData);
    return { success: true, booking: bookingData, pointsDeducted: bookingData.TotalPoints };
}

// 更新用戶積分
function updateUserPoints(userId, pointsChange) {
    // 在實際應用中，這裡應該發送API請求到後端更新數據
    // 在Demo版本中，我們更新localStorage
    const userData = getFromLocalStorage('currentUserData');
    if (userData && userData.id === userId) {
        userData.points = (parseInt(userData.points) + pointsChange).toString();
        updateLocalStorage('currentUserData', userData);
    }
    return { success: true, newPoints: userData.points };
}

// 初始化用戶會話
async function initUserSession(userId) {
    try {
        // 獲取用戶基本資料
        const userData = await getCurrentUserData(userId);
        if (!userData) throw new Error('用戶不存在');
        
        // 獲取用戶租借歷史
        const rentalHistory = await getUserRentalHistory(userId);
        
        // 獲取用戶當前預約
        const bookings = await getUserBookings(userId);
        
        // 獲取用戶學習進度
        const learningProgress = await getUserLearningProgress(userId);
        
        // 將資料保存到本地存儲
        updateLocalStorage('currentUserData', userData);
        updateLocalStorage('rentalHistory', rentalHistory);
        updateLocalStorage('bookings', bookings);
        updateLocalStorage('learningProgress', learningProgress);
        
        return {
            success: true,
            userData: userData,
            rentalHistory: rentalHistory,
            bookings: bookings,
            learningProgress: learningProgress
        };
    } catch (error) {
        console.error('初始化用戶會話失敗:', error);
        return { success: false, error: error.message };
    }
}

// 導出函數
window.Database = (function() {
    // --- Cached Data ---
    let equipment = [];
    let users = [];
    let bookings = [];
    let rentalHistory = [];
    let courses = [];
    // Detailed stage progress: { userId_courseFileIdentifier: { passedStages: [stageId1], courseCompleted: false } }
    let stageProgressData = {}; 
    // Overall course progress: { userId: { courseFileIdentifier1: { progress: % , completed: bool }, ... } }
    let overallProgressData = {};

    // --- CSV File Paths ---
    const EQUIPMENT_CSV_PATH = 'assets/database/ctv_Equipment_250405.csv';
    const USERS_CSV_PATH = 'assets/database/users.csv';
    const BOOKINGS_CSV_PATH = 'assets/database/bookings.csv';
    const RENTAL_HISTORY_CSV_PATH = 'assets/database/rental_history.csv';
    const COURSES_CSV_PATH = 'assets/database/courses.csv'; // For basic course info
    const STAGE_PROGRESS_CSV_PATH = 'assets/database/learn_progress_stages.csv'; // Conceptual path for stage completions
    const OVERALL_PROGRESS_CSV_PATH = 'assets/database/learning_progress.csv'; // Conceptual path for overall course % and status

    // --- Level Definitions ---
    const levelSystem = {
        levels: [
            { level: 1, name_zh: "基礎", name_en: "Basic", xpToNext: 500 },
            { level: 2, name_zh: "進階", name_en: "Intermediate", xpToNext: 1000 }, // Total 500 to reach, next 1000 (total 1500 for L3)
            { level: 3, name_zh: "專業", name_en: "Professional", xpToNext: 1500 }, // Total 1500 to reach, next 1500 (total 3000 for L4)
            { level: 4, name_zh: "專家", name_en: "Expert", xpToNext: 2000 },       // Total 3000 to reach, next 2000 (total 5000 for L5)
            { level: 5, name_zh: "大師", name_en: "Master", xpToNext: Infinity }    // Max level
        ],
        getLevelInfo: function(levelNumber) {
            return this.levels.find(l => l.level === levelNumber) || this.levels[0];
        },
        getNextLevelInfo: function(currentLevelNumber) {
            return this.levels.find(l => l.level === currentLevelNumber + 1);
        }
    };

    // --- Helper: Basic CSV to Array of Objects (MOVED INSIDE IIFE) ---
    function csvToArray(csvString) {
        if (!csvString || typeof csvString !== 'string') return [];
        const rows = csvString.trim().split('\n');
        if (rows.length < 1) return []; // Allow CSV with only header or even empty
        const headers = rows[0].split(',').map(h => h.trim());
        if (rows.length < 2 && headers.length > 0) return []; // Header only, no data
        
        return rows.slice(1).filter(line => line.trim() !== '').map(rowStr => {
            const values = rowStr.split(',').map(v => v.trim()); // Trim values here
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index]; // Already trimmed
            });
            return obj;
        });
    }

    // --- Helper: Array of Objects to Basic CSV String (MOVED INSIDE IIFE) ---
    function arrayToCsv(dataArray, headers) {
        if (!dataArray || dataArray.length === 0) return headers ? headers.join(',') + '\n' : '';
        const effectiveHeaders = headers || Object.keys(dataArray[0]);
        let csvString = effectiveHeaders.join(',') + '\n';
        dataArray.forEach(obj => {
            csvString += effectiveHeaders.map(header => obj[header] || '').join(',') + '\n';
        });
        return csvString;
    }

    // --- Helper: Fetch and Parse CSV (Uses the above csvToArray) ---
    async function fetchAndParseCsv(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${path}`);
            }
            const csvData = await response.text();
            return csvToArray(csvData); // Corrected call from parseCSV to csvToArray
        } catch (error) {
            console.error(`加載 ${path} 數據失敗:`, error);
            return []; 
        }
    }
    
    // --- Initialization (Comprehensive) ---
    async function initialize() {
        console.log("Database: Full Initialization Starting...");
        
        equipment = await fetchAndParseCsv(EQUIPMENT_CSV_PATH);
        localStorage.setItem('db_equipment', JSON.stringify(equipment));
        console.log("Database: Equipment loaded.", equipment.length);

        users = await fetchAndParseCsv(USERS_CSV_PATH);
        users = users.map(u => ({...u, xp: parseInt(u.xp || 0), xpToNextLevel: parseInt(u.xpToNextLevel || 500), level: parseInt(u.level || 1) }));
        localStorage.setItem('db_users', JSON.stringify(users));
        console.log("Database: Users loaded.", users.length);

        courses = await fetchAndParseCsv(COURSES_CSV_PATH);
        courses = courses.map(c => ({...c, xpReward: parseInt(c.xpReward || 0), pointsReward: parseInt(c.pointsReward || 0) }));
        localStorage.setItem('db_courses', JSON.stringify(courses));
        console.log("Database: Basic Courses info loaded.", courses.length);

        bookings = await fetchAndParseCsv(BOOKINGS_CSV_PATH);
        localStorage.setItem('db_bookings', JSON.stringify(bookings));
        console.log("Database: Bookings loaded.", bookings.length);
        
        rentalHistory = await fetchAndParseCsv(RENTAL_HISTORY_CSV_PATH);
        localStorage.setItem('db_rentalHistory', JSON.stringify(rentalHistory));
        console.log("Database: Rental History loaded.", rentalHistory.length);

        // Load Learning Progress from localStorage (keys will now be userId_actualCourseId)
        const storedStageProgress = localStorage.getItem('db_stageProgressData'); // Key: userId_actualCourseId
        if (storedStageProgress) {
            stageProgressData = JSON.parse(storedStageProgress);
        } else {
            stageProgressData = {}; 
        }
        console.log("Database: Stage progress loaded from localStorage.", Object.keys(stageProgressData).length);

        const storedOverallProgress = localStorage.getItem('db_overallProgressData'); // Key: userId -> { actualCourseId: {progress, completed} }
        if (storedOverallProgress) {
            overallProgressData = JSON.parse(storedOverallProgress);
        } else {
            overallProgressData = {}; 
        }
        console.log("Database: Overall course progress loaded from localStorage.", Object.keys(overallProgressData).length);
        
        console.log("Database: Full Initialization Complete.");
        return true;
    }

    // --- "Save to CSV" Simulation (for learning progress) ---
    function _simulateSaveStageProgressToCsv() {
        let csvRows = [];
        const now = new Date().toISOString();
        for (const userCourseKey in stageProgressData) { // userCourseKey is now userId_actualCourseId
            const [userId, actualCourseId] = userCourseKey.split('_');
            stageProgressData[userCourseKey].passedStages.forEach(stageId => {
                csvRows.push({ userId, courseId: actualCourseId, stageId, timestamp: now }); // Use actualCourseId for courseId column
            });
        }
        const csvString = arrayToCsv(csvRows, ['userId', 'courseId', 'stageId', 'timestamp']);
        console.log(`--- SIMULATED SAVE TO ${STAGE_PROGRESS_CSV_PATH} ---`);
        console.log(csvString);
    }

    function _simulateSaveOverallProgressToCsv() {
        let csvRows = [];
        const now = new Date().toISOString();
        for (const userId in overallProgressData) {
            for (const actualCourseId in overallProgressData[userId]) { // Key is now actualCourseId
                const data = overallProgressData[userId][actualCourseId];
                csvRows.push({
                    userId,
                    courseId: actualCourseId, // Use actualCourseId for courseId column
                    progress_percentage: data.progress,
                    completed_status: data.completed,
                    last_updated_timestamp: now
                });
            }
        }
        const csvString = arrayToCsv(csvRows, ['userId', 'courseId', 'progress_percentage', 'completed_status', 'last_updated_timestamp']);
        console.log(`--- SIMULATED SAVE TO ${OVERALL_PROGRESS_CSV_PATH} ---`);
        console.log(csvString);
    }
    
    // --- Public API ---
    const publicApi = {
        init: initialize,

        // --- Equipment, Users, Bookings, Rentals (Original Structure) ---
        loadEquipmentData: async function() { if (equipment.length === 0) equipment = await fetchAndParseCsv(EQUIPMENT_CSV_PATH); return equipment; },
        loadUserData: async function() { 
            if (users.length === 0 || typeof users[0]?.xp === 'undefined') { 
                users = await fetchAndParseCsv(USERS_CSV_PATH);
                users = users.map(u => ({...u, xp: parseInt(u.xp || 0), xpToNextLevel: parseInt(u.xpToNextLevel || 500), level: parseInt(u.level || 1) }));
                localStorage.setItem('db_users', JSON.stringify(users));
            }
            return users; 
        },
        loadBookingsData: async function() { 
            const storedBookings = localStorage.getItem('db_bookings');
            if (storedBookings) bookings = JSON.parse(storedBookings); 
            else bookings = await fetchAndParseCsv(BOOKINGS_CSV_PATH); 
            return bookings; 
        },
        loadRentalHistoryData: async function() { 
            const storedRentalHistory = localStorage.getItem('db_rentalHistory');
            if (storedRentalHistory) rentalHistory = JSON.parse(storedRentalHistory); 
            else rentalHistory = await fetchAndParseCsv(RENTAL_HISTORY_CSV_PATH); 
            return rentalHistory; 
        },

        getCurrentUserData: async function(userId) {
            await publicApi.loadUserData(); // Ensure users are loaded and parsed
            return users.find(user => user.id === userId || user.userId === userId) || null; // Handle both id and userId keys
        },
        getUserRentalHistory: async function(userId) {
            const allRentalHistory = await publicApi.loadRentalHistoryData();
            return allRentalHistory.filter(rental => rental.userId === userId);
        },
        getUserBookings: async function(userId) {
            const allBookings = await publicApi.loadBookingsData();
            return allBookings.filter(booking => booking.UserID === userId && booking.BookingStatus !== 'Cancelled');
        },
        getBookingById: async function(bookingId) {
            if (!bookingId) return null;
            
            let allBookingsData = JSON.parse(localStorage.getItem('db_bookings') || '[]');
            let booking = allBookingsData.find(b => b.BookingID === bookingId);

            if (booking) {
                // Ensure qrCodeUrl uses .svg if it's one of the demo QRs based on naming convention
                if (booking.qrCodeUrl && booking.qrCodeUrl.startsWith('assets/images/demo_QR/RH') && !booking.qrCodeUrl.endsWith('.svg')) {
                    booking.qrCodeUrl = booking.qrCodeUrl.replace('.png', '.svg'); // Correct if old .png was saved
                }
                return booking;
            }

            let allRentalHistoryData = JSON.parse(localStorage.getItem('db_rentalHistory') || '[]');
            const historyItem = allRentalHistoryData.find(r => r.id === bookingId || r.BookingID === bookingId); // BookingID might be in history for new items

            if (historyItem) {
                let qrUrl = historyItem.qrCodeUrl;
                // If qrCodeUrl is not set in history, but the id matches the RHXXX pattern, construct it
                if (!qrUrl && historyItem.id && historyItem.id.startsWith('RH')) {
                    qrUrl = `assets/images/demo_QR/${historyItem.id}.svg`;
                }
                 // Ensure .svg for demo QRs from history too
                if (qrUrl && qrUrl.startsWith('assets/images/demo_QR/RH') && !qrUrl.endsWith('.svg')) {
                    qrUrl = qrUrl.replace('.png', '.svg');
                }

                return {
                    BookingID: historyItem.id || historyItem.BookingID,
                    UserID: historyItem.userId || historyItem.UserID,
                    ItemCode: historyItem.equipmentId || historyItem.ItemCode,
                    ItemName: historyItem.equipmentName || historyItem.ItemName,
                    StartDate: historyItem.startDate || historyItem.StartDate,
                    EndDate: historyItem.endDate || historyItem.EndDate,
                    BookingStatus: historyItem.status || historyItem.BookingStatus,
                    TotalPoints: historyItem.totalPoints || historyItem.TotalPoints,
                    qrCodeUrl: qrUrl, 
                    BookingDate: historyItem.BookingDate || bookingData.BookingDate || 'N/A' // bookingData not available here, ensure source has it
                };
            }
            return null;
        },
        createBooking: async function(bookingData) {
            const numberOfDemoQrImages = 9; // RH001 to RH009
            const randomDemoQrIndex = Math.floor(Math.random() * numberOfDemoQrImages) + 1;
            // Assign a demo SVG QR code URL to new bookings for demonstration
            bookingData.qrCodeUrl = `assets/images/demo_QR/RH00${randomDemoQrIndex}.svg`;

            bookings.push(bookingData);
            localStorage.setItem('db_bookings', JSON.stringify(bookings));
            
            const newRentalEntry = {
                id: bookingData.BookingID, 
                userId: bookingData.UserID,
                equipmentId: bookingData.ItemCode, 
                equipmentName: bookingData.ItemName,
                startDate: bookingData.StartDate,
                endDate: bookingData.EndDate,
                totalPoints: bookingData.TotalPoints,
                status: bookingData.BookingStatus, 
                qrCodeUrl: bookingData.qrCodeUrl, 
                BookingDate: bookingData.BookingDate 
            };
            rentalHistory.push(newRentalEntry);
            localStorage.setItem('db_rentalHistory', JSON.stringify(rentalHistory));
            
            console.log("Database: Booking created (simulated) with QR Code:", bookingData);
            return { success: true, booking: bookingData, pointsDeducted: bookingData.TotalPoints };
        },
        updateUserPoints: async function(userId, pointsChange) { // Made async to align
            // This should also be a backend operation.
            // Simulating update in cached users array and localStorage.
            if (users.length === 0) await publicApi.loadUserData();
            const userIndex = users.findIndex(u => u.id === userId || u.userId === userId);
            if (userIndex > -1) {
                users[userIndex].points = (parseInt(users[userIndex].points || 0) + pointsChange).toString();
                localStorage.setItem('db_users', JSON.stringify(users));
                // Update currentUserData in localStorage if it matches
                const currentUserData = JSON.parse(localStorage.getItem('currentUserData'));
                if (currentUserData && (currentUserData.id === userId || currentUserData.userId === userId)) {
                    currentUserData.points = users[userIndex].points;
                    localStorage.setItem('currentUserData', JSON.stringify(currentUserData));
                }
                console.log(`Database: User ${userId} points updated by ${pointsChange}. New points: ${users[userIndex].points}`);
                return { success: true, newPoints: users[userIndex].points };
            }
            console.warn(`Database: User ${userId} not found for point update.`);
            return { success: false, error: "User not found" };
        },

        // --- Learning System (Original and New) ---
        getAllCourses: async function() { 
            if (courses.length === 0 || typeof courses[0]?.xpReward === 'undefined') { 
                 courses = await fetchAndParseCsv(COURSES_CSV_PATH);
                 courses = courses.map(c => ({...c, xpReward: parseInt(c.xpReward || 0), pointsReward: parseInt(c.pointsReward || 0) }));
                 localStorage.setItem('db_courses', JSON.stringify(courses));
            }
            return courses;
        },
        
        getUserLearningProgress: async function(userId) { 
             if (!userId) return [];
             const userOverall = publicApi.getAllUserOverallProgress(userId); 
             return Object.entries(userOverall).map(([actualCourseId, data]) => ({
                 userId: userId,
                 courseId: actualCourseId, // This is the actualCourseId (e.g., "C001")
                 progress: data.progress.toString(),
                 completed: data.completed.toString() 
             }));
        },

        // --- New Learning Progress Specific Functions ---
        getUserStageSpecificProgress: function(userId, actualCourseId) { // Param is now actualCourseId
            if (!userId || !actualCourseId) return { passedStages: [], courseCompleted: false };
            const key = `${userId}_${actualCourseId}`;
            return stageProgressData[key] || { passedStages: [], courseCompleted: false };
        },
        
        getUserOverallCourseProgress: function(userId, actualCourseId) { // Param is now actualCourseId
            if (!userId || !actualCourseId) return { progress: 0, completed: false };
            return (overallProgressData[userId] && overallProgressData[userId][actualCourseId]) || { progress: 0, completed: false };
        },

        getAllUserOverallProgress: function(userId) { // Internal keys are now actualCourseId
            if (!userId) return {};
            return overallProgressData[userId] || {};
        },

        saveUserStagePass: function(userId, actualCourseId, stageId) { // Param is now actualCourseId
            if (!userId || !actualCourseId || !stageId) return false;
            const key = `${userId}_${actualCourseId}`;
            if (!stageProgressData[key]) {
                stageProgressData[key] = { passedStages: [], courseCompleted: false };
            }
            if (!stageProgressData[key].passedStages.includes(stageId.toString())) {
                stageProgressData[key].passedStages.push(stageId.toString());
                localStorage.setItem('db_stageProgressData', JSON.stringify(stageProgressData));
                _simulateSaveStageProgressToCsv();
                console.log(`Database: Stage ${stageId} for course ${actualCourseId} saved for ${userId}.`);
                return true;
            }
            return false; 
        },

        updateUserCourseOverallProgress: function(userId, actualCourseId, progressPercentage, isCourseCompleted) { // Param is now actualCourseId
            if (!userId || !actualCourseId) return false;
            if (!overallProgressData[userId]) {
                overallProgressData[userId] = {};
            }
            const oldProgress = overallProgressData[userId][actualCourseId] || {};
            const wasAlreadyCompleted = oldProgress.completed === true;

            overallProgressData[userId][actualCourseId] = {
                progress: Math.round(progressPercentage),
                completed: isCourseCompleted
            };
            localStorage.setItem('db_overallProgressData', JSON.stringify(overallProgressData));
            _simulateSaveOverallProgressToCsv();
            
            const stageProgressKey = `${userId}_${actualCourseId}`;
            if(stageProgressData[stageProgressKey]) {
                if(stageProgressData[stageProgressKey].courseCompleted !== isCourseCompleted && isCourseCompleted){
                    stageProgressData[stageProgressKey].courseCompleted = isCourseCompleted;
                    localStorage.setItem('db_stageProgressData', JSON.stringify(stageProgressData));
                }
            } else if (isCourseCompleted) { 
                 stageProgressData[stageProgressKey] = { passedStages: [], courseCompleted: true }; 
                 localStorage.setItem('db_stageProgressData', JSON.stringify(stageProgressData));
            }
            console.log(`Database: Overall progress for ${actualCourseId} (User: ${userId}) to ${progressPercentage}%, Completed: ${isCourseCompleted}.`);

            // If course is now completed and wasn't before, award XP and Points
            if (isCourseCompleted && !wasAlreadyCompleted) {
                console.log(`Course ${actualCourseId} completed by ${userId}. Attempting to award XP and points.`);
                this.awardXPAndPoints(userId, actualCourseId); // Call the new function
            }
            return true;
        },

        // --- Session Management ---
        initUserSession: async function(userId) { 
            try {
                const userData = await publicApi.getCurrentUserData(userId);
                if (!userData) throw new Error('用戶不存在');
                
                const userRentalHistory = await publicApi.getUserRentalHistory(userId); 
                const userBookings = await publicApi.getUserBookings(userId); 
                const userLearningProgress = await publicApi.getUserLearningProgress(userId); 
                
                localStorage.setItem('currentUserData', JSON.stringify(userData));
                localStorage.setItem('rentalHistory', JSON.stringify(userRentalHistory)); 
                localStorage.setItem('bookings', JSON.stringify(userBookings)); 
                localStorage.setItem('learningProgress', JSON.stringify(userLearningProgress)); 
                
                console.log(`Database: User session initialized for ${userId}.`);
                return {
                    success: true,
                    userData: userData,
                    rentalHistory: userRentalHistory,
                    bookings: userBookings,
                    learningProgress: userLearningProgress
                };
            } catch (error) {
                console.error('初始化用戶會話失敗:', error);
                return { success: false, error: error.message };
            }
        },

        // NEW/MODIFIED function for XP and Level management
        awardXPAndPoints: async function(userId, courseIdForXPLookup) {
            if (!userId || !courseIdForXPLookup) return { success: false, error: "User ID or Course ID missing" };
            
            await publicApi.loadUserData(); // Ensure users data is fresh and parsed
            await publicApi.getAllCourses(); // Ensure courses data is fresh and parsed

            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) return { success: false, error: "User not found" };
            
            const course = courses.find(c => c.courseId === courseIdForXPLookup);
            if (!course) return { success: false, error: "Course not found" };

            const user = users[userIndex];
            const xpEarned = parseInt(course.xpReward || 0);
            const pointsEarned = parseInt(course.pointsReward || 0);

            user.xp = (parseInt(user.xp) || 0) + xpEarned;
            user.points = (parseInt(user.points) || 0) + pointsEarned;

            let leveledUp = false;
            let newLevelInfo = levelSystem.getLevelInfo(user.level);
            
            // Check for level up
            while (user.xp >= newLevelInfo.xpToNext && newLevelInfo.xpToNext !== Infinity) {
                const nextLevel = levelSystem.getNextLevelInfo(user.level);
                if (nextLevel) {
                    user.level = nextLevel.level;
                    user.levelName = pageCurrentLang === 'zh' ? nextLevel.name_zh : nextLevel.name_en; // Assuming pageCurrentLang is accessible or pass it
                    user.levelNameEN = nextLevel.name_en;
                    user.levelNameZH = nextLevel.name_zh; // Storing both for easier access
                    user.xpToNextLevel = nextLevel.xpToNext; 
                    // User XP doesn't reset, it's cumulative. Or, if you want XP per level:
                    // user.xp = user.xp - newLevelInfo.xpToNext; // If XP resets per level
                    newLevelInfo = nextLevel;
                    leveledUp = true;
                    console.log(`User ${userId} leveled up to Level ${user.level}!`);
                } else {
                    break; // Max level reached
                }
            }
            
            users[userIndex] = user; // Update in-memory cache
            localStorage.setItem('db_users', JSON.stringify(users)); // Update all users in localStorage
            
            // Update currentUserData in localStorage if it's the current user
            const currentUserData = JSON.parse(localStorage.getItem('currentUserData'));
            if (currentUserData && currentUserData.id === userId) {
                localStorage.setItem('currentUserData', JSON.stringify(user));
            }

            console.log(`User ${userId} awarded ${xpEarned} XP and ${pointsEarned} points. New XP: ${user.xp}, New Points: ${user.points}`);
            if (leveledUp) {
                alert(t('level_up_message', localStorage.getItem('language')||'zh', {level: user.level, levelName: user.levelName})); // lang.js needs this key
            }

            return { success: true, newXP: user.xp, newPoints: user.points, newLevel: user.level, leveledUp };
        },

        // NEW or MODIFIED function to get a single booking by its ID
        // This should consolidate data from bookings and potentially rentalHistory for a complete view
        getBookingById: async function(bookingId) {
            if (!bookingId) return null;
            
            // First, try to find in the current bookings (which might be from localStorage or freshly fetched)
            let allBookings = [];
            const storedBookings = localStorage.getItem('db_bookings');
            if (storedBookings) {
                allBookings = JSON.parse(storedBookings);
            } else {
                allBookings = await fetchAndParseCsv(BOOKINGS_CSV_PATH); // Fallback if not in localStorage
            }
            const bookingFromBookings = allBookings.find(b => b.BookingID === bookingId);
            if (bookingFromBookings) return bookingFromBookings; // qrCodeUrl should be here if added during createBooking

            // If not in active bookings, check rentalHistory for more complete data or different statuses
            let allRentalHistory = [];
            const storedRentalHistory = localStorage.getItem('db_rentalHistory');
            if (storedRentalHistory) {
                allRentalHistory = JSON.parse(storedRentalHistory);
            } else {
                allRentalHistory = await fetchAndParseCsv(RENTAL_HISTORY_CSV_PATH);
            }
            const bookingFromHistory = allRentalHistory.find(r => r.id === bookingId || r.BookingID === bookingId);
            if (bookingFromHistory) {
                // Map history fields to booking fields if necessary for consistency, or ensure rental-detail.html handles both
                return {
                    BookingID: bookingFromHistory.id || bookingFromHistory.BookingID,
                    UserID: bookingFromHistory.userId || bookingFromHistory.UserID,
                    ItemCode: bookingFromHistory.equipmentId || bookingFromHistory.ItemCode, // Assuming equipmentId maps to ItemCode
                    ItemName: bookingFromHistory.equipmentName || bookingFromHistory.ItemName,
                    StartDate: bookingFromHistory.startDate || bookingFromHistory.StartDate,
                    EndDate: bookingFromHistory.endDate || bookingFromHistory.EndDate,
                    BookingStatus: bookingFromHistory.status || bookingFromHistory.BookingStatus,
                    TotalPoints: bookingFromHistory.totalPoints || bookingFromHistory.TotalPoints,
                    qrCodeUrl: bookingFromHistory.qrCodeUrl, // Ensure this field exists in rentalHistory items too
                    BookingDate: bookingFromHistory.BookingDate || 'N/A' // Assuming BookingDate might not be in all history items
                };
            }
            return null; // Not found in either
        },

        // NEW: Function to update booking status (simulated)
        updateBookingStatus: async function(bookingId, newStatus) {
            if (!bookingId || !newStatus) return { success: false, error: "Missing bookingId or newStatus" };

            let bookingUpdated = false;
            // Update in bookings (localStorage and cache)
            const currentBookings = JSON.parse(localStorage.getItem('db_bookings') || '[]');
            const bookingIndex = currentBookings.findIndex(b => b.BookingID === bookingId);
            if (bookingIndex > -1) {
                currentBookings[bookingIndex].BookingStatus = newStatus;
                localStorage.setItem('db_bookings', JSON.stringify(currentBookings));
                // Also update in-memory cache if it's different from localStorage's source
                const memBookingIndex = bookings.findIndex(b => b.BookingID === bookingId);
                if (memBookingIndex > -1) bookings[memBookingIndex].BookingStatus = newStatus;
                else bookings.push(currentBookings[bookingIndex]); // Add if not in memory (e.g. after refresh)
                bookingUpdated = true;
            }

            // Update in rentalHistory (localStorage and cache)
            const currentRentalHistory = JSON.parse(localStorage.getItem('db_rentalHistory') || '[]');
            const historyIndex = currentRentalHistory.findIndex(r => r.id === bookingId || r.BookingID === bookingId);
            if (historyIndex > -1) {
                currentRentalHistory[historyIndex].status = newStatus;
                localStorage.setItem('db_rentalHistory', JSON.stringify(currentRentalHistory));
                const memHistoryIndex = rentalHistory.findIndex(r => r.id === bookingId || r.BookingID === bookingId);
                if (memHistoryIndex > -1) rentalHistory[memHistoryIndex].status = newStatus;
                else rentalHistory.push(currentRentalHistory[historyIndex]);
                bookingUpdated = true;
            }

            if (bookingUpdated) {
                console.log(`Database: Booking ${bookingId} status updated to ${newStatus} (simulated).`);
                sessionStorage.setItem('refreshDataOnLoad', 'true'); // Trigger refresh on other pages
                return { success: true };
            } else {
                console.warn(`Database: Booking ${bookingId} not found for status update.`);
                return { success: false, error: "Booking not found" };
            }
        }
    };
    return publicApi;
})();

// Auto-initialize the database
window.Database.init().then(success => {
    if(success){
        console.log("Database module fully initialized.");
    } else {
        console.warn("Database module initialization had issues.");
    }
}).catch(error => {
    console.error("Critical error during Database full initialization:", error);
}); 