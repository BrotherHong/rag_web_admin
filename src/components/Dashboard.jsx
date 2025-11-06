import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  logout, 
  getStatistics, 
  getRecentActivities,
  getCategoriesWithDetails,
  addCategory,
  deleteCategory
} from '../services/api';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from './common/ConfirmDialog';
import KnowledgeBase from './KnowledgeBase';
import UploadFiles from './UploadFiles';

function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
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
      return userStr ? JSON.parse(userStr) : { name: '管理員', username: 'Admin', role: 'admin', departmentId: null };
    } catch {
      return { name: '管理員', username: 'Admin', role: 'admin', departmentId: null };
    }
  };

  const user = getUserInfo();
  
  // 返回系統管理後台（當系統管理員代理時）
  const returnToSuperAdmin = () => {
    try {
      const superAdminUserStr = localStorage.getItem('superAdminUser');
      if (superAdminUserStr) {
        const superAdminUser = JSON.parse(superAdminUserStr);
        localStorage.setItem('user', JSON.stringify(superAdminUser));
        localStorage.removeItem('superAdminUser');
        
        // 先導航，再非同步觸發事件，減少閃爍
        navigate('/super-admin', { replace: true });
        
        // 使用 setTimeout 確保導航完成後再觸發事件
        setTimeout(() => {
          window.dispatchEvent(new Event('authChange'));
        }, 0);
      }
    } catch (error) {
      console.error('返回系統管理後台錯誤:', error);
    }
  };
  
  // 取得處室名稱
  const getDepartmentName = () => {
    // 登入時後端已返回 departmentName,直接使用即可
    if (user.departmentName) {
      return user.departmentName;
    }
    
    // 系統管理員沒有處室
    if (!user.departmentId) return '系統';
    
    // 如果缺少 departmentName,顯示預設值
    return '未知處室';
  };

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
                  <h1 className="text-xl font-bold">{getDepartmentName()} AI 客服</h1>
                  <p className="text-xs text-red-100">後台管理系統</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <div className="flex items-center justify-end space-x-2">
                  <p className="text-xs text-red-100">{user.username}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    管理員
                  </span>
                  {user.isSuperAdminProxy && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      系統管理員代理
                    </span>
                  )}
                </div>
              </div>
              {user.isSuperAdminProxy && (
                <button
                  onClick={returnToSuperAdmin}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>返回系統管理</span>
                </button>
              )}
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
              onClick={() => setCurrentPage('categories')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                currentPage === 'categories'
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={currentPage === 'categories' ? { backgroundColor: 'var(--ncku-red)' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-medium">分類管理</span>
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
          {currentPage === 'categories' && <CategoryManagement />}
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
      } else {
        // API 調用失敗時,設定一個空的預設值而不是 null
        console.error('獲取統計資料失敗:', statsResponse.message);
        setStats({
          totalFiles: 0,
          filesByCategory: {},
          monthlyQueries: 0,
          systemStatus: { status: 'unknown', message: '無法獲取系統狀態' },
          storageUsed: '0 GB',
          storageTotal: '100 GB'
        });
      }

      if (activitiesResponse.success) {
        setActivities(activitiesResponse.data);
      } else {
        console.error('獲取活動記錄失敗:', activitiesResponse.message);
      }
    } catch (error) {
      console.error('載入儀表板資料錯誤:', error);
      // 發生異常時也設定預設值
      setStats({
        totalFiles: 0,
        filesByCategory: {},
        monthlyQueries: 0,
        systemStatus: { status: 'error', message: '載入失敗' },
        storageUsed: '0 GB',
        storageTotal: '100 GB'
      });
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <svg className="w-8 h-8" style={{ color: 'var(--ncku-red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-800 font-medium mb-2">無法載入儀表板資料</p>
        <p className="text-gray-600 text-sm mb-4">請確認您的帳號已正確登入並分配到處室</p>
        <button 
          onClick={loadDashboardData}
          className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--ncku-red)' }}
        >
          重新載入
        </button>
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
                {stats.systemStatus?.status === 'running' ? '運行正常' : 
                 stats.systemStatus?.status === 'unknown' ? '未知' : '異常'}
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

// 分類管理頁面組件
function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');
  const [isLoading, setIsLoading] = useState(true);

  // 對話框動畫
  const addModal = useModalAnimation(showAddModal, () => setShowAddModal(false));
  const deleteModal = useModalAnimation(showDeleteConfirm !== null, () => setShowDeleteConfirm(null));

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
          addModal.handleClose();
          toast.success('分類新增成功');
        } else {
          toast.error('新增失敗：' + response.message);
        }
      } catch (error) {
        console.error('新增分類錯誤:', error);
        toast.error('新增分類失敗');
      }
    }
  };

  const handleDeleteCategory = async (category) => {
    setShowDeleteConfirm(category);
  };

  const confirmDeleteCategory = async () => {
    try {
      const response = await deleteCategory(showDeleteConfirm.id);
      if (response.success) {
        // 重新載入分類列表
        await loadCategories();
        toast.success('分類刪除成功');
      } else {
        toast.error('刪除失敗：' + response.message);
      }
    } catch (error) {
      console.error('刪除分類錯誤:', error);
      toast.error('刪除分類失敗');
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
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--ncku-red)' }}
        >
          + 新增分類
        </button>
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
              {category.name !== '未分類' && (
                <button
                  onClick={() => handleDeleteCategory(category)}
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

      {addModal.shouldRender && (
        <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 ${addModal.animationClass}`}>
          <div className={`bg-white rounded-lg p-6 w-96 mx-4 ${addModal.contentAnimationClass}`}>
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
                  addModal.handleClose();
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

      <ConfirmDialog
        shouldRender={deleteModal.shouldRender}
        isClosing={deleteModal.isClosing}
        animationClass={deleteModal.animationClass}
        contentAnimationClass={deleteModal.contentAnimationClass}
        onClose={deleteModal.handleClose}
        onConfirm={confirmDeleteCategory}
        title="確認刪除"
        message={`確定要刪除分類「${showDeleteConfirm?.name}」嗎？`}
        confirmText="刪除"
        cancelText="取消"
      />
    </div>
  );
}

export default Dashboard;
