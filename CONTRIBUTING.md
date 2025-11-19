# 貢獻指南 (Contributing Guide)

感謝您有興趣為 RAG Admin Frontend 做出貢獻！本指南將幫助您了解如何參與專案開發。

---

## 📋 目錄

- [開發環境設定](#開發環境設定)
- [代碼規範](#代碼規範)
- [提交流程](#提交流程)
- [Issue 指南](#issue-指南)
- [Pull Request 指南](#pull-request-指南)

---

## 🛠️ 開發環境設定

### 前置需求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 設定步驟

1. **Fork 專案**

   點擊專案頁面右上角的 "Fork" 按鈕

2. **克隆倉庫**

   ```bash
   git clone https://github.com/YOUR_USERNAME/rag_web_admin.git
   cd rag_web_admin
   ```

3. **安裝依賴**

   ```bash
   npm install
   ```

4. **設定環境變數**

   ```bash
   cp .env.example .env
   ```

5. **啟動開發伺服器**

   ```bash
   npm run dev
   ```

6. **添加上游倉庫**

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/rag_web_admin.git
   ```

---

## 📝 代碼規範

### JavaScript / JSX

- 使用 **ES6+** 語法
- 使用 **函數組件** 和 **Hooks**
- 遵循 **ESLint** 規則

```javascript
// ✅ 推薦
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // 副作用邏輯
  }, []);
  
  return <div>{/* JSX */}</div>;
};

// ❌ 避免
class MyComponent extends React.Component {
  // 類組件
}
```

### 命名規範

- **組件**: PascalCase (`UserManagement.jsx`)
- **函數**: camelCase (`getUserData()`)
- **常量**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **文件**: kebab-case (`user-utils.js`) 或 PascalCase (`UserCard.jsx`)

### 樣式規範

使用 **Tailwind CSS** 工具類:

```jsx
// ✅ 推薦
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  {/* 內容 */}
</div>

// ❌ 避免內聯樣式
<div style={{ display: 'flex', padding: '16px' }}>
  {/* 內容 */}
</div>
```

### 註釋規範

```javascript
/**
 * 獲取使用者列表
 * @param {number} page - 頁碼
 * @param {number} limit - 每頁數量
 * @returns {Promise<Array>} 使用者列表
 */
export const getUsers = async (page, limit) => {
  // 實現邏輯
};
```

---

## 🔄 提交流程

### 1. 創建分支

```bash
# 從 main 分支創建功能分支
git checkout -b feature/your-feature-name

# 或修復 bug
git checkout -b fix/your-bug-fix
```

### 2. 進行修改

- 保持每個 commit 專注於單一目的
- 確保代碼通過 ESLint 檢查

```bash
# 執行代碼檢查
npm run lint
```

### 3. 提交變更

使用清晰的提交訊息:

```bash
git add .
git commit -m "feat: 新增使用者批次刪除功能"
```

### 提交訊息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範:

- `feat:` 新功能
- `fix:` Bug 修復
- `docs:` 文檔更新
- `style:` 代碼格式調整
- `refactor:` 代碼重構
- `test:` 測試相關
- `chore:` 建構或輔助工具變更

範例:
```
feat: 新增使用者匯出功能
fix: 修復檔案上傳進度條顯示錯誤
docs: 更新 README 部署指南
style: 統一按鈕樣式
refactor: 重構 API 請求邏輯
```

### 4. 推送分支

```bash
git push origin feature/your-feature-name
```

---

## 🐛 Issue 指南

### 提交 Bug 報告

使用以下模板:

```markdown
**問題描述**
清楚簡潔地描述問題。

**重現步驟**
1. 進入 '...'
2. 點擊 '...'
3. 滾動到 '...'
4. 看到錯誤

**預期行為**
描述您預期應該發生什麼。

**實際行為**
描述實際發生了什麼。

**螢幕截圖**
如果適用，添加螢幕截圖。

**環境資訊**
- 瀏覽器: [例如 Chrome 120]
- OS: [例如 Windows 11]
- Node 版本: [例如 18.17.0]
```

### 提交功能請求

```markdown
**功能描述**
清楚簡潔地描述您想要的功能。

**使用場景**
描述這個功能將如何使用。

**替代方案**
描述您考慮過的其他解決方案。

**額外資訊**
添加其他相關資訊或螢幕截圖。
```

---

## 🔀 Pull Request 指南

### 提交 PR 前

- ✅ 確保代碼通過 ESLint 檢查
- ✅ 測試所有相關功能正常運作
- ✅ 更新相關文檔
- ✅ 提交訊息符合規範

### PR 模板

```markdown
**變更類型**
- [ ] Bug fix (修復問題)
- [ ] 新功能 (新增功能)
- [ ] 破壞性變更 (會導致現有功能不可用)
- [ ] 文檔更新

**變更描述**
清楚描述這個 PR 做了什麼。

**相關 Issue**
關聯的 Issue: #123

**測試**
描述您如何測試這些變更。

**螢幕截圖**
如果適用，添加螢幕截圖。

**檢查清單**
- [ ] 代碼遵循專案風格指南
- [ ] 已執行自我審查
- [ ] 已添加註釋
- [ ] 已更新文檔
- [ ] 無新增警告
- [ ] 已測試變更
```

### 審查流程

1. **提交 PR**: 推送變更並創建 Pull Request
2. **自動檢查**: 等待 CI/CD 檢查通過
3. **代碼審查**: 維護者會審查您的代碼
4. **修改回饋**: 根據審查意見進行修改
5. **合併**: 通過審查後，PR 將被合併

---

## 🎯 開發建議

### 組件開發

- 保持組件小而專注
- 使用 Props 進行數據傳遞
- 使用 Context 管理全局狀態
- 避免過深的組件嵌套

### API 開發

- 所有 API 調用放在 `src/services/api/` 目錄
- 統一錯誤處理
- 添加適當的 loading 狀態

### 性能優化

- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useCallback` 和 `useMemo` 優化性能
- 考慮代碼分割和懶加載

---

## 🧪 測試 (未來)

```bash
# 執行單元測試
npm run test

# 執行 E2E 測試
npm run test:e2e

# 檢查測試覆蓋率
npm run test:coverage
```

---

## 📚 資源

- [React 官方文檔](https://react.dev/)
- [Vite 官方文檔](https://vitejs.dev/)
- [Tailwind CSS 文檔](https://tailwindcss.com/)
- [專案 README](README.md)

---

## 💬 聯繫方式

如有問題，請：
- 📧 提交 Issue
- 💬 聯繫維護者

---

感謝您的貢獻！🎉
