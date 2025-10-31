/**
 * Users Management API Module
 * 負責處理使用者管理相關功能 (僅供 super_admin 使用)
 */

import { mockDatabase } from '../mock/database.js';
import { delay, getCurrentUser } from '../utils/helpers.js';
import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    
    // 根據使用者的 departmentId 過濾使用者
    const currentUser = getCurrentUser();
    let usersToShow = [...mockDatabase.users];
    
    // 如果是處室管理員,只顯示同處室的使用者
    if (currentUser && currentUser.departmentId && currentUser.role !== 'super_admin') {
      usersToShow = usersToShow.filter(u => u.departmentId === currentUser.departmentId);
    }
    
    const users = usersToShow.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email || user.username + '@example.com',
      role: user.role,
      departmentId: user.departmentId,
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
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
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
    
    // 驗證 departmentId
    if (!userData.departmentId) {
      return {
        success: false,
        message: '請選擇所屬處室'
      };
    }
    
    const department = mockDatabase.departments.find(d => d.id === parseInt(userData.departmentId));
    if (!department) {
      return {
        success: false,
        message: '所屬處室不存在'
      };
    }
    
    // 新增使用者到 mockDatabase
    const currentUser = getCurrentUser();
    
    const newUser = {
      id: Date.now(),
      name: userData.name,
      username: userData.username,
      email: userData.email || userData.username + '@example.com',
      password: userData.password || 'password123',
      role: 'admin', // 系統管理員新增的都是處室管理員
      departmentId: parseInt(userData.departmentId),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    mockDatabase.users.push(newUser);
    
    // 記錄系統活動
    mockDatabase.systemActivities.unshift({
      id: Date.now(),
      type: 'user_add',
      userId: newUser.id,
      userName: userData.name,
      departmentId: newUser.departmentId,
      departmentName: department.name,
      user: currentUser?.name || 'superadmin',
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
        departmentId: newUser.departmentId,
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
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
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
    
    // 驗證 departmentId
    if (userData.departmentId) {
      const department = mockDatabase.departments.find(d => d.id === parseInt(userData.departmentId));
      if (!department) {
        return {
          success: false,
          message: '所屬處室不存在'
        };
      }
    }
    
    // 更新使用者資料
    mockDatabase.users[userIndex] = {
      ...mockDatabase.users[userIndex],
      name: userData.name || mockDatabase.users[userIndex].name,
      username: userData.username || mockDatabase.users[userIndex].username,
      email: userData.email || mockDatabase.users[userIndex].email,
      departmentId: userData.departmentId ? parseInt(userData.departmentId) : mockDatabase.users[userIndex].departmentId,
      ...(userData.password && { password: userData.password })
    };
    
    // 記錄系統活動
    const currentUser = getCurrentUser();
    const department = mockDatabase.departments.find(d => d.id === mockDatabase.users[userIndex].departmentId);
    mockDatabase.systemActivities.unshift({
      id: Date.now(),
      type: 'user_update',
      userId: userId,
      userName: mockDatabase.users[userIndex].name,
      departmentId: mockDatabase.users[userIndex].departmentId,
      departmentName: department?.name,
      user: currentUser?.name || 'superadmin',
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
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
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
    
    // 禁止刪除 super_admin
    if (user.role === 'super_admin') {
      return {
        success: false,
        message: '無法刪除系統管理員'
      };
    }
    
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
    
    // 記錄系統活動
    const department = mockDatabase.departments.find(d => d.id === user.departmentId);
    mockDatabase.systemActivities.unshift({
      id: Date.now(),
      type: 'user_delete',
      userId: userId,
      userName: user.name,
      departmentId: user.departmentId,
      departmentName: department?.name,
      user: currentUser?.name || 'superadmin',
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
