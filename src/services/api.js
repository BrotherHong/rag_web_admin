// 模擬 API 延遲
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 權限級別定義
const ROLES = {
  ADMIN: 'admin',      // 最高權限：可以做所有操作
  MANAGER: 'manager',  // 中等權限：可以管理檔案和分類，不能管理使用者
  VIEWER: 'viewer'     // 最低權限：只能查看，不能修改
};

// 權限檢查工具函數
const checkPermission = (requiredRole) => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return { hasPermission: false, message: '未登入' };
    }
    
    const user = JSON.parse(userStr);
    const userRole = user.role;
    
    // 權限層級：admin > manager > viewer
    const roleHierarchy = {
      admin: 3,
      manager: 2,
      viewer: 1
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    if (userLevel >= requiredLevel) {
      return { hasPermission: true };
    }
    
    return { 
      hasPermission: false, 
      message: '權限不足，此操作需要更高權限'
    };
  } catch (error) {
    return { hasPermission: false, message: '權限驗證失敗' };
  }
};

// 取得當前使用者
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// 模擬後端資料庫
let mockDatabase = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: '系統管理員', email: 'admin@ncku.edu.tw' },
    { id: 2, username: 'hr_manager', password: 'manager123', role: 'manager', name: '人事主管', email: 'hr@ncku.edu.tw' },
    { id: 3, username: 'viewer', password: 'viewer123', role: 'viewer', name: '一般檢視者', email: 'viewer@ncku.edu.tw' }
  ],
  // 分類資料（統一管理）
  categories: [
    { id: 1, name: '規章制度', color: 'blue', createdAt: '2025-10-01' },
    { id: 2, name: '請假相關', color: 'green', createdAt: '2025-10-01' },
    { id: 3, name: '薪資福利', color: 'yellow', createdAt: '2025-10-01' },
    { id: 4, name: '未分類', color: 'gray', createdAt: '2025-10-01' }
  ],
  files: [
    { id: 1, name: '人事規章.pdf', size: '2.4 MB', uploadDate: '2025-10-15', category: '規章制度', uploader: 'admin' },
    { id: 2, name: '請假辦法.docx', size: '890 KB', uploadDate: '2025-10-14', category: '請假相關', uploader: 'admin' },
    { id: 3, name: '薪資計算說明.pdf', size: '1.2 MB', uploadDate: '2025-10-13', category: '薪資福利', uploader: 'admin' },
    { id: 4, name: '年終獎金發放辦法.pdf', size: '650 KB', uploadDate: '2025-10-12', category: '薪資福利', uploader: 'hr_manager' },
    { id: 5, name: '教職員工手冊.pdf', size: '5.8 MB', uploadDate: '2025-10-10', category: '規章制度', uploader: 'admin' },
    { id: 6, name: '差勤管理辦法.pdf', size: '1.5 MB', uploadDate: '2025-10-09', category: '規章制度', uploader: 'admin' },
    { id: 7, name: '特休假申請流程.docx', size: '450 KB', uploadDate: '2025-10-08', category: '請假相關', uploader: 'hr_manager' },
    { id: 8, name: '加班費計算方式.pdf', size: '780 KB', uploadDate: '2025-10-07', category: '薪資福利', uploader: 'admin' }
  ],
  statistics: {
    totalFiles: 8,
    monthlyQueries: 1234,
    systemStatus: 'running'
  },
  activities: [
    { id: 1, type: 'upload', fileName: '人事規章.pdf', user: 'admin', timestamp: '2025-10-15T10:30:00' },
    { id: 2, type: 'delete', fileName: '舊版規章.pdf', user: 'admin', timestamp: '2025-10-14T15:20:00' },
    { id: 3, type: 'upload', fileName: '請假辦法.docx', user: 'admin', timestamp: '2025-10-14T09:15:00' }
  ],
  // 系統設定
  settings: {
    // AI 模型設定
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    tone: 'professional',
    
    // 知識庫設定
    similarityThreshold: 0.75,
    maxRetrievalDocs: 5,
    autoCleanupDays: 90,
    indexUpdateFrequency: 'daily',
    
    // 通知設定
    emailNotifications: true,
    uploadSuccessNotif: true,
    uploadFailNotif: true,
    storageWarning: true,
    weeklyReport: false,
    
    // 備份設定
    autoBackup: true,
    backupFrequency: 'weekly',
  },
  // 上傳任務追蹤（支援多管理員並發）
  uploadTasks: {}
};

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ==================== 認證 API ====================

