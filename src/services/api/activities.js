/**
 * Activities & Statistics API Module
 * 負責處理活動記錄和統計資料相關功能
 */

import { mockDatabase } from '../mock/database.js';
import { delay, getCurrentUser } from '../utils/helpers.js';
import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    
    // 根據使用者的 departmentId 過濾檔案
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    const deptFiles = mockDatabase.filesByDepartment[currentUser.departmentId] || [];
    const deptCategories = mockDatabase.categoriesByDepartment[currentUser.departmentId] || [];
    const deptActivities = mockDatabase.activitiesByDepartment[currentUser.departmentId] || [];
    
    // 動態計算各分類的檔案數量
    const filesByCategory = {};
    deptCategories.forEach(cat => {
      filesByCategory[cat.name] = deptFiles.filter(f => f.category === cat.name).length;
    });
    
    // 計算本月查詢次數 (模擬:根據處室檔案數量估算)
    const monthlyQueries = Math.floor(deptFiles.length * 50 + Math.random() * 100);
    
    const stats = {
      totalFiles: deptFiles.length,
      filesByCategory: filesByCategory,
      monthlyQueries: monthlyQueries,
      systemStatus: {
        status: 'running',
        message: '系統運行正常',
        lastUpdate: new Date().toISOString()
      },
      storageUsed: `${(deptFiles.length * 2.5).toFixed(1)} GB`,  // 模擬:每個檔案約2.5GB
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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    // 從該處室的活動記錄中取得資料
    const deptActivities = mockDatabase.activitiesByDepartment[currentUser.departmentId] || [];
    const activities = deptActivities.slice(0, limit);
    
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

/**
 * 取得所有處室的活動記錄 (僅供系統管理員使用)
 * @param {number} departmentId - 處室 ID，傳入 null 則取得所有處室
 * @param {number} limit - 限制數量
 * @returns {Promise} 活動記錄
 */
export const getAllActivities = async (departmentId = null, limit = 50) => {
  await delay(300);
  
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    let allActivities = [];
    
    // 1. 加入系統級活動（處室、使用者管理等）
    allActivities = [...mockDatabase.systemActivities];
    
    // 2. 加入處室級活動（檔案、分類操作等）
    if (departmentId === null) {
      // 取得所有處室的活動記錄
      for (const deptId in mockDatabase.activitiesByDepartment) {
        const deptActivities = mockDatabase.activitiesByDepartment[deptId] || [];
        allActivities = allActivities.concat(deptActivities);
      }
    } else {
      // 取得特定處室的活動記錄
      const deptActivities = mockDatabase.activitiesByDepartment[departmentId] || [];
      // 只保留該處室的系統活動
      const systemActivitiesForDept = mockDatabase.systemActivities.filter(
        act => act.departmentId === parseInt(departmentId)
      );
      allActivities = [...systemActivitiesForDept, ...deptActivities];
    }
    
    // 按時間排序 (最新的在前)
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 限制數量
    const activities = allActivities.slice(0, limit);
    
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
