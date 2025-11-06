/**
 * Users Management API Module
 * 負責處理使用者管理相關功能 (僅供 super_admin 使用)
 */

import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 取得授權標頭
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

/**
 * 取得所有使用者
 * @returns {Promise} 使用者列表
 */
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      // 後端返回: { items: [{id, name, username, email, role, departmentId, status}] }
      return {
        success: true,
        data: data.items || []
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '獲取使用者列表失敗'
      };
    }
  } catch (error) {
    console.error('Get users error:', error);
    return {
      success: false,
      message: '獲取使用者列表失敗，請檢查網路連線'
    };
  }
};

/**
 * 新增使用者
 * @param {Object} userData - 使用者資料
 * @returns {Promise} 新增結果
 */
export const addUser = async (userData) => {
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          username: data.username,
          email: data.email,
          role: data.role,
          departmentId: data.departmentId,
          status: data.status
        },
        message: '使用者新增成功'
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '新增使用者失敗'
      };
    }
  } catch (error) {
    console.error('Add user error:', error);
    return {
      success: false,
      message: '新增使用者失敗，請檢查網路連線'
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
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || '使用者更新成功'
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '更新使用者失敗'
      };
    }
  } catch (error) {
    console.error('Update user error:', error);
    return {
      success: false,
      message: '更新使用者失敗，請檢查網路連線'
    };
  }
};

/**
 * 刪除使用者
 * @param {number} userId - 使用者 ID
 * @returns {Promise} 刪除結果
 */
export const deleteUser = async (userId) => {
  try {
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || '使用者刪除成功'
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.detail || '刪除使用者失敗'
      };
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      success: false,
      message: '刪除使用者失敗，請檢查網路連線'
    };
  }
};
