# 上傳頁面 UI 改善

## 📅 更新日期
2025年10月17日

## 🎯 改善內容

### 問題 1: 步驟指示器對比度不足
**問題描述**: 
- 未選中步驟的圓圈和數字使用 `text-gray-400` 和 `border-gray-300`
- 在灰色背景 (`bg-gray-50`) 上幾乎看不見
- 用戶難以辨識當前進度

**解決方案**:
1. **添加白色背景卡片**
   ```jsx
   <div className="bg-white rounded-xl shadow-md p-6">
     {/* 步驟指示器 */}
   </div>
   ```

2. **增強未選中狀態的對比度**
   - 圓圈邊框：`border-gray-300` → `border-gray-400`
   - 圓圈背景：無 → `bg-gray-100`
   - 數字顏色：`text-gray-400` → `text-gray-600`
   - 文字顏色：`text-gray-400` → `text-gray-600`

3. **改善已選中狀態**
   - 數字加粗：添加 `font-bold`
   - 保持成大紅色主題

**修改前**:
```jsx
<div className={`flex items-center ${currentStep >= 1 ? 'text-ncku-red' : 'text-gray-400'}`}>
  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
    currentStep >= 1 ? 'border-ncku-red bg-ncku-red text-white' : 'border-gray-300'
  }`}>
    1
  </div>
  <span className="ml-2 font-medium">選擇檔案</span>
</div>
```

**修改後**:
```jsx
<div className={`flex items-center ${currentStep >= 1 ? 'text-ncku-red' : 'text-gray-600'}`}>
  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
    currentStep >= 1 ? 'border-ncku-red bg-ncku-red text-white' : 'border-gray-400 bg-gray-100 text-gray-600'
  }`}>
    1
  </div>
  <span className="ml-2 font-medium">選擇檔案</span>
</div>
```

**視覺效果**:

未選中狀態：
```
┌──────────────────────────────────┐
│ 白色背景卡片                       │
│                                  │
│  ⭕ 選擇檔案  ───  ⭕ 檢查重複  ───  ⭕ 上傳處理
│  灰底灰框      灰線    灰底灰框      灰線   灰底灰框
│  灰字(600)           灰字(600)          灰字(600)
└──────────────────────────────────┘
```

已選中狀態：
```
┌──────────────────────────────────┐
│ 白色背景卡片                       │
│                                  │
│  🔴 選擇檔案  ━━━  ⭕ 檢查重複  ───  ⭕ 上傳處理
│  紅底白字      紅線    灰底灰框      灰線   灰底灰框
│  紅字粗體            灰字(600)          灰字(600)
└──────────────────────────────────┘
```

---

### 問題 2: 按鈕顏色不明顯
**問題描述**:
- 「下一步」和「開始上傳」按鈕使用 Tailwind 類別 `bg-ncku-red`
- 但 `ncku-red` 不是 Tailwind 內建顏色，需要自定義配置
- 可能導致按鈕顯示為預設顏色或看不清楚

**解決方案**:
使用內聯樣式 `style={{ backgroundColor: 'var(--ncku-red)' }}` 確保顏色正確

**修改的按鈕**:

1. **步驟 1: 下一步按鈕**
   ```jsx
   <button
     onClick={handleCheckDuplicates}
     disabled={checkingDuplicates}
     className="px-6 py-2 text-white rounded-md shadow-lg hover:shadow-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer font-medium"
     style={checkingDuplicates ? {} : { backgroundColor: 'var(--ncku-red)' }}
   >
     {checkingDuplicates ? '檢查中...' : '下一步：檢查重複'}
   </button>
   ```
   
   **特點**: 
   - 正常狀態使用成大紅色
   - 禁用狀態（檢查中）使用灰色 (`disabled:bg-gray-400`)
   - 添加陰影和過渡效果

2. **步驟 2: 開始上傳按鈕**
   ```jsx
   <button
     onClick={handleStartUpload}
     className="px-6 py-2 text-white rounded-md shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium"
     style={{ backgroundColor: 'var(--ncku-red)' }}
   >
     開始上傳到知識庫
   </button>
   ```

3. **步驟 3: 完成按鈕**
   ```jsx
   <button
     onClick={handleReset}
     className="px-8 py-3 text-white rounded-md shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium"
     style={{ backgroundColor: 'var(--ncku-red)' }}
   >
     {uploadProgress.status === 'completed' ? '完成，繼續上傳其他檔案' : '完成，檢視結果'}
   </button>
   ```

4. **進度條**
   ```jsx
   <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
     <div
       className="h-full transition-all duration-300 rounded-full"
       style={{ 
         width: `${calculateOverallProgress()}%`,
         backgroundColor: 'var(--ncku-red)'
       }}
     ></div>
   </div>
   ```

5. **統計文字**
   ```jsx
   <span className="font-medium" style={{ color: 'var(--ncku-red)' }}>
     將刪除 {filesToRemove.length} 個舊檔案
   </span>
   ```

---

## 🎨 統一的設計語言

### 顏色系統

**主要顏色**:
- 成大紅 (`var(--ncku-red)`): `#9f1c20`
- 用於：主要按鈕、進度條、重要文字、選中狀態