/**
 * 登入 API
 * @param {string} username - 使用者帳號
 * @param {string} password - 使用者密碼
 * @returns {Promise} 登入結果
 */
export const login = async (username, password) => {
  await delay(800); // 模擬網路延遲
  
  try {
    // 模擬 API 呼叫
    // const response = await fetch(`${API_BASE_URL}/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password })
    // });
    
    // 模擬後端驗證邏輯
    const user = mockDatabase.users.find(
      u => u.username === username && u.password === password
    );
    
    if (user) {
      const token = `mock_token_${user.id}_${Date.now()}`;
      return {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          },
          token: token
        },
        message: '登入成功'
      };
    } else {
      return {
        success: false,
        message: '帳號或密碼錯誤'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '登入失敗，請稍後再試'
    };
  }
};

/**
 * 登出 API
 * @returns {Promise} 登出結果
 */
export const logout = async () => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   }
    // });
    
    return {
      success: true,
      message: '登出成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '登出失敗'
    };
  }
};

/**
 * 驗證 Token
 * @returns {Promise} 驗證結果
 */
export const verifyToken = async () => {
  await delay(500);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, message: '未登入' };
    }
    
    // const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // });
    
    return {
      success: true,
      data: { valid: true }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Token 驗證失敗'
    };
  }
};

// ==================== 知識庫檔案 API ====================

/**
 * 取得所有檔案
 * @param {Object} params - 查詢參數 { search, category, page, limit }
 * @returns {Promise} 檔案列表
 */
export const getFiles = async (params = {}) => {
  await delay(600);
  
  try {
    // const queryString = new URLSearchParams(params).toString();
    // const response = await fetch(`${API_BASE_URL}/files?${queryString}`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    let files = [...mockDatabase.files];
    
    // 模擬搜尋過濾
    if (params.search) {
      files = files.filter(f => 
        f.name.toLowerCase().includes(params.search.toLowerCase())
      );
    }
    
    // 模擬分類過濾
    if (params.category && params.category !== 'all') {
      files = files.filter(f => f.category === params.category);
    }
    
    return {
      success: true,
      data: {
        files: files,
        total: files.length,
        page: params.page || 1,
        limit: params.limit || 10
      }
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取檔案列表失敗'
    };
  }
};

/**
 * 上傳檔案
 * @param {FormData} formData - 包含檔案的表單資料
 * @returns {Promise} 上傳結果
 */
