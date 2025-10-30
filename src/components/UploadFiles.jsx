import { useState, useEffect, useRef } from 'react';
import { checkDuplicates, batchUpload, getUploadProgress, getCategories } from '../services/api';

const UploadFiles = ({ onNavigateToKnowledgeBase }) => {
  // 檔案選擇與管理
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fileCategories, setFileCategories] = useState({});
  
  // 重複檢查結果
  const [duplicateCheckResults, setDuplicateCheckResults] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  
  // 上傳狀態
  const [uploading, setUploading] = useState(false);
  const [uploadTaskId, setUploadTaskId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  
  // UI 狀態
  const [currentStep, setCurrentStep] = useState(1); // 1: 選擇檔案, 2: 檢查重複, 3: 上傳中, 4: 結果摘要
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef(null);
  
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
  const isManager = user.role === 'manager' || user.role === 'admin'; // manager 以上可上傳
  
  // 載入分類列表
  useEffect(() => {
    loadCategories();
  }, []);
  
  // 輪詢上傳進度
  useEffect(() => {
    let interval;
    if (uploadTaskId && uploading) {
      interval = setInterval(() => {
        fetchUploadProgress();
      }, 500); // 每 0.5 秒更新一次，讓進度更流暢
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploadTaskId, uploading]);
  
  const loadCategories = async () => {
    const response = await getCategories();
    if (response.success) {
      setCategories(response.data);
    }
  };
  
  // 處理檔案選擇
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // 過濾掉已存在的檔案
    const newFiles = files.filter(file => 
      !selectedFiles.some(f => f.name === file.name && f.size === file.size)
    );
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // 設定預設分類
      const newCategories = { ...fileCategories };
      newFiles.forEach(file => {
        if (!newCategories[file.name]) {
          newCategories[file.name] = '未分類';
        }
      });
      setFileCategories(newCategories);
    }
    
    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 移除選中的檔案
  const removeFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    const newCategories = { ...fileCategories };
    delete newCategories[fileName];
    setFileCategories(newCategories);
  };
  
  // 更新檔案分類
  const updateFileCategory = (fileName, category) => {
    setFileCategories(prev => ({
      ...prev,
      [fileName]: category
    }));
  };
  
  // 檢查重複檔案
  const handleCheckDuplicates = async () => {
    if (selectedFiles.length === 0) {
      alert('請先選擇檔案');
      return;
    }
    
    setCheckingDuplicates(true);
    
    const fileList = selectedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    const response = await checkDuplicates(fileList);
    
    if (response.success) {
      setDuplicateCheckResults(response.data);
      setCurrentStep(2);
    } else {
      alert('檢查重複檔案失敗：' + response.message);
    }
    
    setCheckingDuplicates(false);
  };
  
  // 切換要刪除的舊檔案
  const toggleRemoveFile = (fileId) => {
    setFilesToRemove(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };
  
  // 開始批次上傳
  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('沒有可上傳的檔案');
      return;
    }
    
    setUploading(true);
    setCurrentStep(3);
    
    const uploadData = {
      files: selectedFiles,
      categories: fileCategories,
      removeFileIds: filesToRemove
    };
    
    const response = await batchUpload(uploadData);
    
    if (response.success) {
      setUploadTaskId(response.data.taskId);
    } else {
      alert('建立上傳任務失敗：' + response.message);
      setUploading(false);
    }
  };
  
  // 獲取上傳進度
  const fetchUploadProgress = async () => {
    if (!uploadTaskId) return;
    
    const response = await getUploadProgress(uploadTaskId);
    
    if (response.success) {
      console.log('📊 進度更新:', {
        status: response.data.status,
        processedFiles: response.data.processedFiles,
        totalFiles: response.data.totalFiles,
        files: response.data.files.map(f => ({ name: f.name, status: f.status, progress: f.progress }))
      });
      
      setUploadProgress(response.data);
      
      // 檢查是否完成
      if (response.data.status === 'completed' || response.data.status === 'partial') {
        setUploading(false);
        setShowSummary(true);
        setCurrentStep(4); // 進入結果摘要步驟
      }
    }
  };
  
  // 繼續上傳其他檔案
  const handleContinueUpload = () => {
    setSelectedFiles([]);
    setFileCategories({});
    setDuplicateCheckResults([]);
    setFilesToRemove([]);
    setUploadTaskId(null);
    setUploadProgress(null);
    setCurrentStep(1);
    setUploading(false);
    setShowSummary(false);
  };
  
  // 格式化檔案大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // 根據檔案類型返回圖示
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    // PDF 檔案
    if (ext === 'pdf') {
      return (
        <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // Word 文件
    if (ext === 'doc' || ext === 'docx') {
      return (
        <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // Excel 試算表
    if (ext === 'xls' || ext === 'xlsx') {
      return (
        <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // PowerPoint 簡報
    if (ext === 'ppt' || ext === 'pptx') {
      return (
        <svg className="w-10 h-10 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // 文字檔案
    if (ext === 'txt') {
      return (
        <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // 其他類型（預設圖示）
    return (
      <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };
  
  // 計算總體進度
  const calculateOverallProgress = () => {
    if (!uploadProgress) return 0;
    return Math.round((uploadProgress.processedFiles / uploadProgress.totalFiles) * 100);
  };
  
  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">上傳檔案到知識庫</h1>
        <p className="mt-2 text-sm text-gray-600">
          支援批次上傳多個檔案，系統會自動檢查重複並提供建議
        </p>
      </div>
      
      {/* 權限檢查 */}
      {!isManager ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl shadow-md p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">權限不足</h3>
          <p className="text-gray-600 mb-4">
            您目前的角色為「檢視者」，僅有查看權限。<br />
            上傳檔案功能需要「主管」或「管理員」權限。
          </p>
          <p className="text-sm text-gray-500">
            如需上傳檔案，請聯絡管理員提升您的帳戶權限。
          </p>
        </div>
      ) : (
        <>
      
      {/* 步驟指示器 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className={`flex items-center ${currentStep >= 1 ? '' : 'text-gray-600'}`}
               style={currentStep >= 1 ? { color: 'var(--ncku-red)' } : {}}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
              currentStep >= 1 ? 'text-white' : 'border-gray-400 bg-gray-100 text-gray-600'
            }`}
            style={currentStep >= 1 ? { 
              borderColor: 'var(--ncku-red)', 
              backgroundColor: 'var(--ncku-red)' 
            } : {}}>
              1
            </div>
            <span className="ml-2 font-medium text-sm">選擇檔案</span>
          </div>
          
          <div className={`w-12 h-1 ${currentStep >= 2 ? '' : 'bg-gray-300'}`}
               style={currentStep >= 2 ? { backgroundColor: 'var(--ncku-red)' } : {}}></div>
          
          <div className={`flex items-center ${currentStep >= 2 ? '' : 'text-gray-600'}`}
               style={currentStep >= 2 ? { color: 'var(--ncku-red)' } : {}}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
              currentStep >= 2 ? 'text-white' : 'border-gray-400 bg-gray-100 text-gray-600'
            }`}
            style={currentStep >= 2 ? { 
              borderColor: 'var(--ncku-red)', 
              backgroundColor: 'var(--ncku-red)' 
            } : {}}>
              2
            </div>
            <span className="ml-2 font-medium text-sm">檢查重複</span>
          </div>
          
          <div className={`w-12 h-1 ${currentStep >= 3 ? '' : 'bg-gray-300'}`}
               style={currentStep >= 3 ? { backgroundColor: 'var(--ncku-red)' } : {}}></div>
          
          <div className={`flex items-center ${currentStep >= 3 ? '' : 'text-gray-600'}`}
               style={currentStep >= 3 ? { color: 'var(--ncku-red)' } : {}}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
              currentStep >= 3 ? 'text-white' : 'border-gray-400 bg-gray-100 text-gray-600'
            }`}
            style={currentStep >= 3 ? { 
              borderColor: 'var(--ncku-red)', 
              backgroundColor: 'var(--ncku-red)' 
            } : {}}>
              3
            </div>
            <span className="ml-2 font-medium text-sm">上傳處理</span>
          </div>
          
          <div className={`w-12 h-1 ${currentStep >= 4 ? '' : 'bg-gray-300'}`}
               style={currentStep >= 4 ? { backgroundColor: 'var(--ncku-red)' } : {}}></div>
          
          <div className={`flex items-center ${currentStep >= 4 ? '' : 'text-gray-600'}`}
               style={currentStep >= 4 ? { color: 'var(--ncku-red)' } : {}}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
              currentStep >= 4 ? 'text-white' : 'border-gray-400 bg-gray-100 text-gray-600'
            }`}
            style={currentStep >= 4 ? { 
              borderColor: 'var(--ncku-red)', 
              backgroundColor: 'var(--ncku-red)' 
            } : {}}>
              4
            </div>
            <span className="ml-2 font-medium text-sm">結果摘要</span>
          </div>
        </div>
      </div>
      
      {/* 步驟 1: 選擇檔案 */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* 檔案選擇器 */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-ncku-red transition-colors cursor-pointer shadow-sm"
               onClick={() => fileInputRef.current?.click()}>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm font-semibold text-gray-700">
              點擊選擇檔案或拖曳檔案至此處
            </p>
            <p className="text-xs text-gray-500 mt-1">
              支援 PDF, DOC, DOCX, TXT 等格式，可多次選擇
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
            />
          </div>
          
          {/* 已選擇的檔案列表 */}
          {selectedFiles.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  已選擇 {selectedFiles.length} 個檔案
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center flex-1 min-w-0">
                      {/* 檔案類型圖示 */}
                      <div className="flex-shrink-0 mr-4">
                        {getFileIcon(file.name)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 ml-4">
                      <select
                        value={fileCategories[file.name] || '未分類'}
                        onChange={(e) => updateFileCategory(file.name, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-ncku-red cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer font-medium"
                >
                  繼續選擇
                </button>
                <button
                  onClick={handleCheckDuplicates}
                  disabled={checkingDuplicates}
                  className="px-6 py-2 text-white rounded-md shadow-lg hover:shadow-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer font-medium"
                  style={checkingDuplicates ? {} : { backgroundColor: 'var(--ncku-red)' }}
                >
                  {checkingDuplicates ? '檢查中...' : '下一步：檢查重複'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    請先選擇要上傳的檔案
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    點擊上方區域選擇檔案，可一次選擇多個檔案或多次添加
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 步驟 2: 檢查重複 */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">重複檢查結果</h3>
              <p className="text-sm text-gray-600 mt-1">
                系統已找出可能重複或相關的檔案，請檢查並決定是否要刪除舊檔案
              </p>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {duplicateCheckResults.map((result, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-start">
                    {/* 檔案類型圖示 */}
                    <div className="flex-shrink-0 mr-3">
                      <div className="scale-75">
                        {getFileIcon(result.fileName)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{result.fileName}</span>
                        
                        {result.isDuplicate && (
                          <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            完全重複
                          </span>
                        )}
                        {!result.isDuplicate && result.relatedFiles.length > 0 && (
                          <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            找到 {result.relatedFiles.length} 個相關檔案
                          </span>
                        )}
                        {!result.isDuplicate && result.relatedFiles.length === 0 && (
                          <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            無重複
                          </span>
                        )}
                      </div>
                      
                      {/* 顯示重複或相關的檔案 */}
                      {(result.isDuplicate || result.relatedFiles.length > 0) && (
                        <div className="mt-3 ml-7 space-y-2">
                          {result.isDuplicate && (
                            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                              <input
                                type="checkbox"
                                checked={filesToRemove.includes(result.duplicateFile.id)}
                                onChange={() => toggleRemoveFile(result.duplicateFile.id)}
                                className="mr-3 cursor-pointer"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {result.duplicateFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  現有檔案 · {result.duplicateFile.size} · {result.duplicateFile.uploadDate}
                                </p>
                              </div>
                              <span className="text-xs text-red-600 font-medium">建議刪除</span>
                            </div>
                          )}
                          
                          {result.relatedFiles.map(relatedFile => (
                            <div key={relatedFile.id} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <input
                                type="checkbox"
                                checked={filesToRemove.includes(relatedFile.id)}
                                onChange={() => toggleRemoveFile(relatedFile.id)}
                                className="mr-3 cursor-pointer"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {relatedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {relatedFile.size} · {relatedFile.uploadDate} · {relatedFile.category}
                                </p>
                              </div>
                              <span className="text-xs text-yellow-600">可能相關</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filesToRemove.length > 0 ? (
                    <span className="font-medium" style={{ color: 'var(--ncku-red)' }}>
                      將刪除 {filesToRemove.length} 個舊檔案
                    </span>
                  ) : (
                    <span>未選擇要刪除的檔案</span>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer font-medium"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={handleStartUpload}
                    className="px-6 py-2 text-white rounded-md shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium"
                    style={{ backgroundColor: 'var(--ncku-red)' }}
                  >
                    開始上傳到知識庫
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 步驟 3: 上傳進度 */}
      {currentStep === 3 && uploadProgress && (
        <div className="space-y-6">
          {/* 總體進度 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">上傳進度</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                uploadProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                uploadProgress.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                uploadProgress.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {uploadProgress.status === 'completed' ? '✓ 全部完成' :
                 uploadProgress.status === 'processing' ? '⟳ 處理中...' :
                 uploadProgress.status === 'partial' ? '⚠ 部分失敗' :
                 '等待中'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  已處理 {uploadProgress.processedFiles} / {uploadProgress.totalFiles} 個檔案
                </span>
                <span>{calculateOverallProgress()}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ 
                    width: `${calculateOverallProgress()}%`,
                    backgroundColor: 'var(--ncku-red)'
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>成功: {uploadProgress.successFiles}</span>
                <span>失敗: {uploadProgress.failedFiles}</span>
              </div>
            </div>
          </div>
          
          {/* 檔案詳細進度 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">檔案處理詳情</h3>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {uploadProgress.files.map((file, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center flex-1 min-w-0">
                      {file.status === 'completed' && (
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {file.status === 'processing' && (
                        <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {file.status === 'failed' && (
                        <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {file.status === 'pending' && (
                        <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                      
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </span>
                    </div>
                    
                    <span className="text-xs text-gray-500 ml-4">
                      {file.status === 'completed' ? '完成' :
                       file.status === 'processing' ? `${file.progress}%` :
                       file.status === 'failed' ? '失敗' :
                       '等待中'}
                    </span>
                  </div>
                  
                  {file.status === 'processing' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {file.status === 'failed' && file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 完成提示 - 移除此按鈕，因為會自動進入步驟 4 */}
        </div>
      )}
      
      {/* 步驟 4: 結果摘要 */}
      {currentStep === 4 && uploadProgress && showSummary && (
        <div className="space-y-6">
          {/* 上傳結果摘要卡片 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">上傳結果摘要</h3>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                uploadProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {uploadProgress.status === 'completed' ? '✓ 全部成功' : '⚠ 部分失敗'}
              </span>
            </div>
            
            {/* 統計資訊 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{uploadProgress.successFiles}</div>
                <div className="text-sm text-green-600 mt-1">成功上傳</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-700">{uploadProgress.failedFiles}</div>
                <div className="text-sm text-red-600 mt-1">上傳失敗</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{uploadProgress.deletedFiles || 0}</div>
                <div className="text-sm text-blue-600 mt-1">已刪除舊檔</div>
              </div>
            </div>
            
            {/* 失敗檔案列表 */}
            {uploadProgress.failedFiles > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-red-700 mb-3">失敗檔案列表</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg divide-y divide-red-200">
                  {uploadProgress.files
                    .filter(file => file.status === 'failed')
                    .map((file, index) => (
                      <div key={index} className="px-4 py-3">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-shrink-0 mr-2 scale-50 -ml-2">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            {file.error && (
                              <p className="text-xs text-red-600 mt-1">{file.error}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* 成功檔案列表 */}
            {uploadProgress.successFiles > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-green-700 mb-3">成功上傳檔案</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg divide-y divide-green-200 max-h-64 overflow-y-auto">
                  {uploadProgress.files
                    .filter(file => file.status === 'completed')
                    .map((file, index) => (
                      <div key={index} className="px-4 py-3">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-shrink-0 mr-2 scale-50 -ml-2">
                            {getFileIcon(file.name)}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 操作按鈕 */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => onNavigateToKnowledgeBase && onNavigateToKnowledgeBase()}
              className="px-8 py-3 text-white rounded-md shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium flex items-center gap-2"
              style={{ backgroundColor: 'var(--ncku-red)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              前往知識庫查看
            </button>
            
            <button
              onClick={handleContinueUpload}
              className="px-8 py-3 bg-white border-2 rounded-md shadow-md hover:shadow-lg transition-all cursor-pointer font-medium flex items-center gap-2"
              style={{ borderColor: 'var(--ncku-red)', color: 'var(--ncku-red)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              繼續上傳其他檔案
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default UploadFiles;
