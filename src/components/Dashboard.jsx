import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  logout, 
  getStatistics, 
  getRecentActivities,
  getCategoriesWithDetails,
  addCategory,
  deleteCategory,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getSettings,
  updateSettings,
  getBackupHistory,
  createBackup,
  restoreBackup,
  getSystemInfo
} from '../services/api';
import KnowledgeBase from './KnowledgeBase';
import UploadFiles from './UploadFiles';

function Dashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('knowledge-base');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // 呼叫登出 API
      await logout();
      
      // 清除本地存儲
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 觸發認證變更事件
      window.dispatchEvent(new Event('authChange'));
      
      // 導航到登入頁
      navigate('/', { replace: true });
    } catch (error) {
      console.error('登出錯誤:', error);
      // 即使 API 失敗也要登出
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authChange'));
      navigate('/', { replace: true });
    }
  };

  // 獲取使用者資訊
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : { name: '管理員', username: 'Admin', role: 'admin' };
    } catch {
      return { name: '管理員', username: 'Admin', role: 'admin' };
    }
  };

  const user = getUserInfo();
  
  // 檢查權限
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager' || isAdmin;
  const isViewer = user.role === 'viewer';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航欄 */}
      <header className="text-white shadow-lg sticky top-0 z-50" 
              style={{ backgroundColor: 'var(--ncku-red)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h1 className="text-xl font-bold">人事室 AI 客服</h1>
                  <p className="text-xs text-red-100">後台管理系統</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <div className="flex items-center justify-end space-x-2">
                  <p className="text-xs text-red-100">{user.username}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? '管理員' : user.role === 'manager' ? '主管' : '檢視者'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{ color: 'var(--ncku-red)' }}
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-solid border-current border-r-transparent"></div>
                    <span>登出中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>登出</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 側邊欄 */}
        <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-80px)] fixed left-0 top-[80px] overflow-y-auto">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setCurrentPage('knowledge-base')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                currentPage === 'knowledge-base'
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={currentPage === 'knowledge-base' ? { backgroundColor: 'var(--ncku-red)' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-medium">知識庫管理</span>
            </button>

            <button
              onClick={() => setCurrentPage('upload-files')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                currentPage === 'upload-files'
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={currentPage === 'upload-files' ? { backgroundColor: 'var(--ncku-red)' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium">上傳檔案</span>
            </button>

            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                currentPage === 'dashboard'
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={currentPage === 'dashboard' ? { backgroundColor: 'var(--ncku-red)' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">儀表板</span>
            </button>

            <button
              onClick={() => setCurrentPage('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                currentPage === 'settings'
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={currentPage === 'settings' ? { backgroundColor: 'var(--ncku-red)' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">系統設定</span>
            </button>
          </nav>

          {/* 科技感裝飾 */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>系統運行正常</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 主要內容區域 */}
        <main className="flex-1 p-8 ml-64">
          {currentPage === 'knowledge-base' && <KnowledgeBase />}
          {currentPage === 'upload-files' && (
            <UploadFiles 
              onNavigateToKnowledgeBase={() => setCurrentPage('knowledge-base')} 
            />
          )}
          {currentPage === 'dashboard' && <DashboardHome />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

// 儀表板首頁組件
function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 並行載入統計資料和活動記錄
      const [statsResponse, activitiesResponse] = await Promise.all([
        getStatistics(),
        getRecentActivities(5)
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (activitiesResponse.success) {
        setActivities(activitiesResponse.data);
      }
    } catch (error) {
      console.error('載入儀表板資料錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return '剛剛';
    if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} 小時前`;
    return `${Math.floor(diffInMinutes / 1440)} 天前`;
  };

  // 根據檔案類型返回圖示
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    if (ext === 'pdf') {
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    if (ext === 'doc' || ext === 'docx') {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (ext === 'xls' || ext === 'xlsx') {
      return (
        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    if (ext === 'ppt' || ext === 'pptx') {
      return (
        <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (ext === 'txt') {
      return (
        <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  const getActivityIcon = (type) => {
    if (type === 'upload') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    } else if (type === 'delete') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    } else if (type === 'category_add') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    } else if (type === 'category_delete') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    } else if (type === 'user_add' || type === 'user_update' || type === 'user_delete') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    } else if (type === 'settings_update') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    return null;
  };

  const getActivityText = (activity) => {
    if (activity.type === 'upload') {
      return '新增檔案';
    } else if (activity.type === 'delete') {
      return '刪除檔案';
    } else if (activity.type === 'category_add') {
      return '新增分類';
    } else if (activity.type === 'category_delete') {
      return '刪除分類';
    } else if (activity.type === 'user_add') {
      return '新增使用者';
    } else if (activity.type === 'user_update') {
      return '更新使用者';
    } else if (activity.type === 'user_delete') {
      return '刪除使用者';
    } else if (activity.type === 'settings_update') {
      return '更新系統設定';
    }
    return '未知操作';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent"
               style={{ color: 'var(--ncku-red)' }}>
          </div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">無法載入儀表板資料</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--ncku-red)' }}>
        系統概覽
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4" 
             style={{ borderColor: 'var(--ncku-red)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">知識庫檔案</p>
              <p className="text-3xl font-bold mt-2">{stats.totalFiles}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" style={{ color: 'var(--ncku-red)' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">本月查詢次數</p>
              <p className="text-3xl font-bold mt-2">{stats.monthlyQueries.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">系統狀態</p>
              <p className="text-xl font-bold mt-2 text-green-600">
                {stats.systemStatus === 'running' ? '運行正常' : '異常'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">最近活動</h3>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {/* 操作類型圖示 */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                       style={{ 
                         backgroundColor: 
                           activity.type === 'upload' ? '#dcfce7' : 
                           activity.type === 'category_add' || activity.type === 'user_add' ? '#dbeafe' :
                           activity.type === 'user_update' ? '#fef3c7' :
                           '#fee2e2'
                       }}>
                    <div style={{ 
                      color: 
                        activity.type === 'upload' ? '#16a34a' : 
                        activity.type === 'category_add' || activity.type === 'user_add' ? '#2563eb' :
                        activity.type === 'user_update' ? '#f59e0b' :
                        '#dc2626'
                    }}>
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                </div>
                {/* 檔案類型圖示或分類圖示或使用者圖示 */}
                {activity.fileName && (
                  <div className="flex-shrink-0">
                    {getFileIcon(activity.fileName)}
                  </div>
                )}
                {activity.categoryName && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                )}
                {activity.userName && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{getActivityText(activity)}</p>
                  <p className="text-sm text-gray-600 truncate">
                    {activity.fileName || activity.categoryName || activity.userName}
                  </p>
                </div>
                <p className="text-sm text-gray-500 whitespace-nowrap">{formatTimeAgo(activity.timestamp)}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">暫無活動記錄</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 設定頁面組件
function Settings() {
  const [activeTab, setActiveTab] = useState('ai-model');
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 獲取當前使用者權限
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : { name: '管理員', username: 'Admin', role: 'admin' };
    } catch {
      return { name: '管理員', username: 'Admin', role: 'admin' };
    }
  };
  
  const user = getUserInfo();
  const isAdmin = user.role === 'admin';

  // 載入設定
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await getSettings();
      if (response.success) {
        setSettings(response.data);
      } else {
        console.error('載入設定失敗:', response.message);
        // 使用預設值
        setSettings({
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 0.9,
          tone: 'professional',
          similarityThreshold: 0.75,
          maxRetrievalDocs: 5,
          autoCleanupDays: 90,
          indexUpdateFrequency: 'daily',
          emailNotifications: true,
          uploadSuccessNotif: true,
          uploadFailNotif: true,
          storageWarning: true,
          weeklyReport: false,
          autoBackup: true,
          backupFrequency: 'weekly',
        });
      }
    } catch (error) {
      console.error('載入設定錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await updateSettings(settings);
      if (response.success) {
        alert('設定已儲存！');
      } else {
        alert('儲存失敗：' + response.message);
      }
    } catch (error) {
      console.error('儲存設定錯誤:', error);
      alert('儲存設定失敗');
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent"
               style={{ color: 'var(--ncku-red)' }}>
          </div>
          <p className="mt-4 text-gray-600">載入設定中...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'ai-model', name: 'AI 模型', icon: '🤖' },
    { id: 'knowledge-base', name: '知識庫', icon: '📚' },
    { id: 'categories', name: '分類管理', icon: '🏷️' },
    { id: 'users', name: '使用者', icon: '👥' },
    { id: 'notifications', name: '通知', icon: '🔔' },
    { id: 'backup', name: '備份', icon: '💾' },
    { id: 'system', name: '系統資訊', icon: '📊' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--ncku-red)' }}>
        系統設定
      </h2>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 側邊欄標籤 */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* 小螢幕：橫向滾動標籤 */}
            <div className="lg:hidden flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={activeTab === tab.id ? { backgroundColor: 'var(--ncku-red)' } : {}}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
            
            {/* 大螢幕：垂直標籤 */}
            <div className="hidden lg:block">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-6 py-4 text-left flex items-center space-x-3 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={activeTab === tab.id ? { backgroundColor: 'var(--ncku-red)' } : {}}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
            {activeTab === 'ai-model' && <AIModelSettings settings={settings} onChange={handleSettingChange} />}
            {activeTab === 'knowledge-base' && <KnowledgeBaseSettings settings={settings} onChange={handleSettingChange} />}
            {activeTab === 'categories' && <CategoryManagement isAdmin={isAdmin} />}
            {activeTab === 'users' && <UserManagement isAdmin={isAdmin} />}
            {activeTab === 'notifications' && <NotificationSettings settings={settings} onChange={handleSettingChange} />}
            {activeTab === 'backup' && <BackupSettings settings={settings} onChange={handleSettingChange} />}
            {activeTab === 'system' && <SystemInfo />}
          </div>

          {/* 儲存按鈕 */}
          {activeTab !== 'categories' && activeTab !== 'users' && activeTab !== 'system' && (
            <div className="mt-6 flex justify-end">
              {isAdmin ? (
                <button
                  onClick={handleSave}
                  className="px-8 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium"
                  style={{ backgroundColor: 'var(--ncku-red)' }}
                >
                  儲存設定
                </button>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-100 px-6 py-3 rounded-lg">
                  僅管理員可修改設定
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AI 模型設定子組件
function AIModelSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">AI 模型設定</h3>
        <p className="text-sm text-gray-600 mb-6">調整 AI 模型的參數以優化回答品質</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型選擇
          </label>
          <select
            value={settings.model}
            onChange={(e) => onChange('model', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent cursor-pointer"
          >
            <option value="gpt-4">GPT-4 (最佳品質)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo (快速)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (經濟)</option>
            <option value="claude-3">Claude 3</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            溫度參數 (Temperature): {settings.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>保守 (0)</span>
            <span>創意 (1)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最大 Token 數
          </label>
          <input
            type="number"
            value={settings.maxTokens}
            onChange={(e) => onChange('maxTokens', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent"
            min="100"
            max="4000"
          />
          <p className="text-xs text-gray-500 mt-1">控制回答的最大長度 (100-4000)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Top-P 參數: {settings.topP}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.topP}
            onChange={(e) => onChange('topP', parseFloat(e.target.value))}
            className="w-full cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">控制回答的多樣性</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            回答語氣
          </label>
          <select
            value={settings.tone}
            onChange={(e) => onChange('tone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent cursor-pointer"
          >
            <option value="professional">專業正式</option>
            <option value="friendly">親切友善</option>
            <option value="concise">簡潔明瞭</option>
            <option value="detailed">詳細說明</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// 知識庫設定子組件
function KnowledgeBaseSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">知識庫設定</h3>
        <p className="text-sm text-gray-600 mb-6">配置知識庫的檢索和管理參數</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            相似度閾值: {settings.similarityThreshold}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.similarityThreshold}
            onChange={(e) => onChange('similarityThreshold', parseFloat(e.target.value))}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>寬鬆 (0)</span>
            <span>嚴格 (1)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">設定文件匹配的最低相似度</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最大檢索文件數
          </label>
          <input
            type="number"
            value={settings.maxRetrievalDocs}
            onChange={(e) => onChange('maxRetrievalDocs', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent"
            min="1"
            max="20"
          />
          <p className="text-xs text-gray-500 mt-1">每次查詢返回的文件數量 (1-20)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自動清理天數
          </label>
          <input
            type="number"
            value={settings.autoCleanupDays}
            onChange={(e) => onChange('autoCleanupDays', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent"
            min="30"
            max="365"
          />
          <p className="text-xs text-gray-500 mt-1">自動刪除多久未使用的檔案 (0 = 停用)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            索引更新頻率
          </label>
          <select
            value={settings.indexUpdateFrequency}
            onChange={(e) => onChange('indexUpdateFrequency', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent cursor-pointer"
          >
            <option value="realtime">即時更新</option>
            <option value="hourly">每小時</option>
            <option value="daily">每天</option>
            <option value="weekly">每週</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">向量資料庫索引的更新頻率</p>
        </div>
      </div>
    </div>
  );
}

// 分類管理子組件
function CategoryManagement({ isAdmin }) {
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');
  const [isLoading, setIsLoading] = useState(true);

  // 可用的顏色選項
  const colorOptions = [
    { value: 'blue', label: '藍色', class: 'bg-blue-500' },
    { value: 'green', label: '綠色', class: 'bg-green-500' },
    { value: 'yellow', label: '黃色', class: 'bg-yellow-500' },
    { value: 'red', label: '紅色', class: 'bg-red-500' },
    { value: 'purple', label: '紫色', class: 'bg-purple-500' },
    { value: 'pink', label: '粉色', class: 'bg-pink-500' },
    { value: 'indigo', label: '靛藍', class: 'bg-indigo-500' },
    { value: 'orange', label: '橙色', class: 'bg-orange-500' },
  ];

  // 根據顏色名稱返回對應的 class
  const getColorClass = (color) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  // 載入分類列表
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await getCategoriesWithDetails();
      if (response.success) {
        setCategories(response.data);
      } else {
        console.error('載入分類失敗:', response.message);
      }
    } catch (error) {
      console.error('載入分類錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const response = await addCategory(newCategoryName, newCategoryColor);
        if (response.success) {
          // 重新載入分類列表
          await loadCategories();
          setNewCategoryName('');
          setNewCategoryColor('blue');
          setShowAddModal(false);
        } else {
          alert('新增失敗：' + response.message);
        }
      } catch (error) {
        console.error('新增分類錯誤:', error);
        alert('新增分類失敗');
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('確定要刪除這個分類嗎？')) {
      try {
        const response = await deleteCategory(id);
        if (response.success) {
          // 重新載入分類列表
          await loadCategories();
        } else {
          alert('刪除失敗：' + response.message);
        }
      } catch (error) {
        console.error('刪除分類錯誤:', error);
        alert('刪除分類失敗');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent"
               style={{ color: 'var(--ncku-red)' }}>
          </div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">分類管理</h3>
          <p className="text-sm text-gray-600 mt-1">管理知識庫的檔案分類</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer"
            style={{ backgroundColor: 'var(--ncku-red)' }}
          >
            + 新增分類
          </button>
        )}
        {!isAdmin && (
          <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
            僅管理員可新增分類
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => (
          <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getColorClass(category.color)}`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {category.name}
                    {category.name === '未分類' && (
                      <span className="ml-2 text-xs text-gray-500">(預設)</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500">{category.count} 個檔案</p>
                </div>
              </div>
              {category.name !== '未分類' && isAdmin && (
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                  title="刪除分類"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-96 mx-4 animate-scaleIn">
            <h3 className="text-lg font-semibold mb-4">新增分類</h3>
            
            {/* 分類名稱輸入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分類名稱
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="輸入分類名稱"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent"
                autoFocus
              />
            </div>

            {/* 顏色選擇 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇顏色
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewCategoryColor(color.value)}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all cursor-pointer ${
                      newCategoryColor === color.value 
                        ? 'border-gray-800 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${color.class} mb-1`}></div>
                    <span className="text-xs text-gray-600">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 按鈕 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCategoryName('');
                  setNewCategoryColor('blue');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--ncku-red)' }}
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 使用者管理子組件
function UserManagement({ isAdmin }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'viewer'
  });

  // 載入使用者列表
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        console.error('載入使用者失敗:', response.message);
      }
    } catch (error) {
      console.error('載入使用者錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理新增使用者
  const handleAddUser = async () => {
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert('請填寫所有必填欄位');
      return;
    }

    try {
      const response = await addUser(formData);
      if (response.success) {
        await loadUsers();
        setShowAddModal(false);
        resetForm();
      } else {
        alert('新增失敗：' + response.message);
      }
    } catch (error) {
      console.error('新增使用者錯誤:', error);
      alert('新增使用者失敗');
    }
  };

  // 處理編輯使用者
  const handleEditUser = async () => {
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim()) {
      alert('請填寫所有必填欄位');
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      // 只有填寫密碼時才更新密碼
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      const response = await updateUser(editingUser.id, updateData);
      if (response.success) {
        await loadUsers();
        setShowEditModal(false);
        setEditingUser(null);
        resetForm();
      } else {
        alert('更新失敗：' + response.message);
      }
    } catch (error) {
      console.error('更新使用者錯誤:', error);
      alert('更新使用者失敗');
    }
  };

  // 處理刪除使用者
  const handleDeleteUser = async (userId) => {
    try {
      const response = await deleteUser(userId);
      if (response.success) {
        await loadUsers();
        setShowDeleteConfirm(null);
      } else {
        alert('刪除失敗：' + response.message);
      }
    } catch (error) {
      console.error('刪除使用者錯誤:', error);
      alert('刪除使用者失敗');
    }
  };

  // 開啟編輯對話框
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '', // 編輯時不顯示密碼
      role: user.role
    });
    setShowEditModal(true);
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'viewer'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent"
               style={{ color: 'var(--ncku-red)' }}>
          </div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">使用者管理</h3>
          <p className="text-sm text-gray-600 mt-1">管理系統管理員帳號</p>
        </div>
        {isAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer w-full sm:w-auto"
            style={{ backgroundColor: 'var(--ncku-red)' }}
          >
            + 新增使用者
          </button>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg text-center sm:text-left">
            僅管理員可新增使用者
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">帳號</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">狀態</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '管理員' : user.role === 'manager' ? '主管' : '檢視者'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {isAdmin ? (
                      <>
                        <button 
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-800 mr-2 sm:mr-3 cursor-pointer"
                        >
                          編輯
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(user)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          刪除
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">無權限</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 小螢幕提示 */}
      <div className="md:hidden text-sm text-gray-500 text-center">
        <p>💡 向左滑動查看更多資訊</p>
      </div>

      {/* 新增使用者對話框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h3 className="text-lg font-semibold mb-4">新增使用者</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入姓名"
                  style={{ focusRing: 'var(--ncku-red)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳號 *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入帳號"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入 Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密碼 *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入密碼"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none cursor-pointer"
                >
                  <option value="admin">管理員</option>
                  <option value="manager">主管</option>
                  <option value="viewer">檢視者</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                disabled={!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()}
                className="px-4 py-2 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--ncku-red)' }}
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯使用者對話框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h3 className="text-lg font-semibold mb-4">編輯使用者</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳號 *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入帳號"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入 Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="留空則不修改密碼"
                />
                <p className="text-xs text-gray-500 mt-1">留空則保持原密碼不變</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none cursor-pointer"
                >
                  <option value="admin">管理員</option>
                  <option value="manager">主管</option>
                  <option value="viewer">檢視者</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleEditUser}
                disabled={!formData.name.trim() || !formData.username.trim() || !formData.email.trim()}
                className="px-4 py-2 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--ncku-red)' }}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">確認刪除</h3>
            <p className="text-gray-600 text-center mb-6">
              確定要刪除使用者「{showDeleteConfirm.name}」嗎？此操作無法復原。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 通知設定子組件
function NotificationSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">通知設定</h3>
        <p className="text-sm text-gray-600 mb-6">管理系統通知和警告</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Email 通知</p>
            <p className="text-sm text-gray-500">啟用 Email 通知功能</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => onChange('emailNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ncku-red"
              style={settings.emailNotifications ? { backgroundColor: 'var(--ncku-red)' } : {}}
            ></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">上傳成功通知</p>
            <p className="text-sm text-gray-500">檔案上傳成功時發送通知</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.uploadSuccessNotif}
              onChange={(e) => onChange('uploadSuccessNotif', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ncku-red"
              style={settings.uploadSuccessNotif ? { backgroundColor: 'var(--ncku-red)' } : {}}
            ></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">上傳失敗通知</p>
            <p className="text-sm text-gray-500">檔案上傳失敗時發送通知</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.uploadFailNotif}
              onChange={(e) => onChange('uploadFailNotif', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ncku-red"
              style={settings.uploadFailNotif ? { backgroundColor: 'var(--ncku-red)' } : {}}
            ></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">儲存空間警告</p>
            <p className="text-sm text-gray-500">儲存空間不足時發送警告</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.storageWarning}
              onChange={(e) => onChange('storageWarning', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ncku-red"
              style={settings.storageWarning ? { backgroundColor: 'var(--ncku-red)' } : {}}
            ></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">每週報告</p>
            <p className="text-sm text-gray-500">每週發送使用統計報告</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.weeklyReport}
              onChange={(e) => onChange('weeklyReport', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ncku-red"
              style={settings.weeklyReport ? { backgroundColor: 'var(--ncku-red)' } : {}}
            ></div>
          </label>
        </div>
      </div>
    </div>
  );
}

// 備份設定子組件
function BackupSettings({ settings, onChange }) {
  const [backupHistory, setBackupHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // 載入備份歷史
  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getBackupHistory();
      if (response.success) {
        setBackupHistory(response.data);
      } else {
        console.error('載入備份歷史失敗:', response.message);
      }
    } catch (error) {
      console.error('載入備份歷史錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (confirm('確定要建立新的備份嗎？')) {
      setIsCreatingBackup(true);
      try {
        const response = await createBackup();
        if (response.success) {
          alert('備份建立成功！');
          await loadBackupHistory();
        } else {
          alert('備份失敗：' + response.message);
        }
      } catch (error) {
        console.error('建立備份錯誤:', error);
        alert('建立備份失敗');
      } finally {
        setIsCreatingBackup(false);
      }
    }
  };

  const handleRestore = async (backupId) => {
    if (confirm('確定要還原此備份嗎？這將覆蓋目前的所有資料！')) {
      try {
        const response = await restoreBackup(backupId);
        if (response.success) {
          alert('備份還原成功！');
        } else {
          alert('還原失敗：' + response.message);
        }
      } catch (error) {
        console.error('還原備份錯誤:', error);
        alert('還原備份失敗');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">備份設定</h3>
        <p className="text-sm text-gray-600 mb-6">管理資料備份和還原</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">自動備份</p>
            <p className="text-sm text-gray-500">啟用自動備份功能</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => onChange('autoBackup', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ncku-red"
              style={settings.autoBackup ? { backgroundColor: 'var(--ncku-red)' } : {}}
            ></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            備份頻率
          </label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => onChange('backupFrequency', e.target.value)}
            disabled={!settings.autoBackup}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ncku-red focus:border-transparent cursor-pointer disabled:bg-gray-100"
          >
            <option value="daily">每天</option>
            <option value="weekly">每週</option>
            <option value="monthly">每月</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="w-full px-4 py-3 text-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--ncku-red)' }}
          >
            {isCreatingBackup ? '建立中...' : '立即建立備份'}
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">備份歷史</h4>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent"
                 style={{ color: 'var(--ncku-red)' }}>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {backupHistory.map(backup => (
              <div key={backup.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{backup.date}</p>
                    <p className="text-xs text-gray-500">{backup.size}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRestore(backup.id)}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  還原
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 系統資訊子組件
function SystemInfo() {
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 載入系統資訊
  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    setIsLoading(true);
    try {
      const response = await getSystemInfo();
      if (response.success) {
        setSystemStats(response.data);
      } else {
        console.error('載入系統資訊失敗:', response.message);
      }
    } catch (error) {
      console.error('載入系統資訊錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !systemStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent"
               style={{ color: 'var(--ncku-red)' }}>
          </div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">系統資訊</h3>
        <p className="text-sm text-gray-600 mb-6">查看系統運行狀態和統計資料</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">系統版本</p>
            <p className="text-lg font-semibold">{systemStats.version}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">運行時間</p>
            <p className="text-lg font-semibold">{systemStats.uptime}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">總檔案數</p>
            <p className="text-lg font-semibold">{systemStats.totalFiles}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">檔案總大小</p>
            <p className="text-lg font-semibold">{systemStats.totalSize}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">本月 API 呼叫</p>
            <p className="text-lg font-semibold">{systemStats.apiCalls.toLocaleString()}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">最後備份</p>
            <p className="text-lg font-semibold">{systemStats.lastBackup}</p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-3">儲存空間使用率</p>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${(12.5 / 100) * 100}%`,
                  backgroundColor: 'var(--ncku-red)'
                }}
              ></div>
            </div>
          </div>
          <p className="text-sm font-semibold whitespace-nowrap">
            {systemStats.storageUsed} / {systemStats.storageTotal}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          使用 {((12.5 / 100) * 100).toFixed(1)}% 的可用空間
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
