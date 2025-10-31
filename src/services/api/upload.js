/**
 * Batch Upload API Module
 * 負責處理批次上傳相關功能
 */

import { mockDatabase } from '../mock/database.js';
import { delay, getCurrentUser } from '../utils/helpers.js';
import { ROLES, checkPermission } from '../utils/permissions.js';

// API Base URL（實際應用中應該從環境變數讀取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * 檢查重複檔案並找出相關檔案
 * @param {Array} fileList - 待檢查的檔案列表 [{ name, size, type }]
 * @returns {Promise} 檢查結果，包含重複和相關檔案
 */
export const checkDuplicates = async (fileList) => {
  await delay(800);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/check-duplicates`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ files: fileList })
    // });
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.departmentId) {
      return {
        success: false,
        message: '未登入或無法識別所屬處室'
      };
    }
    
    const deptFiles = mockDatabase.filesByDepartment[currentUser.departmentId] || [];
    
    const results = fileList.map(file => {
      // 檢查完全重複（檔名相同）- 在該處室內
      const exactMatch = deptFiles.find(f => f.name === file.name);
      
      // 檢查可能相關（檔名相似度）- 在該處室內
      const relatedFiles = deptFiles.filter(f => {
        const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // 移除副檔名
        const dbFileName = f.name.toLowerCase().replace(/\.[^/.]+$/, '');
        
        // 簡單的相似度檢測：包含相同關鍵詞
        const keywords = fileName.split(/[\s_-]+/);
        return keywords.some(keyword => 
          keyword.length > 2 && dbFileName.includes(keyword)
        );
      });
      
      return {
        fileName: file.name,
        isDuplicate: !!exactMatch,
        duplicateFile: exactMatch || null,
        relatedFiles: relatedFiles.filter(f => f.name !== file.name),
        suggestReplace: relatedFiles.length > 0
      };
    });
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      message: '檢查重複檔案失敗'
    };
  }
};

/**
 * 批次上傳檔案到知識庫
 * @param {Object} uploadData - { files: File[], categories: {}, removeFileIds: [] }
 * @returns {Promise} 上傳任務 ID
 */
export const batchUpload = async (uploadData) => {
  await delay(500);
  
  try {
    // 權限檢查：需要 admin 權限
    const permission = checkPermission(ROLES.ADMIN);
    if (!permission.hasPermission) {
      return {
        success: false,
        message: permission.message
      };
    }
    
    // const formData = new FormData();
    // uploadData.files.forEach(file => formData.append('files', file));
    // formData.append('categories', JSON.stringify(uploadData.categories));
    // formData.append('removeFileIds', JSON.stringify(uploadData.removeFileIds));
    
    // const response = await fetch(`${API_BASE_URL}/files/batch-upload`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    //   body: formData
    // });
    
    const user = getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: '未登入'
      };
    }
    
    const taskId = `task_${user.id}_${Date.now()}`;
    
    // 創建上傳任務
    const task = {
      id: taskId,
      userId: user.id,
      userName: user.name,
      status: 'pending', // pending, processing, completed, failed
      totalFiles: uploadData.files.length,
      processedFiles: 0,
      successFiles: 0,
      failedFiles: 0,
      deletedFiles: 0, // 新增：追蹤已刪除的舊檔案數量
      currentFile: null,
      files: uploadData.files.map((file, index) => ({
        id: `file_${index}`,
        name: file.name,
        size: file.size,
        status: 'pending', // pending, processing, completed, failed
        progress: 0,
        error: null
      })),
      removeFileIds: uploadData.removeFileIds || [],
      categories: uploadData.categories || {},
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };
    
    mockDatabase.uploadTasks[taskId] = task;
    
    // 異步處理上傳（模擬後端處理）
    processUploadTask(taskId, uploadData);
    
    return {
      success: true,
      data: {
        taskId: taskId,
        message: '上傳任務已建立，開始處理檔案'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: '建立上傳任務失敗'
    };
  }
};

/**
 * 模擬處理上傳任務（在實際應用中這會在後端執行）
 * @param {string} taskId - 任務 ID
 * @param {Object} uploadData - 上傳資料
 */
const processUploadTask = async (taskId, uploadData) => {
  const task = mockDatabase.uploadTasks[taskId];
  if (!task) return;
  
  // 更新任務狀態為處理中
  task.status = 'processing';
  
  const currentUser = getCurrentUser();
  const departmentId = currentUser?.departmentId;
  
  // 確保該處室的資料陣列存在
  if (!mockDatabase.filesByDepartment[departmentId]) {
    mockDatabase.filesByDepartment[departmentId] = [];
  }
  if (!mockDatabase.activitiesByDepartment[departmentId]) {
    mockDatabase.activitiesByDepartment[departmentId] = [];
  }
  
  // 先刪除要移除的舊檔案
  if (uploadData.removeFileIds && uploadData.removeFileIds.length > 0) {
    const deptFiles = mockDatabase.filesByDepartment[departmentId];
    for (const fileId of uploadData.removeFileIds) {
      const fileIndex = deptFiles.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        const deletedFile = deptFiles[fileIndex];
        mockDatabase.filesByDepartment[departmentId].splice(fileIndex, 1);
        
        // 增加刪除計數
        task.deletedFiles++;
        
        const deptActivities = mockDatabase.activitiesByDepartment[departmentId];
        const newActivityId = departmentId * 100 + deptActivities.length + 1;
        
        mockDatabase.activitiesByDepartment[departmentId].unshift({
          id: newActivityId,
          type: 'delete',
          fileName: deletedFile.name,
          user: task.userName,
          timestamp: new Date().toISOString(),
          departmentId: departmentId
        });
      }
    }
  }
  
  // 處理每個檔案
  for (let i = 0; i < uploadData.files.length; i++) {
    const file = uploadData.files[i];
    const fileTask = task.files[i];
    
    // 更新當前處理檔案
    task.currentFile = file.name;
    fileTask.status = 'processing';
    fileTask.progress = 0; // 立即設置為 0%
    
    try {
      // 模擬處理過程（分段更新進度）
      // 改為更細緻的進度更新，讓使用者能看到完整過程
      for (let progress = 10; progress <= 100; progress += 10) {
        await delay(500); // 每 10% 延遲 500ms，單檔總時間約 5 秒
        fileTask.progress = progress;
      }
      
      // 模擬隨機失敗（10% 機率）
      if (Math.random() < 0.1) {
        throw new Error('檔案處理失敗：格式不支援或檔案損壞');
      }
      
      // 成功：添加到資料庫
      const deptFiles = mockDatabase.filesByDepartment[departmentId];
      const newFileId = departmentId * 100 + deptFiles.length + 1;
      
      const newFile = {
        id: newFileId,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString().split('T')[0],
        category: uploadData.categories[file.name] || '未分類',
        uploader: task.userName,
        departmentId: departmentId
      };
      
      mockDatabase.filesByDepartment[departmentId].push(newFile);
      
      const deptActivities = mockDatabase.activitiesByDepartment[departmentId];
      const newActivityId = departmentId * 100 + deptActivities.length + 1;
      
      mockDatabase.activitiesByDepartment[departmentId].unshift({
        id: newActivityId,
        type: 'upload',
        fileName: newFile.name,
        user: task.userName,
        timestamp: new Date().toISOString(),
        departmentId: departmentId
      });
      
      fileTask.status = 'completed';
      fileTask.progress = 100;
      task.successFiles++;
      
    } catch (error) {
      fileTask.status = 'failed';
      fileTask.error = error.message;
      task.failedFiles++;
    }
    
    task.processedFiles++;
  }
  
  // 任務完成
  task.status = task.failedFiles === 0 ? 'completed' : 'partial';
  task.currentFile = null;
  task.endTime = new Date().toISOString();
};

/**
 * 取得上傳任務進度
 * @param {string} taskId - 任務 ID
 * @returns {Promise} 任務進度資訊
 */
export const getUploadProgress = async (taskId) => {
  await delay(200);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/upload-progress/${taskId}`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const task = mockDatabase.uploadTasks[taskId];
    
    if (!task) {
      return {
        success: false,
        message: '找不到該上傳任務'
      };
    }
    
    return {
      success: true,
      data: task
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取上傳進度失敗'
    };
  }
};

/**
 * 取得使用者的所有上傳任務
 * @returns {Promise} 任務列表
 */
export const getUserUploadTasks = async () => {
  await delay(300);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/upload-tasks`, {
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userTasks = Object.values(mockDatabase.uploadTasks)
      .filter(task => task.userId === user.id)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    return {
      success: true,
      data: userTasks
    };
  } catch (error) {
    return {
      success: false,
      message: '獲取上傳任務列表失敗'
    };
  }
};

/**
 * 刪除已完成的上傳任務記錄
 * @param {string} taskId - 任務 ID
 * @returns {Promise} 刪除結果
 */
export const deleteUploadTask = async (taskId) => {
  await delay(200);
  
  try {
    // const response = await fetch(`${API_BASE_URL}/files/upload-tasks/${taskId}`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // });
    
    if (mockDatabase.uploadTasks[taskId]) {
      delete mockDatabase.uploadTasks[taskId];
      return {
        success: true,
        message: '任務記錄已刪除'
      };
    } else {
      return {
        success: false,
        message: '找不到該任務'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '刪除任務失敗'
    };
  }
};
