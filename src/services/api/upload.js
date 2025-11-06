/**
 * Batch Upload API Module
 * 負責處理批次上傳相關功能
 */

import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 取得授權標頭
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

/**
 * 檢查重複檔案並找出相關檔案
 * @param {Array} fileList - 待檢查的檔案列表 [{ name, size, type }]
 * @returns {Promise} 檢查結果，包含重複和相關檔案
 */
export const checkDuplicates = async (fileList) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/check-duplicates`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files: fileList })
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { results: [{fileName, isDuplicate, duplicateFile, relatedFiles, suggestReplace}] }
      return {
        success: true,
        data: data.results || []
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '檢查重複檔案失敗'
      };
    }
  } catch (error) {
    console.error('Check duplicates error:', error);
    return {
      success: false,
      message: '檢查重複檔案失敗，請檢查網路連線'
    };
  }
};

/**
 * 批次上傳檔案到知識庫
 * @param {Object} uploadData - { files: File[], categories: {}, removeFileIds: [] }
 * @returns {Promise} 上傳任務 ID
 */
export const batchUpload = async (uploadData) => {
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const formData = new FormData();
    uploadData.files.forEach(file => formData.append('files', file));
    formData.append('categories', JSON.stringify(uploadData.categories || {}));
    formData.append('removeFileIds', JSON.stringify(uploadData.removeFileIds || []));
    
    const response = await fetch(`${API_BASE_URL}/upload/batch`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { taskId, message }
      return {
        success: true,
        data: {
          taskId: data.taskId,
          message: data.message || '上傳任務已建立，開始處理檔案'
        }
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '建立上傳任務失敗'
      };
    }
  } catch (error) {
    console.error('Batch upload error:', error);
    return {
      success: false,
      message: '建立上傳任務失敗，請檢查網路連線'
    };
  }
};

/**
 * 取得上傳任務進度
 * @param {string} taskId - 任務 ID
 * @returns {Promise} 任務進度資訊
 */
export const getUploadProgress = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload/progress/${taskId}`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回完整任務資訊: { id, userId, userName, status, totalFiles, processedFiles, ... }
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取上傳進度失敗'
      };
    }
  } catch (error) {
    console.error('Get upload progress error:', error);
    return {
      success: false,
      message: '獲取上傳進度失敗，請檢查網路連線'
    };
  }
};

/**
 * 取得使用者的所有上傳任務
 * @returns {Promise} 任務列表
 */
export const getUserUploadTasks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload/tasks`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { items: [...] }
      return {
        success: true,
        data: data.items || []
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取上傳任務列表失敗'
      };
    }
  } catch (error) {
    console.error('Get user upload tasks error:', error);
    return {
      success: false,
      message: '獲取上傳任務列表失敗，請檢查網路連線'
    };
  }
};

/**
 * 刪除已完成的上傳任務記錄
 * @param {string} taskId - 任務 ID
 * @returns {Promise} 刪除結果
 */
export const deleteUploadTask = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || '任務記錄已刪除'
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '刪除任務失敗'
      };
    }
  } catch (error) {
    console.error('Delete upload task error:', error);
    return {
      success: false,
      message: '刪除任務失敗，請檢查網路連線'
    };
  }
};
