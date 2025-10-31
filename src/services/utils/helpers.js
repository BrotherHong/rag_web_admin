/**
 * 輔助函數模組
 */

// 模擬 API 延遲
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 取得當前使用者
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};
