import { useState, useEffect } from 'react';
import { getFiles, deleteFile, downloadFile, getCategoriesWithDetails } from '../services/api';

function KnowledgeBase() {
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({}); // 用於儲存分類名稱到顏色的對應
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // 載入檔案列表和分類
  useEffect(() => {
    loadFiles();
    loadCategories();
  }, [searchTerm, selectedCategory]);

  // 載入檔案列表
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await getFiles({
        search: searchTerm,
        category: selectedCategory
      });
      
      if (response.success) {
        setFiles(response.data.files);
      } else {
        console.error('載入檔案失敗:', response.message);
      }
    } catch (error) {
      console.error('載入檔案錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 載入分類列表
  const loadCategories = async () => {
    try {
      const response = await getCategoriesWithDetails();
      
      if (response.success) {
        setCategories(response.data);
        // 建立分類名稱到顏色的對應表
        const map = {};
        response.data.forEach(cat => {
          map[cat.name] = cat.color;
        });
        setCategoryMap(map);
      }
    } catch (error) {
      console.error('載入分類錯誤:', error);
    }
  };

  // 處理檔案刪除
  const handleDelete = async (id) => {
    try {
      const response = await deleteFile(id);
      
      if (response.success) {
        // 重新載入檔案列表
        await loadFiles();
        setShowDeleteConfirm(null);
      } else {
        console.error('刪除失敗:', response.message);
        alert(response.message);
      }
    } catch (error) {
      console.error('刪除錯誤:', error);
      alert('刪除檔案失敗');
    }
  };

  // 處理檔案下載
  const handleDownload = async (id) => {
    try {
      const response = await downloadFile(id);
      
      if (response.success) {
        // 實際應用中會開啟下載連結
        alert(`下載功能：${response.data.fileName}\n（實際應用中會自動下載）`);
      } else {
        console.error('下載失敗:', response.message);
        alert(response.message);
      }
    } catch (error) {
      console.error('下載錯誤:', error);
      alert('下載檔案失敗');
    }
  };

  // 根據顏色返回對應的 Tailwind 類別（標籤背景）
  const getCategoryColorClasses = (categoryName) => {
    const color = categoryMap[categoryName] || 'gray';
    const colorClassMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
      pink: 'bg-pink-100 text-pink-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorClassMap[color] || 'bg-gray-100 text-gray-800';
  };

  // 根據顏色返回對應的邊框顏色類別（卡片邊框）
  const getCategoryBorderClass = (categoryName) => {
    const color = categoryMap[categoryName] || 'gray';
    const borderClassMap = {
      blue: 'border-blue-500',
      green: 'border-green-500',
      yellow: 'border-yellow-500',
      red: 'border-red-500',
      purple: 'border-purple-500',
      pink: 'border-pink-500',
      indigo: 'border-indigo-500',
      orange: 'border-orange-500',
      gray: 'border-gray-500',
    };
    return borderClassMap[color] || 'border-gray-500';
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

  // 計算分類統計
  const getCategoryCount = (category) => {
    return files.filter(f => f.category === category).length;
  };

  return (
    <div>
      {/* 頁面標題 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--ncku-red)' }}>
          知識庫管理
        </h2>
        <p className="text-gray-600">管理人事室 AI 客服的知識庫檔案</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4" 
             style={{ borderColor: 'var(--ncku-red)' }}>
          <p className="text-gray-600 text-sm">總檔案數</p>
          <p className="text-2xl font-bold mt-1">{files.length}</p>
        </div>
        {categories.map(category => (
          <div 
            key={category.id} 
            className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${getCategoryBorderClass(category.name)}`}
          >
            <p className="text-gray-600 text-sm">{category.name}</p>
            <p className="text-2xl font-bold mt-1">
              {getCategoryCount(category.name)}
            </p>
          </div>
        ))}
      </div>

      {/* 操作欄 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* 搜尋框 */}
          <div className="flex-1 md:max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜尋檔案..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          {/* 分類篩選 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'text-white shadow-md'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: 'var(--ncku-red)' } : {}}
            >
              全部
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedCategory === category.name
                    ? 'text-white shadow-md'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
                style={selectedCategory === category.name ? { backgroundColor: 'var(--ncku-red)' } : {}}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 檔案列表 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead style={{ backgroundColor: 'var(--ncku-red)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  檔案名稱
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  類別
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  大小
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  上傳日期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.length > 0 ? (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* 檔案類型圖示 */}
                      <div className="flex-shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColorClasses(file.category)}`}>
                      {file.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {file.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {file.uploadDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer" title="查看詳情">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900 transition-colors cursor-pointer"
                        onClick={() => handleDownload(file.id)}
                        title="下載檔案"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(file.id)}
                        style={{ color: 'var(--ncku-red)' }}
                        className="hover:opacity-70 transition-opacity cursor-pointer"
                        title="刪除檔案"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>找不到符合條件的檔案</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 刪除確認模態框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scaleIn">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto bg-red-50">
              <svg className="w-6 h-6" style={{ color: 'var(--ncku-red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">確認刪除</h3>
            <p className="text-gray-600 text-center mb-6">
              確定要刪除此檔案嗎？此操作無法復原。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg text-white shadow-lg hover:shadow-xl transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--ncku-red)' }}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeBase;
