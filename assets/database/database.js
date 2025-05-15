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
        
        // Load static data first
        equipment = await fetchAndParseCsv(EQUIPMENT_CSV_PATH);
        localStorage.setItem('db_equipment', JSON.stringify(equipment));
        console.log("Database: Equipment loaded.", equipment.length);

        users = await fetchAndParseCsv(USERS_CSV_PATH);
        localStorage.setItem('db_users', JSON.stringify(users));
        console.log("Database: Users loaded.", users.length);

        courses = await fetchAndParseCsv(COURSES_CSV_PATH); // Basic course info
        localStorage.setItem('db_courses', JSON.stringify(courses));
        console.log("Database: Basic Courses info loaded.", courses.length);

        // Load data that might be initially empty or user-specific later
        bookings = await fetchAndParseCsv(BOOKINGS_CSV_PATH);
        localStorage.setItem('db_bookings', JSON.stringify(bookings));
        console.log("Database: Bookings loaded.", bookings.length);
        
        rentalHistory = await fetchAndParseCsv(RENTAL_HISTORY_CSV_PATH);
        localStorage.setItem('db_rentalHistory', JSON.stringify(rentalHistory));
        console.log("Database: Rental History loaded.", rentalHistory.length);

        // Load Learning Progress from localStorage (as it's more dynamic and UI-driven)
        const storedStageProgress = localStorage.getItem('db_stageProgressData');
        if (storedStageProgress) {
            stageProgressData = JSON.parse(storedStageProgress);
        } else {
            stageProgressData = {}; // Initialize if not found
        }
        console.log("Database: Stage progress loaded from localStorage.", Object.keys(stageProgressData).length);

        const storedOverallProgress = localStorage.getItem('db_overallProgressData');
        if (storedOverallProgress) {
            overallProgressData = JSON.parse(storedOverallProgress);
        } else {
            overallProgressData = {}; // Initialize
        }
        console.log("Database: Overall course progress loaded from localStorage.", Object.keys(overallProgressData).length);
        
        console.log("Database: Full Initialization Complete.");
        return true;
    }

    // --- "Save to CSV" Simulation (for learning progress) ---
    function _simulateSaveStageProgressToCsv() {
        let csvRows = [];
        const now = new Date().toISOString();
        for (const userCourseKey in stageProgressData) {
            const [userId, courseId] = userCourseKey.split('_');
            stageProgressData[userCourseKey].passedStages.forEach(stageId => {
                csvRows.push({ userId, courseId, stageId, timestamp: now });
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
            for (const courseId in overallProgressData[userId]) {
                const data = overallProgressData[userId][courseId];
                csvRows.push({
                    userId,
                    courseId,
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
        getAllCourses: async function() { // For basic course info from courses.csv
            if (courses.length === 0) courses = await fetchAndParseCsv(COURSES_CSV_PATH);
            return courses;
        },
        // Legacy function name from original, maps to new overall progress getter
        getUserLearningProgress: async function(userId) { 
             // This used to load earning_progress.csv. Now it should reflect the overall progress structure.
             // For compatibility, we can try to structure its output similarly if needed,
             // or other pages should adapt to use getAllUserOverallProgress.
             // For now, let's return the structure from getAllUserOverallProgress.
             if (!userId) return [];
             const userOverall = publicApi.getAllUserOverallProgress(userId); // This is synchronous
             // Convert it to an array format if the old system expected an array [{courseId, progress, completed}, ...]
             return Object.entries(userOverall).map(([courseId, data]) => ({
                 userId: userId,
                 courseId: courseId, // this is courseFileIdentifier
                 progress: data.progress.toString(),
                 completed: data.completed.toString() 
             }));
        },

        // --- New Learning Progress Specific Functions ---
        getUserStageSpecificProgress: function(userId, courseFileIdentifier) {
            if (!userId || !courseFileIdentifier) return { passedStages: [], courseCompleted: false };
            const key = `${userId}_${courseFileIdentifier}`;
            return stageProgressData[key] || { passedStages: [], courseCompleted: false };
        },
        
        getUserOverallCourseProgress: function(userId, courseFileIdentifier) { // Specific course
            if (!userId || !courseFileIdentifier) return { progress: 0, completed: false };
            return (overallProgressData[userId] && overallProgressData[userId][courseFileIdentifier]) || { progress: 0, completed: false };
        },

        getAllUserOverallProgress: function(userId) { // All courses for a user
            if (!userId) return {};
            return overallProgressData[userId] || {};
        },

        saveUserStagePass: function(userId, courseFileIdentifier, stageId) {
            if (!userId || !courseFileIdentifier || !stageId) return false;
            const key = `${userId}_${courseFileIdentifier}`;
            if (!stageProgressData[key]) {
                stageProgressData[key] = { passedStages: [], courseCompleted: false };
            }
            if (!stageProgressData[key].passedStages.includes(stageId.toString())) {
                stageProgressData[key].passedStages.push(stageId.toString());
                localStorage.setItem('db_stageProgressData', JSON.stringify(stageProgressData));
                _simulateSaveStageProgressToCsv();
                console.log(`Database: Stage ${stageId} for ${courseFileIdentifier} saved for ${userId}.`);
                return true;
            }
            return false; 
        },

        updateUserCourseOverallProgress: function(userId, courseFileIdentifier, progressPercentage, isCourseCompleted) {
            if (!userId || !courseFileIdentifier) return false;
            if (!overallProgressData[userId]) {
                overallProgressData[userId] = {};
            }
            overallProgressData[userId][courseFileIdentifier] = {
                progress: Math.round(progressPercentage),
                completed: isCourseCompleted
            };
            localStorage.setItem('db_overallProgressData', JSON.stringify(overallProgressData));
            _simulateSaveOverallProgressToCsv();
            
            const stageProgressKey = `${userId}_${courseFileIdentifier}`;
            if(stageProgressData[stageProgressKey]) {
                if(stageProgressData[stageProgressKey].courseCompleted !== isCourseCompleted && isCourseCompleted){
                    stageProgressData[stageProgressKey].courseCompleted = isCourseCompleted;
                    localStorage.setItem('db_stageProgressData', JSON.stringify(stageProgressData));
                }
            } else if (isCourseCompleted) { 
                 stageProgressData[stageProgressKey] = { passedStages: [], courseCompleted: true }; 
                 // If marking course complete overall, but no prior stage data, assume all stages are passed for this context.
                 // Or, this state might indicate an issue if a course can only be completed by passing stages.
                 // For now, just ensure the courseCompleted flag is set in stageProgressData.
                 const courseInfo = courses.find(c => (c.contentPath ? c.contentPath.split('/').pop().replace('.md','') : c.courseId) === courseFileIdentifier);
                 if (courseInfo) { // Try to get stages from course JSON if possible (not directly available here)
                    // This part is complex as stage info (number of stages) isn't directly in database.js from courses.csv
                    // We rely on course-detail.html to provide the full list of stages for a course.
                    // For simplicity, if overall is marked completed, we just ensure the flag is true here.
                 }
                 localStorage.setItem('db_stageProgressData', JSON.stringify(stageProgressData));
            }
            console.log(`Database: Overall progress for ${courseFileIdentifier} (User: ${userId}) to ${progressPercentage}%, Completed: ${isCourseCompleted}.`);
            return true;
        },

        // --- Session Management ---
        initUserSession: async function(userId) { // From original
            try {
                const userData = await publicApi.getCurrentUserData(userId);
                if (!userData) throw new Error('用戶不存在');
                
                const userRentalHistory = await publicApi.getUserRentalHistory(userId); // Use renamed var
                const userBookings = await publicApi.getUserBookings(userId); // Use renamed var
                
                // For learning progress, we can use the new more granular data or the overall.
                // Let's stick to the overall for this session summary for now, similar to original.
                const userLearningProgress = await publicApi.getUserLearningProgress(userId); // Uses the new overall data
                
                localStorage.setItem('currentUserData', JSON.stringify(userData));
                localStorage.setItem('rentalHistory', JSON.stringify(userRentalHistory)); // Use renamed var
                localStorage.setItem('bookings', JSON.stringify(userBookings)); // Use renamed var
                localStorage.setItem('learningProgress', JSON.stringify(userLearningProgress)); // This is now overall progress
                
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