export const uploadFile = async (formData) => {
  await delay(1500); // 模擬較長的上傳時間
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/upload`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    //   body: formData
    // });
    
    // 模擬從 FormData 中提取檔案資訊
    const file = formData.get('file');
    const category = formData.get('category') || '未分類';
    
    if (file) {
      const newFile = {
        id: mockDatabase.files.length + 1,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString().split('T')[0],
        category: category,
        uploader: 'admin'
      };
      
      mockDatabase.files.push(newFile);
      
      // 新增活動記錄
      mockDatabase.activities.unshift({
        id: mockDatabase.activities.length + 1,
        type: 'upload',
        fileName: newFile.name,
        user: 'admin',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        data: newFile,
        message: '檔案上傳成功'
      };
    } else {
      return {
        success: false,
        message: '未選擇檔案'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '檔案上傳失敗'
    };
  }
};

/**
 * 刪除檔案
 * @param {number} fileId - 檔案 ID
 * @returns {Promise} 刪除結果
 */
export const deleteFile = async (fileId) => {
  await delay(500);
  
  try {
    // 權限檢查：需要 manager 以上權限
    const permission = checkPermission(ROLES.MANAGER);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const fileIndex = mockDatabase.files.findIndex(f => f.id === fileId);
    
    if (fileIndex !== -1) {
      const deletedFile = mockDatabase.files[fileIndex];
      mockDatabase.files.splice(fileIndex, 1);
      
      const currentUser = getCurrentUser();
      
      // 新增活動記錄
      mockDatabase.activities.unshift({
        id: mockDatabase.activities.length + 1,
        type: 'delete',
        fileName: deletedFile.name,
        user: currentUser?.name || 'admin',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: '檔案刪除成功'
      };
    } else {
      return {
        success: false,
        message: '檔案不存在'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '檔案刪除失敗'
    };
  }
};

/**
 * 下載檔案
 * @param {number} fileId - 檔案 ID
 * @returns {Promise} 下載連結
 */
export const downloadFile = async (fileId) => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const file = mockDatabase.files.find(f => f.id === fileId);
    
    if (file) {
      return {
        success: true,
        data: {
          url: `${API_BASE_URL}/files/download/${fileId}`,
          fileName: file.name
        }
      };
    } else {
      return {
        success: false,
        message: '檔案不存在'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '下載檔案失敗'
    };
  }
};

// ==================== 統計資料 API ====================

/**
 * 取得系統統計資料
 * @returns {Promise} 統計資料
 */
export const getStatistics = async () => {
  await delay(400);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/statistics`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const stats = {
      totalFiles: mockDatabase.files.length,
      filesByCategory: {
        '規章制度': mockDatabase.files.filter(f => f.category === '規章制度').length,
        '請假相關': mockDatabase.files.filter(f => f.category === '請假相關').length,
        '薪資福利': mockDatabase.files.filter(f => f.category === '薪資福利').length,
      },
      monthlyQueries: mockDatabase.statistics.monthlyQueries,
      systemStatus: mockDatabase.statistics.systemStatus,
      storageUsed: '45.6 GB',
      storageTotal: '100 GB'
    };
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取統計資料失敗'
    };
  }
};

/**
 * 取得最近活動記錄
 * @param {number} limit - 限制數量
 * @returns {Promise} 活動記錄
 */
export const getRecentActivities = async (limit = 10) => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/activities?limit=${limit}`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const activities = mockDatabase.activities.slice(0, limit);
    
    return {
      success: true,
      data: activities
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取活動記錄失敗'
    };
  }
};

// ==================== 分類管理 API ====================

/**
 * 取得所有分類（僅分類名稱）
 * @returns {Promise} 分類名稱列表
 */
export const getCategories = async () => {
  await delay(200);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/categories`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    // 從 mockDatabase.categories 動態取得分類名稱
    let categories = mockDatabase.categories.map(cat => cat.name);
    
    // 將「未分類」排在最後
    categories = categories.sort((a, b) => {
      if (a === '未分類') return 1;
      if (b === '未分類') return -1;
      return 0;
    });
    
    return {
      success: true,
      data: categories
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取分類失敗'
    };
  }
};

/**
 * 取得所有分類（含詳細資訊）
 * @returns {Promise} 分類詳細列表
 */
