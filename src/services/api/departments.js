/**
 * Departments Management API Module
 * 負責處理處室管理相關功能 (僅供 super_admin 使用)
 */

import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 取得授權標頭
const getAuthHeader = () => {
  const headers = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  };
  
  // 如果是代理模式，添加 X-Proxy-Department-Id header
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.isSuperAdminProxy && user.departmentId) {
      headers['X-Proxy-Department-Id'] = user.departmentId.toString();
    }
  }
  
  return headers;
};

/**
 * 取得所有處室
 * @returns {Promise} 處室列表
 */
export const getDepartments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { items: [{id, name, description, color, user_count, file_count, created_at}] }
      // 轉換 snake_case 為 camelCase
      const items = (data.items || []).map(dept => ({
        ...dept,
        userCount: dept.user_count || 0,
        fileCount: dept.file_count || 0,
        createdAt: dept.created_at
      }));
      return {
        success: true,
        data: items
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取處室列表失敗'
      };
    }
  } catch (error) {
    console.error('Get departments error:', error);
    return {
      success: false,
      message: '獲取處室列表失敗，請檢查網路連線'
    };
  }
};

/**
 * 取得單一處室詳細資訊
 * @param {number} departmentId - 處室 ID
 * @returns {Promise} 處室詳細資訊
 */
export const getDepartmentById = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取處室資訊失敗'
      };
    }
  } catch (error) {
    console.error('Get department by id error:', error);
    return {
      success: false,
      message: '獲取處室資訊失敗，請檢查網路連線'
    };
  }
};

/**
 * 新增處室
 * @param {Object} departmentData - 處室資料
 * @returns {Promise} 新增結果
 */
export const addDepartment = async (departmentData) => {
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(departmentData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          color: data.color,
          userCount: 0,
          fileCount: 0,
          createdAt: data.createdAt
        },
        message: '處室新增成功'
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '新增處室失敗'
      };
    }
  } catch (error) {
    console.error('Add department error:', error);
    return {
      success: false,
      message: '新增處室失敗，請檢查網路連線'
    };
  }
};

/**
 * 更新處室
 * @param {number} departmentId - 處室 ID
 * @param {Object} departmentData - 處室資料
 * @returns {Promise} 更新結果
 */
export const updateDepartment = async (departmentId, departmentData) => {
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(departmentData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || '處室更新成功'
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '更新處室失敗'
      };
    }
  } catch (error) {
    console.error('Update department error:', error);
    return {
      success: false,
      message: '更新處室失敗，請檢查網路連線'
    };
  }
};

/**
 * 刪除處室
 * @param {number} departmentId - 處室 ID
 * @returns {Promise} 刪除結果
 */
export const deleteDepartment = async (departmentId) => {
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || '處室刪除成功'
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '刪除處室失敗'
      };
    }
  } catch (error) {
    console.error('Delete department error:', error);
    return {
      success: false,
      message: '刪除處室失敗，請檢查網路連線'
    };
  }
};

/**
 * 取得處室統計資料
 * @param {number} departmentId - 處室 ID
 * @returns {Promise} 處室統計資料
 */
export const getDepartmentStats = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/stats`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { department_name, user_count, file_count, activity_count, recent_activities }
      // 轉換為前端期望的格式
      return {
        success: true,
        data: {
          departmentName: data.department_name,
          totalUsers: data.user_count || 0,
          totalFiles: data.file_count || 0,
          activityCount: data.activity_count || 0,
          filesByCategory: {}, // TODO: 後端需要添加此欄位
          recentActivities: (data.recent_activities || []).map(act => ({
            type: act.activity_type,
            description: act.description,
            user: act.username,
            createdAt: act.created_at
          }))
        }
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取處室統計資料失敗'
      };
    }
  } catch (error) {
    console.error('Get department stats error:', error);
    return {
      success: false,
      message: '獲取處室統計資料失敗，請檢查網路連線'
    };
  }
};
