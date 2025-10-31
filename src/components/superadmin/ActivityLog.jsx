/**
 * Activity Log Component
 * 活動記錄組件 - 顯示系統操作記錄和處室篩選
 */

function ActivityLog({ 
  activities, 
  departments, 
  selectedDepartment, 
  onDepartmentChange 
}) {
  // 獲取活動類型的配置（圖標、顏色、文字）
  const getActivityConfig = (type) => {
    const configs = {
      upload: {
        bgColor: '#dcfce7',
        iconColor: '#16a34a',
        label: '新增檔案',
        icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
      },
      delete: {
        bgColor: '#fee2e2',
        iconColor: '#dc2626',
        label: '刪除檔案',
        icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
      },
      category_add: {
        bgColor: '#dbeafe',
        iconColor: '#2563eb',
        label: '新增分類',
        icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
      },
      category_delete: {
        bgColor: '#dbeafe',
        iconColor: '#2563eb',
        label: '刪除分類',
        icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
      },
      department_add: {
        bgColor: '#fef3c7',
        iconColor: '#ca8a04',
        label: '新增處室',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      },
      department_update: {
        bgColor: '#e0e7ff',
        iconColor: '#4f46e5',
        label: '更新處室',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      },
      department_delete: {
        bgColor: '#fee2e2',
        iconColor: '#dc2626',
        label: '刪除處室',
        icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
      },
      user_add: {
        bgColor: '#d1fae5',
        iconColor: '#059669',
        label: '新增使用者',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      user_update: {
        bgColor: '#ddd6fe',
        iconColor: '#7c3aed',
        label: '更新使用者',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      user_delete: {
        bgColor: '#fee2e2',
        iconColor: '#dc2626',
        label: '刪除使用者',
        icon: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6'
      }
    };

    return configs[type] || {
      bgColor: '#f3f4f6',
      iconColor: '#6b7280',
      label: '系統操作',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
  };

  // 獲取處室顏色樣式
  const getDepartmentStyle = (color) => {
    const colorMap = {
      blue: { bg: '#dbeafe', text: '#1e40af' },
      green: { bg: '#dcfce7', text: '#15803d' },
      red: { bg: '#fee2e2', text: '#991b1b' },
      yellow: { bg: '#fef3c7', text: '#a16207' },
      purple: { bg: '#e9d5ff', text: '#7e22ce' },
      pink: { bg: '#fce7f3', text: '#be185d' },
      indigo: { bg: '#e0e7ff', text: '#4f46e5' },
      orange: { bg: '#ffedd5', text: '#c2410c' }
    };

    return colorMap[color] || { bg: '#f3f4f6', text: '#374151' };
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
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
            onChange={(e) => onDepartmentChange(e.target.value)}
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
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => {
              const dept = departments.find(d => d.id === activity.departmentId);
              const config = getActivityConfig(activity.type);
              const deptStyle = dept ? getDepartmentStyle(dept.color) : null;

              return (
                <div key={activity.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* 活動類型圖示 */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <svg 
                          className="w-6 h-6" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: config.iconColor }}
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={config.icon}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* 活動詳情 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-base">
                          {config.label}
                        </span>
                        {dept && (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: deptStyle.bg,
                              color: deptStyle.text
                            }}
                          >
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
  );
}

export default ActivityLog;