export const getCategoriesWithDetails = async () => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/categories/details`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    // 從 mockDatabase.categories 動態取得分類，並計算檔案數量
    const categoriesWithDetails = mockDatabase.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      count: mockDatabase.files.filter(f => f.category === cat.name).length,
      createdAt: cat.createdAt
    }));
    
    // 將「未分類」排在最後
    const sortedCategories = categoriesWithDetails.sort((a, b) => {
      if (a.name === '未分類') return 1;
      if (b.name === '未分類') return -1;
      return 0;
    });
    
    return {
      success: true,
      data: sortedCategories
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取分類詳細資訊失敗'
    };
  }
};

/**
 * 新增分類
 * @param {string} name - 分類名稱
 * @param {string} color - 分類顏色
 * @returns {Promise} 新增結果
 */
export const addCategory = async (name, color = 'gray') => {
  await delay(400);
  
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const response = await fetch(`${API_BASE_URL}/categories`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ name, color })
    // });
    
    // 檢查分類名稱是否已存在
    const exists = mockDatabase.categories.find(cat => cat.name === name);
    if (exists) {
      return {
        success: false,
        message: '分類名稱已存在'
      };
    }
    
    // 新增到 mockDatabase.categories
    const newCategory = {
      id: Date.now(),
      name: name,
      color: color,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    mockDatabase.categories.push(newCategory);
    
    // 記錄活動
    const currentUser = getCurrentUser();
    mockDatabase.activities.unshift({
      id: mockDatabase.activities.length + 1,
      type: 'category_add',
      categoryName: name,
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      data: {
        ...newCategory,
        count: 0
      },
      message: '分類新增成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '新增分類失敗'
    };
  }
};

/**
 * 刪除分類
 * @param {number} categoryId - 分類 ID
 * @returns {Promise} 刪除結果
 */
export const deleteCategory = async (categoryId) => {
  await delay(400);
  
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const categoryIndex = mockDatabase.categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return {
        success: false,
        message: '分類不存在'
      };
    }
    
    const category = mockDatabase.categories[categoryIndex];
    
    // 禁止刪除「未分類」
    if (category.name === '未分類') {
      return {
        success: false,
        message: '無法刪除預設分類「未分類」'
      };
    }
    
    // 檢查是否有檔案使用此分類
    const filesWithCategory = mockDatabase.files.filter(f => f.category === category.name);
    
    if (filesWithCategory.length > 0) {
      // 將使用此分類的檔案改為「未分類」
      filesWithCategory.forEach(file => {
        file.category = '未分類';
      });
    }
    
    // 從 mockDatabase.categories 中刪除
    mockDatabase.categories.splice(categoryIndex, 1);
    
    // 記錄活動
    const currentUser = getCurrentUser();
    mockDatabase.activities.unshift({
      id: mockDatabase.activities.length + 1,
      type: 'category_delete',
      categoryName: category.name,
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: filesWithCategory.length > 0 
        ? `分類已刪除，${filesWithCategory.length} 個檔案已移至「未分類」` 
        : '分類刪除成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '刪除分類失敗'
    };
  }
};

// ==================== 批次上傳 API ====================

/**
 * 檢查重複檔案並找出相關檔案
 * @param {Array} fileList - 待檢查的檔案列表 [{ name, size, type }]
 * @returns {Promise} 檢查結果，包含重複和相關檔案
 */
export const checkDuplicates = async (fileList) => {
  await delay(800);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/check-duplicates`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ files: fileList })
    // });
    
    const results = fileList.map(file => {
      // 檢查完全重複（檔名相同）
      const exactMatch = mockDatabase.files.find(f => f.name === file.name);
      
      // 檢查可能相關（檔名相似度）
      const relatedFiles = mockDatabase.files.filter(f => {
        const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // 移除副檔名
        const dbFileName = f.name.toLowerCase().replace(/\.[^/.]+$/, '');
        
        // 簡單的相似度檢測：包含相同關鍵詞
        const keywords = fileName.split(/[\s_-]+/);
        return keywords.some(keyword => 
          keyword.length > 2 && dbFileName.includes(keyword)
        );
      });
      
      return {
        fileName: file.name,
        isDuplicate: !!exactMatch,
        duplicateFile: exactMatch || null,
        relatedFiles: relatedFiles.filter(f => f.name !== file.name),
        suggestReplace: relatedFiles.length > 0
      };
    });
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      message: '檢查重複檔案失敗'
    };
  }
};

/**
 * 批次上傳檔案到知識庫
 * @param {Object} uploadData - { files: File[], categoriess: {}, removeFileIds: [] }
 * @returns {Promise} 上傳任務 ID
 */
export const batchUpload = async (uploadData) => {
  await delay(500);
  
  try {
    // 權限檢查：需要 manager 以上權限
    const permission = checkPermission(ROLES.MANAGER);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const formData = new FormData();
    // uploadData.files.forEach(file => formData.append('files', file));
    // formData.append('categories', JSON.stringify(uploadData.categories));
    // formData.append('removeFileIds', JSON.stringify(uploadData.removeFileIds));
    
    // const response = await fetch(`${API_BASE_URL}/files/batch-upload`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    //   body: formData
    // });
    
    const user = getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: '未登入'
      };
    }
    
    const taskId = `task_${user.id}_${Date.now()}`;
    
    // 創建上傳任務
    const task = {
      id: taskId,
      userId: user.id,
      userName: user.name,
      status: 'pending', // pending, processing, completed, failed
      totalFiles: uploadData.files.length,
      processedFiles: 0,
      successFiles: 0,
      failedFiles: 0,
      deletedFiles: 0, // 新增：追蹤已刪除的舊檔案數量
      currentFile: null,
      files: uploadData.files.map((file, index) => ({
        id: `file_${index}`,
        name: file.name,
        size: file.size,
        status: 'pending', // pending, processing, completed, failed
        progress: 0,
        error: null
      })),
      removeFileIds: uploadData.removeFileIds || [],
      categories: uploadData.categories || {},
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };
    
    mockDatabase.uploadTasks[taskId] = task;
    
    // 異步處理上傳（模擬後端處理）
    processUploadTask(taskId, uploadData);
    
    return {
      success: true,
      data: {
        taskId: taskId,
        message: '上傳任務已建立，開始處理檔案'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: '建立上傳任務失敗'
    };
  }
};

