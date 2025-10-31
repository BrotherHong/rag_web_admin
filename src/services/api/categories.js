/**
 * Categories API Module
 * 負責處理分類管理相關功能
 */

import { mockDatabase } from '../mock/database.js';
import { delay, getCurrentUser } from '../utils/helpers.js';
import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    // 從該處室的分類中取得分類名稱
    const deptCategories = mockDatabase.categoriesByDepartment[currentUser.departmentId] || [];
    let categories = deptCategories.map(cat => cat.name);
    
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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    // 從該處室的分類和檔案中取得資料
    const deptCategories = mockDatabase.categoriesByDepartment[currentUser.departmentId] || [];
    const deptFiles = mockDatabase.filesByDepartment[currentUser.departmentId] || [];
    
    const categoriesWithDetails = deptCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      count: deptFiles.filter(f => f.category === cat.name).length,
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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    // 確保該處室的分類陣列存在
    if (!mockDatabase.categoriesByDepartment[currentUser.departmentId]) {
      mockDatabase.categoriesByDepartment[currentUser.departmentId] = [];
    }
    
    const deptCategories = mockDatabase.categoriesByDepartment[currentUser.departmentId];
    
    // 檢查分類名稱是否已存在（在該處室內）
    const exists = deptCategories.find(cat => cat.name === name);
    if (exists) {
      return {
        success: false,
        message: '分類名稱已存在'
      };
    }
    
    // 生成新的分類 ID (使用處室 ID * 100 + 當前處室分類數量)
    const newCategoryId = currentUser.departmentId * 100 + deptCategories.length + 1;
    
    // 新增到該處室的分類中
    const newCategory = {
      id: newCategoryId,
      name: name,
      color: color,
      createdAt: new Date().toISOString().split('T')[0],
      departmentId: currentUser.departmentId
    };
    
    mockDatabase.categoriesByDepartment[currentUser.departmentId].push(newCategory);
    
    // 確保該處室的活動記錄陣列存在
    if (!mockDatabase.activitiesByDepartment[currentUser.departmentId]) {
      mockDatabase.activitiesByDepartment[currentUser.departmentId] = [];
    }
    
    // 記錄活動
    const deptActivities = mockDatabase.activitiesByDepartment[currentUser.departmentId];
    const newActivityId = currentUser.departmentId * 100 + deptActivities.length + 1;
    
    mockDatabase.activitiesByDepartment[currentUser.departmentId].unshift({
      id: newActivityId,
      type: 'category_add',
      categoryName: name,
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString(),
      departmentId: currentUser.departmentId
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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    const deptCategories = mockDatabase.categoriesByDepartment[currentUser.departmentId] || [];
    const categoryIndex = deptCategories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return {
        success: false,
        message: '分類不存在'
      };
    }
    
    const category = deptCategories[categoryIndex];
    
    // 禁止刪除「未分類」
    if (category.name === '未分類') {
      return {
        success: false,
        message: '無法刪除預設分類「未分類」'
      };
    }
    
    // 檢查是否有檔案使用此分類（在該處室內）
    const deptFiles = mockDatabase.filesByDepartment[currentUser.departmentId] || [];
    const filesWithCategory = deptFiles.filter(f => f.category === category.name);
    
    if (filesWithCategory.length > 0) {
      // 將使用此分類的檔案改為「未分類」
      filesWithCategory.forEach(file => {
        file.category = '未分類';
      });
    }
    
    // 從該處室的分類中刪除
    mockDatabase.categoriesByDepartment[currentUser.departmentId].splice(categoryIndex, 1);
    
    // 確保該處室的活動記錄陣列存在
    if (!mockDatabase.activitiesByDepartment[currentUser.departmentId]) {
      mockDatabase.activitiesByDepartment[currentUser.departmentId] = [];
    }
    
    // 記錄活動
    const deptActivities = mockDatabase.activitiesByDepartment[currentUser.departmentId];
    const newActivityId = currentUser.departmentId * 100 + deptActivities.length + 1;
    
    mockDatabase.activitiesByDepartment[currentUser.departmentId].unshift({
      id: newActivityId,
      type: 'category_delete',
      categoryName: category.name,
      user: currentUser?.name || 'admin',
      timestamp: new Date().toISOString(),
      departmentId: currentUser.departmentId
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
