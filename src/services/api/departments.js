/**
 * Departments Management API Module
 * 負責處理處室管理相關功能 (僅供 super_admin 使用)
 */

import { mockDatabase } from '../mock/database.js';
import { delay, getCurrentUser } from '../utils/helpers.js';
import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * 取得所有處室
 * @returns {Promise} 處室列表
 */
export const getDepartments = async () => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/departments`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const departments = mockDatabase.departments.map(dept => ({
      ...dept,
      userCount: mockDatabase.users.filter(u => u.departmentId === dept.id).length,
      fileCount: (mockDatabase.filesByDepartment[dept.id] || []).length
    }));
    
    return {
      success: true,
      data: departments
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取處室列表失敗'
    };
  }
};

/**
 * 取得單一處室詳細資訊
 * @param {number} departmentId - 處室 ID
 * @returns {Promise} 處室詳細資訊
 */
export const getDepartmentById = async (departmentId) => {
  await delay(300);
  
  try {
    const dept = mockDatabase.departments.find(d => d.id === departmentId);
    
    if (!dept) {
      return {
        success: false,
        message: '處室不存在'
      };
    }
    
    return {
      success: true,
      data: {
        ...dept,
        userCount: mockDatabase.users.filter(u => u.departmentId === dept.id).length,
        fileCount: (mockDatabase.filesByDepartment[dept.id] || []).length
      }
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取處室資訊失敗'
    };
  }
};

/**
 * 新增處室
 * @param {Object} departmentData - 處室資料
 * @returns {Promise} 新增結果
 */
export const addDepartment = async (departmentData) => {
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
    
    // 檢查處室名稱是否已存在
    const exists = mockDatabase.departments.find(d => d.name === departmentData.name);
    if (exists) {
      return {
        success: false,
        message: '處室名稱已存在'
      };
    }
    
    // 新增處室
    const newDepartment = {
      id: Date.now(),
      name: departmentData.name,
      description: departmentData.description || '',
      color: departmentData.color || 'blue',
      createdAt: new Date().toISOString().split('T')[0],
      settings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        tone: 'professional',
        similarityThreshold: 0.75,
        maxRetrievalDocs: 5,
        autoCleanupDays: 90,
        indexUpdateFrequency: 'daily',
      }
    };
    
    mockDatabase.departments.push(newDepartment);
    
    // 初始化該處室的資料結構
    mockDatabase.filesByDepartment[newDepartment.id] = [];
    mockDatabase.categoriesByDepartment[newDepartment.id] = [
      { 
        id: newDepartment.id * 100 + 1, 
        name: '未分類', 
        color: 'gray', 
        createdAt: new Date().toISOString().split('T')[0],
        departmentId: newDepartment.id
      }
    ];
    mockDatabase.activitiesByDepartment[newDepartment.id] = [];
    
    // 記錄系統活動
    const currentUser = getCurrentUser();
    mockDatabase.systemActivities.unshift({
      id: Date.now(),
      type: 'department_add',
      departmentId: newDepartment.id,
      departmentName: newDepartment.name,
      user: currentUser?.name || 'superadmin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      data: {
        ...newDepartment,
        userCount: 0,
        fileCount: 0
      },
      message: '處室新增成功'
    };
  } catch (error) {
    console.error('新增處室錯誤:', error);
    return {
      success: false,
      message: '新增處室失敗'
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
    
    const deptIndex = mockDatabase.departments.findIndex(d => d.id === departmentId);
    
    if (deptIndex === -1) {
      return {
        success: false,
        message: '處室不存在'
      };
    }
    
    // 如果要修改名稱，檢查是否與其他處室重複
    if (departmentData.name && departmentData.name !== mockDatabase.departments[deptIndex].name) {
      const exists = mockDatabase.departments.find(d => d.name === departmentData.name && d.id !== departmentId);
      if (exists) {
        return {
          success: false,
          message: '處室名稱已存在'
        };
      }
    }
    
    // 更新處室資料
    mockDatabase.departments[deptIndex] = {
      ...mockDatabase.departments[deptIndex],
      name: departmentData.name || mockDatabase.departments[deptIndex].name,
      description: departmentData.description !== undefined ? departmentData.description : mockDatabase.departments[deptIndex].description,
      color: departmentData.color || mockDatabase.departments[deptIndex].color,
    };
    
    // 記錄系統活動
    const currentUser = getCurrentUser();
    mockDatabase.systemActivities.unshift({
      id: Date.now(),
      type: 'department_update',
      departmentId: departmentId,
      departmentName: mockDatabase.departments[deptIndex].name,
      user: currentUser?.name || 'superadmin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: '處室更新成功'
    };
  } catch (error) {
    console.error('更新處室錯誤:', error);
    return {
      success: false,
      message: '更新處室失敗'
    };
  }
};

/**
 * 刪除處室
 * @param {number} departmentId - 處室 ID
 * @returns {Promise} 刪除結果
 */
export const deleteDepartment = async (departmentId) => {
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
    
    const deptIndex = mockDatabase.departments.findIndex(d => d.id === departmentId);
    
    if (deptIndex === -1) {
      return {
        success: false,
        message: '處室不存在'
      };
    }
    
    const dept = mockDatabase.departments[deptIndex];
    
    // 檢查是否有使用者屬於此處室
    const usersInDept = mockDatabase.users.filter(u => u.departmentId === departmentId);
    if (usersInDept.length > 0) {
      return {
        success: false,
        message: `無法刪除，該處室還有 ${usersInDept.length} 位使用者`
      };
    }
    
    // 檢查是否有檔案屬於此處室
    const filesInDept = mockDatabase.filesByDepartment[departmentId] || [];
    if (filesInDept.length > 0) {
      return {
        success: false,
        message: `無法刪除，該處室還有 ${filesInDept.length} 個檔案`
      };
    }
    
    // 刪除處室及其相關資料
    mockDatabase.departments.splice(deptIndex, 1);
    delete mockDatabase.filesByDepartment[departmentId];
    delete mockDatabase.categoriesByDepartment[departmentId];
    delete mockDatabase.activitiesByDepartment[departmentId];
    
    // 記錄系統活動
    const currentUser = getCurrentUser();
    mockDatabase.systemActivities.unshift({
      id: Date.now(),
      type: 'department_delete',
      departmentId: departmentId,
      departmentName: dept.name,
      user: currentUser?.name || 'superadmin',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: '處室刪除成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '刪除處室失敗'
    };
  }
};

/**
 * 取得處室統計資料
 * @param {number} departmentId - 處室 ID
 * @returns {Promise} 處室統計資料
 */
export const getDepartmentStats = async (departmentId) => {
  await delay(400);
  
  try {
    const dept = mockDatabase.departments.find(d => d.id === departmentId);
    
    if (!dept) {
      return {
        success: false,
        message: '處室不存在'
      };
    }
    
    // 從該處室的資料中取得統計
    const deptFiles = mockDatabase.filesByDepartment[departmentId] || [];
    const deptCategories = mockDatabase.categoriesByDepartment[departmentId] || [];
    const deptActivities = mockDatabase.activitiesByDepartment[departmentId] || [];
    const users = mockDatabase.users.filter(u => u.departmentId === departmentId);
    
    const stats = {
      departmentName: dept.name,
      totalFiles: deptFiles.length,
      totalUsers: users.length,
      filesByCategory: {},
      recentActivities: deptActivities.slice(0, 5)
    };
    
    // 計算各分類的檔案數量
    deptCategories.forEach(cat => {
      stats.filesByCategory[cat.name] = deptFiles.filter(f => f.category === cat.name).length;
    });
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取處室統計資料失敗'
    };
  }
};