/**
 * 模擬處理上傳任務（在實際應用中這會在後端執行）
 * @param {string} taskId - 任務 ID
 * @param {Object} uploadData - 上傳資料
 */
const processUploadTask = async (taskId, uploadData) => {
  const task = mockDatabase.uploadTasks[taskId];
  if (!task) return;
  
  console.log('🚀 開始處理上傳任務:', taskId, '檔案數量:', uploadData.files.length);
  
  // 更新任務狀態為處理中
  task.status = 'processing';
  
  // 先刪除要移除的舊檔案
  if (uploadData.removeFileIds && uploadData.removeFileIds.length > 0) {
    for (const fileId of uploadData.removeFileIds) {
      const fileIndex = mockDatabase.files.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        const deletedFile = mockDatabase.files[fileIndex];
        mockDatabase.files.splice(fileIndex, 1);
        
        // 增加刪除計數
        task.deletedFiles++;
        
        mockDatabase.activities.unshift({
          id: mockDatabase.activities.length + 1,
          type: 'delete',
          fileName: deletedFile.name,
          user: task.userName,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  // 處理每個檔案
  for (let i = 0; i < uploadData.files.length; i++) {
    const file = uploadData.files[i];
    const fileTask = task.files[i];
    
    // 更新當前處理檔案
    task.currentFile = file.name;
    fileTask.status = 'processing';
    fileTask.progress = 0; // 立即設置為 0%
    
    try {
      // 模擬處理過程（分段更新進度）
      // 改為更細緻的進度更新，讓使用者能看到完整過程
      for (let progress = 10; progress <= 100; progress += 10) {
        await delay(500); // 每 10% 延遲 500ms，單檔總時間約 5 秒
        fileTask.progress = progress;
        console.log(`📁 ${file.name}: ${progress}%`);
      }
      
      // 模擬隨機失敗（10% 機率）
      if (Math.random() < 0.1) {
        throw new Error('檔案處理失敗：格式不支援或檔案損壞');
      }
      
      // 成功：添加到資料庫
      const newFile = {
        id: mockDatabase.files.length + 1,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString().split('T')[0],
        category: uploadData.categories[file.name] || '未分類',
        uploader: task.userName
      };
      
      mockDatabase.files.push(newFile);
      
      mockDatabase.activities.unshift({
        id: mockDatabase.activities.length + 1,
        type: 'upload',
        fileName: newFile.name,
        user: task.userName,
        timestamp: new Date().toISOString()
      });
      
      fileTask.status = 'completed';
      fileTask.progress = 100;
      task.successFiles++;
      
    } catch (error) {
      fileTask.status = 'failed';
      fileTask.error = error.message;
      task.failedFiles++;
    }
    
    task.processedFiles++;
  }
  
  // 任務完成
  task.status = task.failedFiles === 0 ? 'completed' : 'partial';
  task.currentFile = null;
  task.endTime = new Date().toISOString();
};

/**
 * 取得上傳任務進度
 * @param {string} taskId - 任務 ID
 * @returns {Promise} 任務進度資訊
 */
export const getUploadProgress = async (taskId) => {
  await delay(200);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/upload-progress/${taskId}`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const task = mockDatabase.uploadTasks[taskId];
    
    if (!task) {
      return {
        success: false,
        message: '找不到該上傳任務'
      };
    }
    
    return {
      success: true,
      data: task
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取上傳進度失敗'
    };
  }
};

/**
 * 取得使用者的所有上傳任務
 * @returns {Promise} 任務列表
 */
export const getUserUploadTasks = async () => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/upload-tasks`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userTasks = Object.values(mockDatabase.uploadTasks)
      .filter(task => task.userId === user.id)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    return {
      success: true,
      data: userTasks
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取上傳任務列表失敗'
    };
  }
};

/**
 * 刪除已完成的上傳任務記錄
 * @param {string} taskId - 任務 ID
 * @returns {Promise} 刪除結果
 */
export const deleteUploadTask = async (taskId) => {
  await delay(200);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/upload-tasks/${taskId}`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    if (mockDatabase.uploadTasks[taskId]) {
      delete mockDatabase.uploadTasks[taskId];
      return {
        success: true,
        message: '任務記錄已刪除'
      };
    } else {
      return {
        success: false,
        message: '找不到該任務'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '刪除任務失敗'
    };
  }
};

// 匯出所有 API
export default {
  // 認證
  login,
  logout,
  verifyToken,
  
  // 檔案管理
  getFiles,
  uploadFile,
  deleteFile,
  downloadFile,
  
  // 統計與活動
  getStatistics,
  getRecentActivities,
  
  // 分類
  getCategories,
  
  // 批次上傳
  checkDuplicates,
  batchUpload,
  getUploadProgress,
  getUserUploadTasks,
  deleteUploadTask
};

// ==================== 使用者管理 API ====================

/**
 * 取得所有使用者
 * @returns {Promise} 使用者列表
 */
export const getUsers = async () => {
  await delay(400);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/users`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const users = mockDatabase.users.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email || user.username + '@example.com',
      role: user.role,
      status: 'active'
    }));
    
    return {
      success: true,
      data: users
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取使用者列表失敗'
    };
  }
};

