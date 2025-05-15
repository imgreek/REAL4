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
    // 在實際應用中，這裡應該發送API請求到後端儲存數據
    // 在Demo版本中，我們將數據存儲在localStorage中
    const bookings = getFromLocalStorage('bookings') || [];
    bookings.push(bookingData);
    updateLocalStorage('bookings', bookings);
    
    // 同時更新租借歷史
    const rentals = getFromLocalStorage('rentals') || [];
    rentals.push({
        id: bookingData.BookingID,
        userId: bookingData.UserID,
        equipmentId: bookingData.ItemCode,
        equipmentName: bookingData.ItemName,
        startDate: bookingData.StartDate,
        endDate: bookingData.EndDate,
        totalPoints: bookingData.TotalPoints,
        status: bookingData.BookingStatus
    });
    updateLocalStorage('rentals', rentals);
    
    return { success: true, booking: bookingData };
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

    // --- Helper: Fetch and Parse CSV ---
    async function fetchAndParseCsv(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${path}`);
            }
            const csvData = await response.text();
            return parseCSV(csvData);
        } catch (error) {
            console.error(`加載 ${path} 數據失敗:`, error);
            return []; // Return empty array on error to prevent breaking dependent logic
        }
    }
    
    function parseCSV(csvData) {
        if (!csvData || typeof csvData !== 'string') return [];
        const lines = csvData.split('\n');
        if (lines.length < 1) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).filter(line => line.trim() !== '').map(line => {
            const values = line.split(','); // Don't trim values yet, handle quotes if necessary later
            const data = {};
            headers.forEach((header, index) => {
                data[header] = values[index] ? values[index].trim() : '';
            });
            return data;
        });
    }

    // --- Initialization (Comprehensive) ---
    async function initialize() {
        console.log("Database: Full Initialization Starting...");
        
        equipment = await fetchAndParseCsv(EQUIPMENT_CSV_PATH);
        localStorage.setItem('db_equipment', JSON.stringify(equipment));
        console.log("Database: Equipment loaded.", equipment.length);

        users = await fetchAndParseCsv(USERS_CSV_PATH);
        localStorage.setItem('db_users', JSON.stringify(users));
        console.log("Database: Users loaded.", users.length);

        courses = await fetchAndParseCsv(COURSES_CSV_PATH);
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
        loadEquipmentData: async function() { 
            if (equipment.length === 0) equipment = await fetchAndParseCsv(EQUIPMENT_CSV_PATH); 
            return equipment; 
        },
        loadUserData: async function() { 
            if (users.length === 0) users = await fetchAndParseCsv(USERS_CSV_PATH); 
            return users; 
        },
        loadBookingsData: async function() { 
            // Bookings can change, so maybe re-fetch or use localStorage as source of truth after init
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

        getCurrentUserData: async function(userId) { // Renamed from getUserById for clarity with original naming
            if (users.length === 0) await publicApi.loadUserData();
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
        createBooking: async function(bookingData) {
            // This function should ideally interact with a backend.
            // For demo, updating local cache and localStorage.
            bookings.push(bookingData);
            localStorage.setItem('db_bookings', JSON.stringify(bookings));
            
            // Simulate updating rental history as well (original logic)
            const newRentalEntry = {
                id: bookingData.BookingID, // Assuming BookingID is unique for rental history id
                userId: bookingData.UserID,
                equipmentId: bookingData.ItemCode, // Match original fields
                equipmentName: bookingData.ItemName,
                startDate: bookingData.StartDate,
                endDate: bookingData.EndDate,
                totalPoints: bookingData.TotalPoints,
                status: bookingData.BookingStatus // e.g., 'Confirmed', 'Pending Pickup'
            };
            rentalHistory.push(newRentalEntry);
            localStorage.setItem('db_rentalHistory', JSON.stringify(rentalHistory));
            
            console.log("Database: Booking created (simulated)", bookingData);
            return { success: true, booking: bookingData };
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
            if (courses.length === 0) {
                 try { courses = await fetchAndParseCsv(COURSES_CSV_PATH); localStorage.setItem('db_courses', JSON.stringify(courses)); } catch(e){ const c =localStorage.getItem('db_courses'); if(c)courses=JSON.parse(c);}
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
                 // Logic for populating passedStages if course is directly marked complete might be needed if courses can have 0 stages.
                 // For now, this ensures the courseCompleted flag is set.
                 localStorage.setItem('db_stageProgressData', JSON.stringify(stageProgressData));
            }
            console.log(`Database: Overall progress for ${actualCourseId} (User: ${userId}) to ${progressPercentage}%, Completed: ${isCourseCompleted}.`);
            return true;
        },

        // --- Session Management ---
        initUserSession: async function(userId) { 
            try {
                const userData = await publicApi.getCurrentUserData(userId);
                if (!userData) throw new Error('用戶不存在');
                
                const userRentalHistory = await publicApi.getUserRentalHistory(userId); 
                const userBookings = await publicApi.getUserBookings(userId); 
                const userLearningProgress = await publicApi.getUserLearningProgress(userId); // This now returns items with actualCourseId
                
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