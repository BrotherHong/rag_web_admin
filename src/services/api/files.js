/**
 * Files API Module
 * 負責處理知識庫檔案相關功能
 */

import { mockDatabase } from '../mock/database.js';
import { delay, getCurrentUser } from '../utils/helpers.js';
import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    
    // 根據使用者的 departmentId 獲取對應的檔案
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '無法識別使用者所屬處室'
      };
    }
    
    let files = mockDatabase.filesByDepartment[currentUser.departmentId] || [];
    
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
    
    // 取得當前使用者
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    if (file) {
      // 確保該處室的檔案陣列存在
      if (!mockDatabase.filesByDepartment[currentUser.departmentId]) {
        mockDatabase.filesByDepartment[currentUser.departmentId] = [];
      }
      
      // 生成新的檔案 ID (使用處室 ID * 100 + 當前處室檔案數量)
      const deptFiles = mockDatabase.filesByDepartment[currentUser.departmentId];
      const newFileId = currentUser.departmentId * 100 + deptFiles.length + 1;
      
      const newFile = {
        id: newFileId,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString().split('T')[0],
        category: category,
        uploader: currentUser.username,
        departmentId: currentUser.departmentId
      };
      
      mockDatabase.filesByDepartment[currentUser.departmentId].push(newFile);
      
      // 確保該處室的活動記錄陣列存在
      if (!mockDatabase.activitiesByDepartment[currentUser.departmentId]) {
        mockDatabase.activitiesByDepartment[currentUser.departmentId] = [];
      }
      
      // 新增活動記錄
      const deptActivities = mockDatabase.activitiesByDepartment[currentUser.departmentId];
      const newActivityId = currentUser.departmentId * 100 + deptActivities.length + 1;
      
      mockDatabase.activitiesByDepartment[currentUser.departmentId].unshift({
        id: newActivityId,
        type: 'upload',
        fileName: newFile.name,
        user: currentUser.name,
        timestamp: new Date().toISOString(),
        departmentId: currentUser.departmentId
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
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    const deptFiles = mockDatabase.filesByDepartment[currentUser.departmentId] || [];
    const fileIndex = deptFiles.findIndex(f => f.id === fileId);
    
    if (fileIndex !== -1) {
      const deletedFile = deptFiles[fileIndex];
      mockDatabase.filesByDepartment[currentUser.departmentId].splice(fileIndex, 1);
      
      // 確保該處室的活動記錄陣列存在
      if (!mockDatabase.activitiesByDepartment[currentUser.departmentId]) {
        mockDatabase.activitiesByDepartment[currentUser.departmentId] = [];
      }
      
      // 新增活動記錄
      const deptActivities = mockDatabase.activitiesByDepartment[currentUser.departmentId];
      const newActivityId = currentUser.departmentId * 100 + deptActivities.length + 1;
      
      mockDatabase.activitiesByDepartment[currentUser.departmentId].unshift({
        id: newActivityId,
        type: 'delete',
        fileName: deletedFile.name,
        user: currentUser?.name || 'admin',
        timestamp: new Date().toISOString(),
        departmentId: currentUser.departmentId
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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    const deptFiles = mockDatabase.filesByDepartment[currentUser.departmentId] || [];
    const file = deptFiles.find(f => f.id === fileId);
    
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
