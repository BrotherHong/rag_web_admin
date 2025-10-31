/**
 * Department Stats Modal Component
 * 處室統計彈窗組件 - 顯示處室的詳細統計資料
 */

import { useModalAnimation } from '../../hooks/useModalAnimation';

function DepartmentStatsModal({ department, statsData, onClose, isOpen = true }) {
  const modal = useModalAnimation(isOpen, onClose);

  if (!modal.shouldRender) return null;

  // 根據活動類型獲取配置
  const getActivityConfig = (activity) => {
    const type = activity.type;
    switch(type) {
      case 'upload':
        return {
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          ),
          label: '上傳檔案',
          name: activity.fileName
        };
      case 'delete':
        return {
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          ),
          label: '刪除檔案',
          name: activity.fileName
        };
      case 'category_add':
        return {
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          ),
          label: '新增分類',
          name: activity.categoryName
        };
      case 'category_delete':
        return {
          bgColor: 'bg-orange-100',
          iconColor: 'text-orange-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          ),
          label: '刪除分類',
          name: activity.categoryName
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          ),
          label: '其他操作',
          name: activity.fileName || activity.categoryName || '未知'
        };
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 ${modal.animationClass}`}>
      <div className={`bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto ${modal.contentAnimationClass}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold" style={{ color: 'var(--ncku-red)' }}>
            {department.name} - 統計資料
          </h3>
          <button
            onClick={modal.handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
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
            {Object.keys(statsData.filesByCategory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(statsData.filesByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-semibold text-gray-900">{count} 個檔案</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暫無分類資料</p>
            )}
          </div>

          {/* 最近活動 */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-900">最近活動</h4>
            {statsData.recentActivities && statsData.recentActivities.length > 0 ? (
              <div className="space-y-2">
                {statsData.recentActivities.map((activity, index) => {
                  const config = getActivityConfig(activity);

                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                        <svg className={`w-4 h-4 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {config.icon}
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {config.label} - {config.name}
                        </p>
                        <p className="text-xs text-gray-500">{activity.user}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暫無活動記錄</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentStatsModal;