/**
 * 新增使用者
 * @param {Object} userData - 使用者資料
 * @returns {Promise} 新增結果
 */
export const addUser = async (userData) => {
  await delay(500);
  
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const response = await fetch(`${API_BASE_URL}/users`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(userData)
    // });
    
    // 檢查使用者名稱是否已存在
    const exists = mockDatabase.users.find(u => u.username === userData.username);
    if (exists) {
      return {
        success: false,
        message: '使用者名稱已存在'
      };
    }
    
    // 檢查 Email 是否已存在
    if (userData.email) {
      const emailExists = mockDatabase.users.find(u => u.email === userData.email);
      if (emailExists) {
        return {
          success: false,
          message: 'Email 已存在'
        };
      }
    }
    
    // 新增使用者到 mockDatabase
    const newUser = {
      id: Date.now(),
      name: userData.name,
      username: userData.username,
      email: userData.email || userData.username + '@example.com',
      password: userData.password || 'password123', // 預設密碼
      role: userData.role || 'viewer',
      createdAt: new Date().toISOString()
    };
    
    mockDatabase.users.push(newUser);
    
    // 記錄活動
    const currentUser = getCurrentUser();
    mockDatabase.activities.unshift({
      id: mockDatabase.activities.length + 1,
      type: 'user_add',
      userName: userData.name,
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: 'active'
      },
      message: '使用者新增成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '新增使用者失敗'
    };
  }
};

/**
 * 更新使用者
 * @param {number} userId - 使用者 ID
 * @param {Object} userData - 使用者資料
 * @returns {Promise} 更新結果
 */
export const updateUser = async (userId, userData) => {
  await delay(500);
  
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(userData)
    // });
    
    const userIndex = mockDatabase.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: '使用者不存在'
      };
    }
    
    // 如果要修改使用者名稱，檢查是否與其他使用者重複
    if (userData.username && userData.username !== mockDatabase.users[userIndex].username) {
      const exists = mockDatabase.users.find(u => u.username === userData.username && u.id !== userId);
      if (exists) {
        return {
          success: false,
          message: '使用者名稱已存在'
        };
      }
    }
    
    // 如果要修改 Email，檢查是否與其他使用者重複
    if (userData.email && userData.email !== mockDatabase.users[userIndex].email) {
      const emailExists = mockDatabase.users.find(u => u.email === userData.email && u.id !== userId);
      if (emailExists) {
        return {
          success: false,
          message: 'Email 已存在'
        };
      }
    }
    
    // 更新使用者資料
    const oldUser = { ...mockDatabase.users[userIndex] };
    mockDatabase.users[userIndex] = {
      ...mockDatabase.users[userIndex],
      name: userData.name || mockDatabase.users[userIndex].name,
      username: userData.username || mockDatabase.users[userIndex].username,
      email: userData.email || mockDatabase.users[userIndex].email,
      role: userData.role || mockDatabase.users[userIndex].role,
      ...(userData.password && { password: userData.password })
    };
    
    // 記錄活動
    const currentUser = getCurrentUser();
    mockDatabase.activities.unshift({
      id: mockDatabase.activities.length + 1,
      type: 'user_update',
      userName: mockDatabase.users[userIndex].name,
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: '使用者更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '更新使用者失敗'
    };
  }
};

