/**
 * Mock Database
 * 集中管理所有模擬資料
 * 按照部門隔離原則組織資料結構
 */

// 模擬後端資料庫
export const mockDatabase = {
  // 處室資料
  departments: [
    { 
      id: 1, 
      name: '人事室', 
      description: '負責人事相關業務', 
      color: 'red',
      createdAt: '2025-10-01',
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
    },
    { 
      id: 2, 
      name: '會計室', 
      description: '負責會計相關業務', 
      color: 'blue',
      createdAt: '2025-10-01',
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
    },
    { 
      id: 3, 
      name: '總務處', 
      description: '負責總務相關業務', 
      color: 'green',
      createdAt: '2025-10-01',
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
    }
  ],
  
  // 使用者資料 (含 departmentId 欄位)
  users: [
    { id: 1, username: 'superadmin', password: 'super123', role: 'super_admin', name: '系統管理員', email: 'superadmin@ncku.edu.tw', departmentId: null, status: 'active' },
    { id: 2, username: 'hr_admin', password: 'admin123', role: 'admin', name: '人事室管理員', email: 'hr_admin@ncku.edu.tw', departmentId: 1, status: 'active' },
    { id: 3, username: 'acc_admin', password: 'admin123', role: 'admin', name: '會計室管理員', email: 'acc_admin@ncku.edu.tw', departmentId: 2, status: 'active' },
    { id: 4, username: 'gen_admin', password: 'admin123', role: 'admin', name: '總務處管理員', email: 'gen_admin@ncku.edu.tw', departmentId: 3, status: 'active' }
  ],
  
  // 各處室的分類資料（按處室 ID 分組）
  categoriesByDepartment: {
    1: [ // 人事室
      { id: 101, name: '規章制度', color: 'blue', createdAt: '2025-10-01', departmentId: 1 },
      { id: 102, name: '請假相關', color: 'green', createdAt: '2025-10-01', departmentId: 1 },
      { id: 103, name: '薪資福利', color: 'yellow', createdAt: '2025-10-01', departmentId: 1 },
      { id: 104, name: '未分類', color: 'gray', createdAt: '2025-10-01', departmentId: 1 }
    ],
    2: [ // 會計室
      { id: 201, name: '會計準則', color: 'blue', createdAt: '2025-10-01', departmentId: 2 },
      { id: 202, name: '報表範本', color: 'purple', createdAt: '2025-10-01', departmentId: 2 },
      { id: 203, name: '未分類', color: 'gray', createdAt: '2025-10-01', departmentId: 2 }
    ],
    3: [ // 總務處
      { id: 301, name: '採購流程', color: 'orange', createdAt: '2025-10-01', departmentId: 3 },
      { id: 302, name: '維修管理', color: 'red', createdAt: '2025-10-01', departmentId: 3 },
      { id: 303, name: '未分類', color: 'gray', createdAt: '2025-10-01', departmentId: 3 }
    ]
  },
  
  // 各處室的檔案資料（按處室 ID 分組）
  filesByDepartment: {
    1: [ // 人事室
      { id: 101, name: '人事規章.pdf', size: '2.4 MB', uploadDate: '2025-10-15', category: '規章制度', uploader: 'hr_admin', departmentId: 1 },
      { id: 102, name: '請假辦法.docx', size: '890 KB', uploadDate: '2025-10-14', category: '請假相關', uploader: 'hr_admin', departmentId: 1 },
      { id: 103, name: '薪資計算說明.pdf', size: '1.2 MB', uploadDate: '2025-10-13', category: '薪資福利', uploader: 'hr_admin', departmentId: 1 },
      { id: 104, name: '年終獎金發放辦法.pdf', size: '650 KB', uploadDate: '2025-10-12', category: '薪資福利', uploader: 'hr_admin', departmentId: 1 },
      { id: 105, name: '教職員工手冊.pdf', size: '5.8 MB', uploadDate: '2025-10-10', category: '規章制度', uploader: 'hr_admin', departmentId: 1 },
      { id: 106, name: '加班費計算方式.pdf', size: '780 KB', uploadDate: '2025-10-07', category: '薪資福利', uploader: 'hr_admin', departmentId: 1 }
    ],
    2: [ // 會計室
      { id: 201, name: '會計制度手冊.pdf', size: '1.5 MB', uploadDate: '2025-10-09', category: '會計準則', uploader: 'acc_admin', departmentId: 2 },
      { id: 202, name: '月報表範本.xlsx', size: '350 KB', uploadDate: '2025-10-08', category: '報表範本', uploader: 'acc_admin', departmentId: 2 }
    ],
    3: [ // 總務處
      { id: 301, name: '總務採購流程.docx', size: '450 KB', uploadDate: '2025-10-08', category: '採購流程', uploader: 'gen_admin', departmentId: 3 },
      { id: 302, name: '設備維修規範.pdf', size: '1.1 MB', uploadDate: '2025-10-06', category: '維修管理', uploader: 'gen_admin', departmentId: 3 }
    ]
  },
  
  // 各處室的活動記錄（按處室 ID 分組）
  activitiesByDepartment: {
    1: [ // 人事室
      { id: 101, type: 'upload', fileName: '人事規章.pdf', user: 'hr_admin', timestamp: '2025-10-15T10:30:00', departmentId: 1 },
      { id: 102, type: 'delete', fileName: '舊版規章.pdf', user: 'hr_admin', timestamp: '2025-10-14T15:20:00', departmentId: 1 },
      { id: 103, type: 'upload', fileName: '請假辦法.docx', user: 'hr_admin', timestamp: '2025-10-14T09:15:00', departmentId: 1 }
    ],
    2: [ // 會計室
      { id: 201, type: 'upload', fileName: '會計制度手冊.pdf', user: 'acc_admin', timestamp: '2025-10-09T11:20:00', departmentId: 2 },
      { id: 202, type: 'upload', fileName: '月報表範本.xlsx', user: 'acc_admin', timestamp: '2025-10-08T14:30:00', departmentId: 2 }
    ],
    3: [ // 總務處
      { id: 301, type: 'upload', fileName: '總務採購流程.docx', user: 'gen_admin', timestamp: '2025-10-08T09:00:00', departmentId: 3 },
      { id: 302, type: 'upload', fileName: '設備維修規範.pdf', user: 'gen_admin', timestamp: '2025-10-06T16:45:00', departmentId: 3 }
    ]
  },
  
  // 系統級活動記錄（處室、使用者、系統設定的操作）
  systemActivities: [],
  
  // 系統設定
  settings: {
    // AI 模型設定
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    tone: 'professional',
    
    // 知識庫設定
    similarityThreshold: 0.75,
    maxRetrievalDocs: 5,
    autoCleanupDays: 90,
    indexUpdateFrequency: 'daily',
    
    // 通知設定
    emailNotifications: true,
    uploadSuccessNotif: true,
    uploadFailNotif: true,
    storageWarning: true,
    weeklyReport: false,
    
    // 備份設定
    autoBackup: true,
    backupFrequency: 'weekly',
  },
  
  // 統計資料
  statistics: {
    monthlyQueries: 1234,
    systemStatus: {
      status: 'running',
      message: '系統運行正常'
    }
  },
  
  // 上傳任務追蹤（支援多管理員並發）
  uploadTasks: {}
};

// 導出預設值
export default mockDatabase;