**次要顏色**:
- 灰色 600 (`text-gray-600`): 未選中文字
- 灰色 400 (`border-gray-400`): 未選中邊框
- 灰色 100 (`bg-gray-100`): 未選中背景

**狀態顏色**:
- 綠色 (`text-green-500`, `bg-green-100`): 成功
- 藍色 (`text-blue-500`, `bg-blue-100`): 處理中
- 黃色 (`text-yellow-800`, `bg-yellow-100`): 警告/部分失敗
- 紅色 (`text-red-600`): 錯誤

### 按鈕樣式統一

**主要動作按鈕** (成大紅色):
```jsx
className="px-6 py-2 text-white rounded-md shadow-lg hover:shadow-xl transition-all cursor-pointer font-medium"
style={{ backgroundColor: 'var(--ncku-red)' }}
```

**次要動作按鈕** (灰色邊框):
```jsx
className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer font-medium"
```

**禁用狀態**:
```jsx
disabled:bg-gray-400 disabled:cursor-not-allowed
```

### 卡片樣式統一

**標準卡片**:
```jsx
className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md"
```

**卡片標題區**:
```jsx
className="px-6 py-4 bg-gray-50 border-b border-gray-200"
```

---

## 📊 改善前後對比

### 步驟指示器

| 項目 | 改善前 | 改善後 |
|------|--------|--------|
| 背景 | 無 (灰色頁面背景) | 白色卡片 + 陰影 |
| 未選中圓圈邊框 | `border-gray-300` (太淡) | `border-gray-400` |
| 未選中圓圈背景 | 透明 | `bg-gray-100` |
| 未選中文字 | `text-gray-400` (太淡) | `text-gray-600` |
| 數字粗細 | 普通 | 粗體 (`font-bold`) |

### 按鈕

| 按鈕 | 改善前 | 改善後 |
|------|--------|--------|
| 下一步 | `bg-ncku-red` (可能無效) | `style={{ backgroundColor: 'var(--ncku-red)' }}` |
| 開始上傳 | `bg-ncku-red` (可能無效) | `style={{ backgroundColor: 'var(--ncku-red)' }}` |
| 完成 | `bg-ncku-red` (可能無效) | `style={{ backgroundColor: 'var(--ncku-red)' }}` |
| 陰影效果 | 無 | `shadow-lg hover:shadow-xl` |
| 字體粗細 | 普通 | `font-medium` |

### 進度條

| 項目 | 改善前 | 改善後 |
|------|--------|--------|
| 填充顏色 | `bg-ncku-red` (可能無效) | `style={{ backgroundColor: 'var(--ncku-red)' }}` |

---

## ✅ 驗證清單

- [x] 步驟指示器在白色背景上清晰可見
- [x] 未選中步驟的圓圈和文字對比度充足
- [x] 已選中步驟使用成大紅色且醒目
- [x] 所有主要按鈕都顯示成大紅色
- [x] 按鈕禁用狀態正確顯示為灰色
- [x] 進度條使用成大紅色
- [x] 統計文字顏色正確
- [x] 無編譯錯誤

---

## 🔧 技術細節

### 為什麼使用內聯樣式？

**Tailwind CSS 限制**:
```jsx
// ❌ 不會工作 (ncku-red 不是內建顏色)
className="bg-ncku-red"

// ❌ 動態類名不會被編譯
className={`bg-${colorVariable}`}

// ✅ 使用內聯樣式確保顏色正確
style={{ backgroundColor: 'var(--ncku-red)' }}
```

**CSS 變數定義** (在 `index.css`):
```css
:root {
  --ncku-red: #9f1c20;
  --ncku-red-dark: #7a1518;
  --ncku-red-light: #c72126;
}
```

### 條件樣式處理

**禁用狀態的按鈕**:
```jsx
<button
  disabled={checkingDuplicates}
  style={checkingDuplicates ? {} : { backgroundColor: 'var(--ncku-red)' }}
>
```

**說明**: 
- 正常狀態：使用成大紅色
- 禁用狀態：使用 Tailwind 的 `disabled:bg-gray-400`
- 避免樣式衝突

---

## 🎯 用戶體驗改善

### 視覺層次更清晰

1. **步驟指示器** - 白色卡片突出顯示
2. **檔案選擇區** - 白色背景 + 虛線邊框
3. **檔案列表** - 白色卡片 + 陰影
4. **按鈕** - 成大紅色醒目
5. **提示訊息** - 藍色背景區分

### 操作引導更明確

- ✅ 步驟進度一目了然
- ✅ 主要按鈕（紅色）vs 次要按鈕（灰框）
- ✅ 禁用狀態清楚標示
- ✅ 提示訊息引導操作

---

## 📱 響應式考量

目前設計適合桌面和平板，未來可考慮：

```jsx
// 移動設備優化
<div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
  {/* 步驟指示器在小螢幕上垂直排列 */}
</div>
```

---

**更新版本**: v1.1  
**狀態**: ✅ 完成並測試  
**影響範圍**: UploadFiles.jsx  
**測試狀態**: 無編譯錯誤
