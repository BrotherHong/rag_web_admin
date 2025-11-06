/**
 * Activities & Statistics API Module
 * 負責處理活動記錄和統計資料相關功能
 */

import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 取得授權標頭
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

/**
 * 取得系統統計資料
 * @returns {Promise} 統計資料
 */
export const getStatistics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { totalFiles, filesByCategory, monthlyQueries, systemStatus, storageUsed, storageTotal }
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取統計資料失敗'
      };
    }
  } catch (error) {
    console.error('Get statistics error:', error);
    return {
      success: false,
      message: '獲取統計資料失敗，請檢查網路連線'
    };
  }
};

/**
 * 取得最近活動記錄
 * @param {number} limit - 限制數量
 * @returns {Promise} 活動記錄
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { items: [{id, type, fileName, user, timestamp, ...}] }
      return {
        success: true,
        data: data.items || []
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取活動記錄失敗'
      };
    }
  } catch (error) {
    console.error('Get recent activities error:', error);
    return {
      success: false,
      message: '獲取活動記錄失敗，請檢查網路連線'
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
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const params = new URLSearchParams({ limit: limit.toString() });
    if (departmentId !== null) {
      params.append('departmentId', departmentId.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/activities/all?${params}`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { items: [...], total }
      return {
        success: true,
        data: data.items || []
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取活動記錄失敗'
      };
    }
  } catch (error) {
    console.error('Get all activities error:', error);
    return {
      success: false,
      message: '獲取活動記錄失敗，請檢查網路連線'
    };
  }
};
