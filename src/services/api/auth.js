/**
 * Authentication API Module
 * 負責處理使用者認證相關功能
 */

import { mockDatabase } from '../mock/database.js';
import { delay } from '../utils/helpers.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * 登入 API
 * @param {string} username - 使用者帳號
 * @param {string} password - 使用者密碼
 * @returns {Promise} 登入結果
 */
export const login = async (username, password) => {
  await delay(800); // 模擬網路延遲
  
  try {
    // 模擬 API 呼叫
    // const response = await fetch(`${API_BASE_URL}/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password })
    // });
    
    // 模擬後端驗證邏輯
    const user = mockDatabase.users.find(
      u => u.username === username && u.password === password
    );
    
    if (user) {
      const token = `mock_token_${user.id}_${Date.now()}`;
      return {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            departmentId: user.departmentId  // 加入 departmentId
          },
          token: token
        },
        message: '登入成功'
      };
    } else {
      return {
        success: false,
        message: '帳號或密碼錯誤'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '登入失敗，請稍後再試'
    };
  }
};

/**
 * 登出 API
 * @returns {Promise} 登出結果
 */
export const logout = async () => {
  await delay(300);
  
  try {
    // 模擬 API 呼叫
    // const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   }
    // });
    
    // 清除本地儲存
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return {
      success: true,
      message: '登出成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '登出失敗'
    };
  }
};

/**
 * 驗證 Token 有效性
 * @param {string} token - JWT Token
 * @returns {Promise} 驗證結果
 */
export const verifyToken = async (token) => {
  await delay(200);
  
  try {
    // 模擬 API 呼叫
    // const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // });
    
    // 簡單的 token 格式驗證（mock）
    if (token && token.startsWith('mock_token_')) {
      return {
        success: true,
        message: 'Token 有效'
      };
    } else {
      return {
        success: false,
        message: 'Token 無效或已過期'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '驗證失敗'
    };
  }
};
