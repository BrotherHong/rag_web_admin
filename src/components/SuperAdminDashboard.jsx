import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  logout, 
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getSettings,
  updateSettings,
  getSystemInfo,
  getAllActivities
} from '../services/api';

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('departments'); // departments, users, settings, activities
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 活動記錄相關
  const [allActivities, setAllActivities] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all'); // 'all' 或 departmentId
  
  // 系統設定相關
  const [systemSettings, setSystemSettings] = useState(null);
  const [tempSettings, setTempSettings] = useState(null); // 暫存修改
  const [systemInfo, setSystemInfo] = useState(null);
  const [activeSettingTab, setActiveSettingTab] = useState('ai-model'); // ai-model, rag, backup, system-info
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null); // 上次儲存時間
  
  // 處室相關的 state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [statsData, setStatsData] = useState(null);
  
  // 使用者相關的 state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // 表單資料
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });
  
  // 使用者表單資料
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    departmentId: ''
  });

  // 可用的顏色選項
  const colorOptions = [
    { value: 'red', label: '紅色', class: 'bg-red-500' },
    { value: 'blue', label: '藍色', class: 'bg-blue-500' },
    { value: 'green', label: '綠色', class: 'bg-green-500' },
    { value: 'yellow', label: '黃色', class: 'bg-yellow-500' },
    { value: 'purple', label: '紫色', class: 'bg-purple-500' },
    { value: 'pink', label: '粉色', class: 'bg-pink-500' },
    { value: 'indigo', label: '靛藍', class: 'bg-indigo-500' },
    { value: 'orange', label: '橙色', class: 'bg-orange-500' },
  ];

  // 獲取使用者資訊
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : { name: '系統管理員', username: 'SuperAdmin', role: 'super_admin' };
    } catch {
      return { name: '系統管理員', username: 'SuperAdmin', role: 'super_admin' };
    }
  };

  const user = getUserInfo();

  // 載入處室列表
  useEffect(() => {
    loadDepartments();
    loadUsers();
    loadSystemSettings();
    loadSystemInfo();
    loadActivities();
  }, []);
  
  // 當切換處室篩選時重新載入活動
  useEffect(() => {
    if (currentPage === 'activities') {
      loadActivities();
    }
  }, [selectedDepartment, currentPage]);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await getDepartments();
      if (response.success) {
        setDepartments(response.data);
      } else {
        console.error('載入處室失敗:', response.message);
      }
    } catch (error) {
      console.error('載入處室錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 載入使用者列表
  const loadUsers = async () => {
    try {
      const response = await getUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        console.error('載入使用者失敗:', response.message);
      }
    } catch (error) {
      console.error('載入使用者錯誤:', error);
    }
  };
  
  // 載入系統設定
  const loadSystemSettings = async () => {
    try {
      const response = await getSettings();
      if (response.success) {
        setSystemSettings(response.data);
        setTempSettings(response.data); // 初始化暫存設定
        setHasUnsavedChanges(false);
      } else {
        console.error('載入系統設定失敗:', response.message);
      }
    } catch (error) {
      console.error('載入系統設定錯誤:', error);
    }
  };
  
  // 載入系統資訊
  const loadSystemInfo = async () => {
    try {
      const response = await getSystemInfo();
      if (response.success) {
        setSystemInfo(response.data);
      } else {
        console.error('載入系統資訊失敗:', response.message);
      }
    } catch (error) {
      console.error('載入系統資訊錯誤:', error);
    }
  };
  
  // 載入活動記錄
  const loadActivities = async () => {
    try {
      const deptId = selectedDepartment === 'all' ? null : parseInt(selectedDepartment);
      const response = await getAllActivities(deptId, 100);
      if (response.success) {
        setAllActivities(response.data);
      } else {
        console.error('載入活動記錄失敗:', response.message);
      }
    } catch (error) {
      console.error('載入活動記錄錯誤:', error);
    }
  };
  
  // 更新暫存設定
  const handleSettingsChange = (key, value) => {
    setTempSettings({ ...tempSettings, [key]: value });
    setHasUnsavedChanges(true);
  };
  
  // 儲存設定
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await updateSettings(tempSettings);
      if (response.success) {
        setSystemSettings(tempSettings);
        setHasUnsavedChanges(false);
        setLastSavedTime(new Date()); // 記錄儲存時間
        alert('設定已成功儲存!');
      } else {
        alert('儲存失敗：' + response.message);
      }
    } catch (error) {
      console.error('儲存設定錯誤:', error);
      alert('儲存設定失敗');
    } finally {
      setIsSavingSettings(false);
    }
  };
  
  // 取消變更
  const handleCancelSettings = () => {
    setTempSettings(systemSettings);
    setHasUnsavedChanges(false);
  };

  // 處理登出
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logout();
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authChange'));
      navigate('/', { replace: true });
    } catch (error) {
      console.error('登出錯誤:', error);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authChange'));
      navigate('/', { replace: true });
    }
  };

  // 處理新增處室
  const handleAddDepartment = async () => {
    if (!formData.name.trim()) {
      alert('請填寫處室名稱');
      return;
    }

    try {
      const response = await addDepartment(formData);
      if (response.success) {
        await loadDepartments();
        setShowAddModal(false);
        resetForm();
      } else {
        alert('新增失敗：' + response.message);
      }
    } catch (error) {
      console.error('新增處室錯誤:', error);
      alert('新增處室失敗');
    }
  };

  // 處理編輯處室
  const handleEditDepartment = async () => {
    if (!formData.name.trim()) {
      alert('請填寫處室名稱');
      return;
    }

    try {
      const response = await updateDepartment(editingDept.id, formData);
      if (response.success) {
        await loadDepartments();
        setShowEditModal(false);
        setEditingDept(null);
        resetForm();
      } else {
        alert('更新失敗：' + response.message);
      }
    } catch (error) {
      console.error('更新處室錯誤:', error);
      alert('更新處室失敗');
    }
  };

  // 處理刪除處室
  const handleDeleteDepartment = async (deptId) => {
    try {
      const response = await deleteDepartment(deptId);
      if (response.success) {
        await loadDepartments();
        setShowDeleteConfirm(null);
      } else {
        alert('刪除失敗：' + response.message);
      }
    } catch (error) {
      console.error('刪除處室錯誤:', error);
      alert('刪除處室失敗');
    }
  };

  // 開啟編輯對話框
  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      color: dept.color
    });
    setShowEditModal(true);
  };

  // 進入處事管理頁面
  const enterDepartmentDashboard = (dept) => {
    // 暫存系統管理員的資訊
    const superAdminUser = getUserInfo();
    localStorage.setItem('superAdminUser', JSON.stringify(superAdminUser));
    
    // 建立一個臨時的處事管理員身分
    const tempUser = {
      id: dept.id,
      username: `${dept.name}_admin`,
      name: `${dept.name} 管理員 (系統管理員代理)`,
      role: 'admin',
      departmentId: dept.id,
      departmentName: dept.name,
      isSuperAdminProxy: true // 標記為系統管理員代理
    };
    
    localStorage.setItem('user', JSON.stringify(tempUser));
    
    // 先導航，再非同步觸發事件，減少閃爍
    navigate('/dashboard', { replace: true });
    
    // 使用 setTimeout 確保導航完成後再觸發事件
    setTimeout(() => {
      window.dispatchEvent(new Event('authChange'));
    }, 0);
  };

  // 查看處室統計
  const viewStats = async (dept) => {
    try {
      const response = await getDepartmentStats(dept.id);
      if (response.success) {
        setStatsData(response.data);
        setShowStatsModal(dept);
      } else {
        alert('獲取統計資料失敗：' + response.message);
      }
    } catch (error) {
      console.error('獲取統計資料錯誤:', error);
      alert('獲取統計資料失敗');
    }
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'blue'
    });
  };
  
  // 重置使用者表單
  const resetUserForm = () => {
    setUserFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      departmentId: ''
    });
  };
  
  // 處理新增使用者
  const handleAddUser = async () => {
    if (!userFormData.name.trim() || !userFormData.username.trim() || 
        !userFormData.email.trim() || !userFormData.password.trim() || !userFormData.departmentId) {
      alert('請填寫所有必填欄位');
      return;
    }

    try {
      const response = await addUser(userFormData);
      if (response.success) {
        await loadUsers();
        await loadDepartments(); // 重新載入處室列表以更新使用者數量
        setShowAddUserModal(false);
        resetUserForm();
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
    if (!userFormData.name.trim() || !userFormData.username.trim() || 
        !userFormData.email.trim() || !userFormData.departmentId) {
      alert('請填寫所有必填欄位');
      return;
    }

    try {
      const updateData = {
        name: userFormData.name,
        username: userFormData.username,
        email: userFormData.email,
        departmentId: userFormData.departmentId
      };
      
      // 只有填寫密碼時才更新密碼
      if (userFormData.password.trim()) {
        updateData.password = userFormData.password;
      }

      const response = await updateUser(editingUser.id, updateData);
      if (response.success) {
        await loadUsers();
        await loadDepartments(); // 重新載入處室列表以更新使用者數量
        setShowEditUserModal(false);
        setEditingUser(null);
        resetUserForm();
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
        await loadDepartments(); // 重新載入處室列表以更新使用者數量
        setShowDeleteUserConfirm(null);
      } else {
        alert('刪除失敗：' + response.message);
      }
    } catch (error) {
      console.error('刪除使用者錯誤:', error);
      alert('刪除使用者失敗');
    }
  };

  // 開啟編輯使用者對話框
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '', // 編輯時不顯示密碼
      departmentId: user.departmentId || ''
    });
    setShowEditUserModal(true);
  };
  
  // 根據處室 ID 獲取處室名稱
  const getDepartmentNameById = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : '未分配';
  };

  // 根據顏色名稱返回對應的 class
  const getColorClass = (color) => {
    const colorMap = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500',
    };
    return colorMap[color] || 'bg-gray-500';
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <h1 className="text-xl font-bold">AI 客服系統</h1>
                  <p className="text-xs text-red-100">系統管理後台</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <div className="flex items-center justify-end space-x-2">
                  <p className="text-xs text-red-100">{user.username}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    系統管理員
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

      {/* 主要內容區域 */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* 頁籤導航 */}
          <div className="flex space-x-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setCurrentPage('departments')}
              className={`px-6 py-3 font-medium transition-all cursor-pointer relative ${
                currentPage === 'departments'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={currentPage === 'departments' ? {
                backgroundColor: 'var(--ncku-red)',
                borderRadius: '8px 8px 0 0'
              } : {}}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>處室管理</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentPage('users')}
              className={`px-6 py-3 font-medium transition-all cursor-pointer relative ${
                currentPage === 'users'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={currentPage === 'users' ? {
                backgroundColor: 'var(--ncku-red)',
                borderRadius: '8px 8px 0 0'
              } : {}}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>使用者管理</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`px-6 py-3 font-medium transition-all cursor-pointer relative ${
                currentPage === 'settings'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={currentPage === 'settings' ? {
                backgroundColor: 'var(--ncku-red)',
                borderRadius: '8px 8px 0 0'
              } : {}}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>系統設定</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentPage('activities')}
              className={`px-6 py-3 font-medium transition-all cursor-pointer relative ${
                currentPage === 'activities'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={currentPage === 'activities' ? {
                backgroundColor: 'var(--ncku-red)',
                borderRadius: '8px 8px 0 0'
              } : {}}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>活動記錄</span>
              </div>
            </button>
          </div>

          {/* 處室管理頁面 */}
          {currentPage === 'departments' && (
            <>
              {/* 標題和新增按鈕 */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: 'var(--ncku-red)' }}>
                    處室管理
                  </h2>
                  <p className="text-gray-600 mt-2">管理各處室的 AI 客服後台系統</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium flex items-center space-x-2"
                  style={{ backgroundColor: 'var(--ncku-red)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>新增處室</span>
                </button>
              </div>

          {/* 處室卡片列表 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent"
                     style={{ color: 'var(--ncku-red)' }}>
                </div>
                <p className="mt-4 text-gray-600">載入中...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map(dept => (
                <div key={dept.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-t-4"
                     style={{ borderColor: `var(--${dept.color}-500)` }}>
                  {/* 卡片頭部 */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg ${getColorClass(dept.color)} flex items-center justify-center text-white text-xl font-bold`}>
                          {dept.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-500">{dept.description || '暫無描述'}</p>
                        </div>
                      </div>
                    </div>

                    {/* 統計資訊 */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{dept.userCount}</p>
                            <p className="text-xs text-gray-500">使用者</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{dept.fileCount}</p>
                            <p className="text-xs text-gray-500">檔案</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => enterDepartmentDashboard(dept)}
                        className="col-span-2 px-4 py-2 text-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer text-sm font-medium"
                        style={{ backgroundColor: 'var(--ncku-red)' }}
                      >
                        進入管理
                      </button>
                      <button
                        onClick={() => viewStats(dept)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-sm font-medium"
                      >
                        查看詳情
                      </button>
                      <button
                        onClick={() => openEditModal(dept)}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(dept)}
                        className="col-span-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-sm font-medium"
                      >
                        刪除
                      </button>
                    </div>
                  </div>

                  {/* 卡片底部 */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">建立日期：{dept.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}

          {/* 使用者管理頁面 */}
          {currentPage === 'users' && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: 'var(--ncku-red)' }}>
                    使用者管理
                  </h2>
                  <p className="text-gray-600 mt-2">管理處事管理員帳號</p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium flex items-center space-x-2"
                  style={{ backgroundColor: 'var(--ncku-red)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>新增使用者</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent"
                         style={{ color: 'var(--ncku-red)' }}>
                    </div>
                    <p className="mt-4 text-gray-600">載入中...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">姓名</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">帳號</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">所屬處室</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">狀態</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.filter(u => u.role === 'admin').map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{user.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{user.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">{user.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {getDepartmentNameById(user.departmentId)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                {user.status === 'active' ? '啟用' : '停用'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <button 
                                onClick={() => openEditUserModal(user)}
                                className="text-blue-600 hover:text-blue-800 mr-2 sm:mr-3 cursor-pointer"
                              >
                                編輯
                              </button>
                              <button 
                                onClick={() => setShowDeleteUserConfirm(user)}
                                className="text-red-600 hover:text-red-800 cursor-pointer"
                              >
                                刪除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 小螢幕提示 */}
              <div className="md:hidden text-sm text-gray-500 text-center mt-4">
                <p>💡 向左滑動查看更多資訊</p>
              </div>
            </>
          )}

          {/* 系統設定頁面 */}
          {currentPage === 'settings' && systemSettings && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--ncku-red)' }}>
                  系統設定
                </h2>
                <p className="text-gray-600">管理系統全域設定</p>
              </div>

              {/* 設定子頁籤 */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveSettingTab('ai-model')}
                    className={`px-6 py-3 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeSettingTab === 'ai-model'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={activeSettingTab === 'ai-model' ? { backgroundColor: 'var(--ncku-red)' } : {}}
                  >
                    AI 模型設定
                  </button>
                  <button
                    onClick={() => setActiveSettingTab('rag')}
                    className={`px-6 py-3 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeSettingTab === 'rag'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={activeSettingTab === 'rag' ? { backgroundColor: 'var(--ncku-red)' } : {}}
                  >
                    RAG 設定
                  </button>
                  <button
                    onClick={() => setActiveSettingTab('backup')}
                    className={`px-6 py-3 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeSettingTab === 'backup'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={activeSettingTab === 'backup' ? { backgroundColor: 'var(--ncku-red)' } : {}}
                  >
                    備份設定
                  </button>
                  <button
                    onClick={() => setActiveSettingTab('system-info')}
                    className={`px-6 py-3 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeSettingTab === 'system-info'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={activeSettingTab === 'system-info' ? { backgroundColor: 'var(--ncku-red)' } : {}}
                  >
                    系統資訊
                  </button>
                </div>

                <div className="p-6">
                  {/* 儲存/取消按鈕區 - 只在非系統資訊頁面顯示 */}
                  {activeSettingTab !== 'system-info' && (
                    <div className="flex justify-end space-x-3 mb-6 pb-6 border-b border-gray-200">
                      {hasUnsavedChanges && (
                        <>
                          <button
                            onClick={handleCancelSettings}
                            disabled={isSavingSettings}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            取消變更
                          </button>
                          <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            style={{ backgroundColor: 'var(--ncku-red)' }}
                          >
                            {isSavingSettings ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-solid border-white border-r-transparent"></div>
                                <span>儲存中...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>儲存設定</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {!hasUnsavedChanges && lastSavedTime && (
                        <div className="text-sm text-green-600 flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>設定已儲存</span>
                          <span className="text-gray-500">
                            ({lastSavedTime.toLocaleString('zh-TW', { 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI 模型設定 */}
                  {activeSettingTab === 'ai-model' && tempSettings && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">AI 模型</label>
                        <select
                          value={tempSettings.aiModel}
                          onChange={(e) => handleSettingsChange('aiModel', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                        >
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="claude-3">Claude 3</option>
                          <option value="llama-2">Llama 2</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperature: {tempSettings.temperature}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={tempSettings.temperature}
                          onChange={(e) => handleSettingsChange('temperature', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>精確</span>
                          <span>創意</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Tokens: {tempSettings.maxTokens}
                        </label>
                        <input
                          type="range"
                          min="100"
                          max="4000"
                          step="100"
                          value={tempSettings.maxTokens}
                          onChange={(e) => handleSettingsChange('maxTokens', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>100</span>
                          <span>4000</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Top P: {tempSettings.topP}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={tempSettings.topP}
                          onChange={(e) => handleSettingsChange('topP', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">回應風格</label>
                        <select
                          value={tempSettings.tone}
                          onChange={(e) => handleSettingsChange('tone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                        >
                          <option value="professional">專業 (Professional)</option>
                          <option value="friendly">友善 (Friendly)</option>
                          <option value="casual">隨意 (Casual)</option>
                          <option value="formal">正式 (Formal)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* RAG 設定 */}
                  {activeSettingTab === 'rag' && tempSettings && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          相似度閾值: {tempSettings.similarityThreshold}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={tempSettings.similarityThreshold}
                          onChange={(e) => handleSettingsChange('similarityThreshold', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">設定文檔檢索的最低相似度要求</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大檢索文檔數: {tempSettings.maxRetrievalDocs}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={tempSettings.maxRetrievalDocs}
                          onChange={(e) => handleSettingsChange('maxRetrievalDocs', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1</span>
                          <span>20</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          自動清理天數: {tempSettings.autoCleanupDays} 天
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="365"
                          step="30"
                          value={tempSettings.autoCleanupDays}
                          onChange={(e) => handleSettingsChange('autoCleanupDays', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">自動清理超過指定天數未使用的文檔</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">索引更新頻率</label>
                        <select
                          value={tempSettings.indexUpdateFrequency}
                          onChange={(e) => handleSettingsChange('indexUpdateFrequency', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                        >
                          <option value="realtime">即時更新</option>
                          <option value="hourly">每小時</option>
                          <option value="daily">每日</option>
                          <option value="weekly">每週</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 備份設定 */}
                  {activeSettingTab === 'backup' && tempSettings && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">自動備份</p>
                          <p className="text-sm text-gray-600">定期自動備份系統資料</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempSettings.autoBackup}
                            onChange={(e) => handleSettingsChange('autoBackup', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      {tempSettings.autoBackup && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">備份頻率</label>
                          <select
                            value={tempSettings.backupFrequency}
                            onChange={(e) => handleSettingsChange('backupFrequency', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                          >
                            <option value="daily">每日</option>
                            <option value="weekly">每週</option>
                            <option value="monthly">每月</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900">備份歷史</h4>
                          <button
                            onClick={() => alert('立即備份功能')}
                            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: 'var(--ncku-red)' }}
                          >
                            立即備份
                          </button>
                        </div>
                        <div className="space-y-2">
                          {[
                            { date: '2024-01-15 02:00', size: '125 MB', status: 'success' },
                            { date: '2024-01-14 02:00', size: '124 MB', status: 'success' },
                            { date: '2024-01-13 02:00', size: '123 MB', status: 'success' },
                          ].map((backup, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{backup.date}</p>
                                  <p className="text-xs text-gray-500">{backup.size}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => alert('還原備份功能')}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                還原
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 系統資訊 */}
                  {activeSettingTab === 'system-info' && systemInfo && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">系統版本</p>
                          <p className="text-xl font-bold text-gray-900">{systemInfo.version}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">上線時間</p>
                          <p className="text-xl font-bold text-gray-900">{systemInfo.uptime}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">CPU 使用率</p>
                          <p className="text-xl font-bold text-gray-900">{systemInfo.cpuUsage}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">記憶體使用率</p>
                          <p className="text-xl font-bold text-gray-900">{systemInfo.memoryUsage}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">資料庫大小</p>
                          <p className="text-xl font-bold text-gray-900">{systemInfo.databaseSize}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">快取大小</p>
                          <p className="text-xl font-bold text-gray-900">{systemInfo.cacheSize}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">API 請求數</p>
                          <p className="text-xl font-bold text-gray-900">
                            {systemInfo.apiRequests ? systemInfo.apiRequests.toLocaleString() : '0'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">錯誤率</p>
                          <p className="text-xl font-bold text-gray-900">{systemInfo.errorRate}%</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">儲存空間使用</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">已使用空間</span>
                              <span className="font-medium text-gray-900">
                                {systemInfo.storage?.used || '0 GB'} / {systemInfo.storage?.total || '100 GB'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${systemInfo.storage?.percentage || 0}%`,
                                  backgroundColor: (systemInfo.storage?.percentage || 0) > 80 ? '#ef4444' : 'var(--ncku-red)'
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{systemInfo.storage?.percentage || 0}% 使用中</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 活動記錄頁面 */}
          {currentPage === 'activities' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: 'var(--ncku-red)' }}>
                    活動記錄
                  </h2>
                  <p className="text-gray-600 mt-2">查看所有處室的系統操作記錄</p>
                </div>
                
                {/* 處室篩選 */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">篩選處室:</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">所有處室</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 活動列表 */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {allActivities.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {allActivities.map((activity) => {
                      const dept = departments.find(d => d.id === activity.departmentId);
                      return (
                        <div key={activity.id} className="p-5 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {/* 活動類型圖示 */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ 
                                    backgroundColor: 
                                      activity.type === 'upload' ? '#dcfce7' : 
                                      activity.type === 'category_add' ? '#dbeafe' :
                                      activity.type === 'department_add' ? '#fef3c7' :
                                      activity.type === 'department_update' ? '#e0e7ff' :
                                      activity.type === 'user_add' ? '#d1fae5' :
                                      activity.type === 'user_update' ? '#ddd6fe' :
                                      '#fee2e2'
                                  }}>
                                <div style={{ 
                                  color: 
                                    activity.type === 'upload' ? '#16a34a' : 
                                    activity.type === 'category_add' ? '#2563eb' :
                                    activity.type === 'department_add' ? '#ca8a04' :
                                    activity.type === 'department_update' ? '#4f46e5' :
                                    activity.type === 'user_add' ? '#059669' :
                                    activity.type === 'user_update' ? '#7c3aed' :
                                    '#dc2626'
                                }}>
                                  {activity.type === 'upload' && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                  )}
                                  {activity.type === 'delete' && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                  {(activity.type === 'category_add' || activity.type === 'category_delete') && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  )}
                                  {(activity.type === 'department_add' || activity.type === 'department_update') && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                  )}
                                  {activity.type === 'department_delete' && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                  {(activity.type === 'user_add' || activity.type === 'user_update') && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  )}
                                  {activity.type === 'user_delete' && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 活動詳情 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <span className="font-semibold text-gray-900 text-base">
                                  {activity.type === 'upload' && '新增檔案'}
                                  {activity.type === 'delete' && '刪除檔案'}
                                  {activity.type === 'category_add' && '新增分類'}
                                  {activity.type === 'category_delete' && '刪除分類'}
                                  {activity.type === 'department_add' && '新增處室'}
                                  {activity.type === 'department_update' && '更新處室'}
                                  {activity.type === 'department_delete' && '刪除處室'}
                                  {activity.type === 'user_add' && '新增使用者'}
                                  {activity.type === 'user_update' && '更新使用者'}
                                  {activity.type === 'user_delete' && '刪除使用者'}
                                </span>
                                {dept && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                        style={{ 
                                          backgroundColor: `${dept.color === 'blue' ? '#dbeafe' : 
                                                            dept.color === 'green' ? '#dcfce7' :
                                                            dept.color === 'red' ? '#fee2e2' : '#f3f4f6'}`,
                                          color: `${dept.color === 'blue' ? '#1e40af' : 
                                                  dept.color === 'green' ? '#15803d' :
                                                  dept.color === 'red' ? '#991b1b' : '#374151'}`
                                        }}>
                                    {dept.name}
                                  </span>
                                )}
                                {!dept && activity.departmentName && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {activity.departmentName}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-700 mb-3 font-medium">
                                {activity.fileName || activity.categoryName || activity.userName || activity.departmentName || '系統操作'}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {activity.user}
                                </span>
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {new Date(activity.timestamp).toLocaleString('zh-TW', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg">尚無活動記錄</p>
                    <p className="text-gray-400 text-sm mt-2">系統操作記錄將顯示在這裡</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 新增處室對話框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg animate-scaleIn">
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--ncku-red)' }}>新增處室</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">處室名稱 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入處室名稱"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">處室描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入處室描述"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇顏色</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.color === color.value 
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
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddDepartment}
                disabled={!formData.name.trim()}
                className="px-6 py-2 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--ncku-red)' }}
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯處室對話框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg animate-scaleIn">
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--ncku-red)' }}>編輯處室</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">處室名稱 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入處室名稱"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">處室描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入處室描述"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇顏色</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.color === color.value 
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
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDept(null);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleEditDepartment}
                disabled={!formData.name.trim()}
                className="px-6 py-2 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">確認刪除</h3>
            <p className="text-gray-600 text-center mb-6">
              確定要刪除「{showDeleteConfirm.name}」嗎？<br/>
              <span className="text-sm text-red-600">此操作無法復原，請確認該處室已無使用者和檔案。</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteDepartment(showDeleteConfirm.id)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增使用者對話框 */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-scaleIn">
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--ncku-red)' }}>新增使用者</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳號 *</label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入帳號"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入 Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密碼 *</label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入密碼"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所屬處室 *</label>
                <select
                  value={userFormData.departmentId}
                  onChange={(e) => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                >
                  <option value="">請選擇處室</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  resetUserForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                disabled={!userFormData.name.trim() || !userFormData.username.trim() || 
                          !userFormData.email.trim() || !userFormData.password.trim() || !userFormData.departmentId}
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
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-scaleIn">
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--ncku-red)' }}>編輯使用者</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳號 *</label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入帳號"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="請輸入 Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  placeholder="留空則不修改密碼"
                />
                <p className="text-xs text-gray-500 mt-1">留空則保持原密碼不變</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所屬處室 *</label>
                <select
                  value={userFormData.departmentId}
                  onChange={(e) => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                >
                  <option value="">請選擇處室</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  resetUserForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleEditUser}
                disabled={!userFormData.name.trim() || !userFormData.username.trim() || 
                          !userFormData.email.trim() || !userFormData.departmentId}
                className="px-4 py-2 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--ncku-red)' }}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除使用者確認對話框 */}
      {showDeleteUserConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">確認刪除使用者</h3>
            <p className="text-gray-600 text-center mb-6">
              確定要刪除使用者「{showDeleteUserConfirm.name}」嗎？此操作無法復原。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteUserConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteUserConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 統計資料對話框 */}
      {showStatsModal && statsData && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--ncku-red)' }}>
                {showStatsModal.name} - 統計資料
              </h3>
              <button
                onClick={() => {
                  setShowStatsModal(null);
                  setStatsData(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 總覽 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">總檔案數</p>
                  <p className="text-3xl font-bold text-blue-600">{statsData.totalFiles}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">使用者數</p>
                  <p className="text-3xl font-bold text-green-600">{statsData.totalUsers}</p>
                </div>
              </div>

              {/* 分類統計 */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">檔案分類統計</h4>
                <div className="space-y-2">
                  {Object.entries(statsData.filesByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{category}</span>
                      <span className="font-semibold text-gray-900">{count} 個檔案</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最近活動 */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">最近活動</h4>
                {statsData.recentActivities.length > 0 ? (
                  <div className="space-y-2">
                    {statsData.recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'upload' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {activity.type === 'upload' ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.type === 'upload' ? '上傳' : '刪除'} - {activity.fileName}
                          </p>
                          <p className="text-xs text-gray-500">{activity.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">暫無活動記錄</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