/**
 * 刪除使用者
 * @param {number} userId - 使用者 ID
 * @returns {Promise} 刪除結果
 */
export const deleteUser = async (userId) => {
  await delay(400);
  
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const userIndex = mockDatabase.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: '使用者不存在'
      };
    }
    
    const user = mockDatabase.users[userIndex];
    
    // 禁止刪除當前登入的使用者
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === user.username) {
      return {
        success: false,
        message: '無法刪除當前登入的使用者'
      };
    }
    
    // 從 mockDatabase 中刪除
    mockDatabase.users.splice(userIndex, 1);
    
    // 記錄活動
    mockDatabase.activities.unshift({
      id: mockDatabase.activities.length + 1,
      type: 'user_delete',
      userName: user.name,
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: '使用者刪除成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '刪除使用者失敗'
    };
  }
};

// ==================== 系統設定 API ====================

/**
 * 取得系統設定
 * @returns {Promise} 系統設定
 */
export const getSettings = async () => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/settings`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    // 從 mockDatabase 讀取設定
    return {
      success: true,
      data: { ...mockDatabase.settings }
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取系統設定失敗'
    };
  }
};

/**
 * 更新系統設定
 * @param {Object} settings - 系統設定
 * @returns {Promise} 更新結果
 */
export const updateSettings = async (settings) => {
  await delay(500);
  
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const response = await fetch(`${API_BASE_URL}/settings`, {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(settings)
    // });
    
    // 更新 mockDatabase 中的設定
    mockDatabase.settings = { ...mockDatabase.settings, ...settings };
    
    // 記錄活動
    const currentUser = getCurrentUser();
    mockDatabase.activities.unshift({
      id: mockDatabase.activities.length + 1,
      type: 'settings_update',
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: '設定已儲存'
    };
  } catch (error) {
    return {
      success: false,
      message: '儲存設定失敗'
    };
  }
};

/**
 * 取得備份歷史
 * @returns {Promise} 備份歷史
 */
export const getBackupHistory = async () => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/backups/history`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const backupHistory = [
      { id: 1, date: '2025-10-15 02:00', size: '2.5 GB', status: 'success' },
      { id: 2, date: '2025-10-08 02:00', size: '2.3 GB', status: 'success' },
      { id: 3, date: '2025-10-01 02:00', size: '2.1 GB', status: 'success' },
    ];
    
    return {
      success: true,
      data: backupHistory
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取備份歷史失敗'
    };
  }
};

/**
 * 建立手動備份
 * @returns {Promise} 備份結果
 */
export const createBackup = async () => {
  await delay(2000);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/backups/create`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    return {
      success: true,
      message: '備份建立成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '建立備份失敗'
    };
  }
};

/**
 * 還原備份
 * @param {number} backupId - 備份 ID
 * @returns {Promise} 還原結果
 */
export const restoreBackup = async (backupId) => {
  await delay(3000);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/backups/${backupId}/restore`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    return {
      success: true,
      message: '備份還原成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '還原備份失敗'
    };
  }
};

/**
 * 取得系統資訊
 * @returns {Promise} 系統資訊
 */
export const getSystemInfo = async () => {
  await delay(400);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/system/info`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const systemInfo = {
      version: '1.0.0',
      uptime: '15 天 8 小時',
      totalFiles: mockDatabase.files.length,
      totalSize: '45.6 GB',
      apiCalls: 12450,
      lastBackup: '2025-10-15 02:00',
      storageUsed: 45.6,
      storageTotal: 100
    };
    
    return {
      success: true,
      data: systemInfo
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取系統資訊失敗'
    };
  }
};
