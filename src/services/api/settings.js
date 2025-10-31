/**
 * System Settings API Module
 * 負責處理系統設定、備份還原相關功能 (僅供 super_admin 使用)
 */

import { mockDatabase } from '../mock/database.js';
import { delay } from '../utils/helpers.js';
import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    // 權限檢查：需要 super_admin 權限
    const permission = checkPermission(ROLES.SUPER_ADMIN);
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
      cpuUsage: 45,
      memoryUsage: 62,
      databaseSize: '2.3 GB',
      cacheSize: '156 MB',
      apiRequests: 12450,
      errorRate: 0.5,
      storage: {
        used: '45.6 GB',
        total: '100 GB',
        percentage: 45.6
      }
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
