# REAL平台產品需求文檔 (PRD)  

## 1. 文檔資訊  

| 文檔資訊 | 詳情 |  
|----------|------|  
| 項目名稱 | REAL (Renting Equipment and AI Learning assistant) |  
| 作者 | CHOW MING HON |  
| 版本 | 1.1 |  
| 最後更新日期 | 2025年5月 |  
| 狀態 | 草稿 |  

## 2. 修訂歷史  

| 版本 | 日期 | 描述 | 作者 |  
|------|------|------|------|  
| 0.1 | 2025-03-31 | 初始草稿 | CHOW MING HON |  
| 1.0 | 2025-04 | 完整PRD | CHOW MING HON |  

## 3. 項目概述  

### 3.1 目標  
開發一個AI驅動的設備管理平台，專為中學生媒體製作項目設計，整合租借物流、項目特定設備推薦和互動教程，幫助學生有效計劃、獲取和利用技術資源。  

### 3.2 背景  
中學生在進行媒體項目時常面臨設備選擇和使用的挑戰。現有系統缺乏智能推薦和積分制管理，導致資源使用效率低下。REAL平台旨在通過AI助手和積分制度優化設備管理流程。  

### 3.3 用戶群體  
- 主要用戶：進行媒體項目製作的中學生
- 次要用戶：學校管理員、教師  

### 3.4 核心價值主張  
- 智能化設備推薦，減少學生選擇困難  
- 積分制度鼓勵負責任的設備使用  
- 即時可用性顯示，優化資源分配  
- AI輔助學習，提升技術能力  

## 4. 功能需求  

### 4.1 必要功能  

| 需求ID | 功能名稱 | 描述 | 優先級 |  
|--------|----------|------|--------|  
| F-001 | 使用者認證 | 從登入頁面獲取用戶資訊，保存會話狀態 | 高 |  
| F-002 | 設備數據庫管理 | 連接現有CSV數據庫(/assets/database/ctv_Equipment_250405.csv)，建立即時性的庫存管理系統 | 高 |  
| F-003 | 設備瀏覽與搜索 | 允許用戶按類別(Band、Item Type)瀏覽設備，提供搜索和篩選功能 | 高 |  
| F-004 | 積分制借用系統 | 實現積分計算邏輯，顯示用戶積分和設備所需積分 | 高 |  
| F-005 | 預訂系統與日曆 | 開發設備可用性日曆視圖，提供借用期限選擇器，處理預訂衝突 | 高 |  
| F-006 | AI助手整合 | 在首頁添加AI助手入口，提供基於項目需求的設備推薦 | 高 |  
| F-007 | 用戶借用記錄 | 追蹤和顯示用戶的設備借用歷史 | 中 |  
| F-008 | 設備使用教學 | AI提供設備使用教學建議和最佳實踐 | 中 |  
| F-009 | 學習聊天室 | 讓用戶之間可以共同交流，並在需要時呼叫AI加入對話 | 高 |  
| F-011 | 學習系統 | 讓用戶通過學習器材相關知識獲得積分及等級 | 高 | 
| F-012 | 多語言支持 | 提供繁體中文及英語介面 | 中 | 
| F-013 | QR Code 掃描 | 連接現有CSV數據庫(/assets/database/ctv_Equipment_250405.csv) QR Code，提供用戶手上的器材的資訊 | 中 | 
## 5. 非功能需求  

### 5.1 性能需求  
- 系統必須支持即時更新，確保多用戶環境下的數據一致性  
- CSV文件讀寫操作必須高效且不影響用戶體驗  
- 系統響應時間應在2秒內  

### 5.2 UI設計介面需求 
- 調色盤
- 主要：教育藍 (#1A73E8) - 背景底色
- 次要：活力橙色（#FF5722）- 模組方塊顏色
- 中性色：乾淨的白色和柔和的灰色，方便閱讀
- 重點：薄荷綠（#00BFA5）用於指示可用性
- 所有介面文字及互動均使用繁體中文及英語介面
- 界面必須簡潔易用，適合中學生在平板設備上操作  
- 系統應提供響應式設計，確保在各種尺寸的平板設備上正常顯示  

- 各頁面統一
- QR code Scanner在右上頂部欄進行快捷器材掃描獲取器材基本資訊
- RIO AI助手頁面應可以在頁面向右拉動拉出
- 聊天室頁面會在右上角顯示按鈕/向左拉動拉出(參考Instagram)
- 其餘主頁面在底部欄按鈕 (HOME(基礎資料),Equipment(預訂系統),Learn(學習系統),Profile(個人檔案))

### 5.3 安全需求  
- 用戶數據需安全存儲  
- 系統應實現基本的權限控制，防止未授權訪問  

### 5.4 可用性需求  
- 系統應易於學習和使用，無需專業培訓  
- 界面應遵循直覺性設計原則  

## 6. 技術架構  

### 6.1 技術堆棧  
- 前端架構：採用Tailwind CSS實現快速UI原型設計
- 數據存儲：CSV文件，以及可能的本地存儲 
- API層設計模式
REST API：設備借用和用戶管理等基礎功能
GraphQL：AI輔助學習等需要靈活查詢的功能
WebSocket：即時通知和協作功能
採用"微單體"(Micro-Monolith)設計——保持代碼庫統一但內部模塊化，在功能增長時便於拆分。
- AI整合：與雲端AI助手API連接
AI與教學內容集成架構：設計標準化的知識封裝格式，使AI能輕鬆訪問和推薦設備使用教程：

json
{  
  "equipment_id": "canon_r7",  
  "tutorials": [  
    {  
      "level": "beginner",  
      "content_path": "/tutorials/canon_r7/basic.md",  
      "prerequisites": [],  
      "estimated_time": 15  
    }  
  ]  
}  
第三方服務整合策略：設計統一的服務集成層，處理與Google服務、學校現有系統的連接：

身份驗證：與學校現有身份系統集成
插件系統設計：考慮設計輕量級插件架構，使教師和技術人員可以擴展平台功能，如添加新設備類型或自定義評估標準。

## 7. 用戶流程  
### 7.1 系統登入流程  
1. 用戶登入系統
2. 顯示現有相關預約及聊天對話基本資訊
3. 顯示現有相關積分
4. 顯示正在學習課程 

### 7.2 設備借用流程  
1. 用戶瀏覽日曆/搜索可用設備
2. 用戶選擇日期查看可用器材清單/設備並查看預約可用性 
3. 系統顯示所需積分  
4. 系統確認預訂並扣除積分  
5. 系統更新設備狀態並記錄借用信息  

### 7.3 AI助手流程 (參考Sider)
1. 用戶點擊首頁AI助手入口  
2. AI助手詢問用戶的項目需求  
3. 用戶描述項目類型、難度和經驗  
4. AI助手推薦適合的設備組合  
5. 用戶可選擇直接預訂推薦設備  
6. 提供語音輸入按鈕

### 7.4 學生間即時通訊系統(參考Instagram)

1. 支援一對一和群組聊天功能
允許分享圖片、影片和文檔
針對特定設備或項目建立專題討論組

2. 專案協作空間：
團隊成員間共享進度和資源
任務分配和追蹤功能
集成項目時間表和截止日期提醒

3. AI輔助溝通：
AI可協助總結長對話內容
自動標記和組織重要信息
提供專業術語解釋

4. 教師-學生溝通渠道：
特定頻道用於教師指導和反饋
預約諮詢功能
設備使用問題快速響應機制
學習系統功能建議

### 7.5 設備使用學習模塊(參考Duolingo)

1. 按難度分級的設備操作教程
互動式教學視頻
設備操作練習和測驗 

2. 媒體製作知識庫：
常見媒體製作技術和理論
範例作品庫
實用技巧和最佳實踐
允許同學自行製作知識庫分享

3. 個人化學習路徑：
基於學生項目需求推薦學習內容
進度追蹤和技能評估
根據使用歷史提供個性化推薦

4. 協作學習功能：

同伴評審系統
作品展示和討論空間
小組學習挑戰

5. 成就和技能認證系統：

設備使用熟練度徽章
完成特定學習路徑的認證
與積分系統整合的技能獎勵機制

## 8. 數據模型  

### 8.1 設備數據模型  
擴展現有CSV數據，包含以下欄位：  
- Item Name  
- Band  
- Item Category
- Item Category Code  
- Band Code  
- Item Code  
- Item QR Code (每項物件上的QR code)  
- Ownership  
- Status for rent  
- item Status  
- 每日所需積分 
- A使用難度等級，1-5級
- 最大可借用數量（新增）  
- 推薦使用場景（新增）  

### 8.2 用戶數據模型  
- 用戶ID  
- 用戶名  
- 積分餘額  
- 借用歷史  

### 8.3 借用記錄模型  
- 借用ID  
- 用戶ID  
- 設備ID  
- 借用日期  
- 歸還日期  
- 消耗積分  
- 狀態（待取、已借、已還、逾期）  
- 
### 8.4 AI API模型
- 用現有免費AI API接口建立RIO AI虛擬助手 
AI Sprompt
|**You are RIO AI**, a helpful and professional expert in video/audio equipment and projects. 

Your goal is to help students (ages 12–17) solve problems, understand how to use gear for video/media creation effectively, and learn in an easy-to-follow process. Always provide your answers with step-by-step instructions and examples to ensure full comprehension. Include both Chinese and English, as needed, for bilingual support. Respond concisely to focus on practical solutions.

---

## Prompt Instructions: 

### **Structure your responses as follows**:
1. **Quick Summary**:
   - Start with a brief overview of the solution in simplified terms.

2. **Step-by-Step Guide**:
   - Break down the steps students should take clearly. 
   - Number the steps (1., 2., 3., etc.), providing a single focused action or instruction per step.

3. **Examples and Tips**:
   - Include relevant real-world examples, illustrative use cases, or scenarios for better understanding.
   - Highlight common mistakes they need to avoid.

4. **Additional Resources**:
   - Attach relevant tutorial links, images, or documentation from the database, making sure they are fit for beginner-level understanding.
   - If students are struggling with technical language, suggest translations or key terms (English/Chinese) that can help.

5. **Follow-Up and Engagement**:
   - Encourage students to ask clarifying questions or provide feedback based on progress.

---

## Example Scenarios: How You Should Respond

### Example 1: "How to shoot clear video at night?"
1. **Quick Summary**: 
   - Shooting clear videos at night requires optimizing the use of light, camera settings, and stability.
   - 拍攝清晰的夜景影片需要優化使用光源、相機設定及穩定性。

2. **Step-by-step Guide**: 
   1. Check your camera's ISO settings. Increase ISO to allow the camera to capture more light, but not too high to avoid image noise.
      - 檢查相機的ISO設定，適當提高ISO捕捉光線，但避免提高過多導致畫面噪點。
   2. Use a tripod or stabilize the camera to prevent shakiness, especially in low-light situations.
      - 使用三腳架或穩定相機，避免因低光情況拍攝時出現晃動。
   3. Adjust the shutter speed to be slower, but not so slow that the subject becomes blurred.
      - 可適度調整快門速度，要確保畫面主體不會因曝光過久而模糊。
   4. Add extra lighting sources, like LED lights or reflective surfaces, to brighten the scene.
      - 增加額外光源，例如LED燈或反射表來提升環境光線。

3. **Examples and Tips**:
   - If the scene still looks dark, try filming at dusk or look for areas where there is already some light (e.g., streetlights).
   - 如果拍攝場景過黑，可嘗試在黃昏時拍攝，或選擇帶有街燈的環境。

4. **Additional Resources**:
   - Watch this video tutorial: [Link]
   - 查看這份教學: [鏈接]

---

### Example 2: "What should I do if the microphone has no sound?"
1. **Quick Summary**:
   - Common microphone problems often involve loose connections, muted settings, or software issues.
   - 常見的麥克風問題包括接頭鬆動、靜音設定或軟件相關問題。

2. **Step-by-step Guide**:
   1. Ensure the microphone is properly plugged into the input jack or USB port.
   2. Check if the mute button, both on the microphone and in the device settings, is turned off.
   3. Open the sound settings on your device and confirm the correct microphone is selected.
   4. Test the microphone on another device to check for hardware malfunctions.

3. **Examples and Tips**:
   - Tip: Always secure cables to avoid accidental disconnection. 
   - 當心線材鬆脫，建議綁好避免中斷錄音。

4. **Follow-up Engagement**:
   - "Does this help solve the issue? Let me know if the issue persists!"

---

In summary, prioritize accessibility, engagement, and clarity in your answers. Always think about what a student needs to accomplish their media task step by step.|

[openrouter.ai/](https://openrouter.ai/)
Model: microsoft/mai-ds-r1:free
API key: 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

### 8.5 Google 服務 MCP模型
將借用情況同步到Google Calendar 方便管理者查看預約,並可通過電郵 ewuntv@gmail.com 提醒借用人歸還器材
Calendar ID
feeaab25f3f8d972fb85676aa1692f6a14c4c64a748ff909260dfb7a698a1d01@group.calendar.google.com

## 9. 界面設計  

### 9.1 主要頁面  
- 首頁：包含AI助手入口和設備分類瀏覽  
- 設備列表頁：顯示設備分類和篩選選項  
- 設備詳情頁：展示詳細信息和可用性  
- 預訂頁面：日曆視圖和時間選擇  
- 用戶資料頁：顯示積分和借用歷史  

### 9.2 設計原則  
- 簡潔直觀：減少複雜操作，直觀顯示信息  
- 響應式設計：適應不同設備尺寸  
- 清晰標識：設備狀態和可用性一目了然  

### 9.3 調色盤
- 主要：教育藍 (#1A73E8) - 值得信賴，專注
- 次要：活力橙色（#FF5722）- 創意、活力
- 中性色：乾淨的白色和柔和的灰色，方便閱讀
- 重點：薄荷綠（#00BFA5）用於指示可用性

## 10. 測試計劃  

### 10.1 功能測試  
- 設備數據庫CRUD操作  
- 積分計算和扣除  
- 預訂和衝突處理  
- AI推薦功能  

### 10.2 用戶體驗測試  
- 中學生用戶測試  
- 任務完成時間衡量  
- 滿意度調查  


## 11. 附錄  

### 11.1 詞彙表  
- REAL: Renting Equipment and AI Learning assistant  


### 11.2 參考文檔  
- assets/database/ctv_Equipment_250405.csv: 現有器材清單  
- assets/database/points.html: 積分制度參考文件  
- assets/database/courses.csv : 學習例子
- assets/database/users.csv 現有用戶例子
- assets/database/earning_progress.csv 學習進度例子(其中的頁面亦可按現實資料產生,頁面例子 assets/ref/Canon_R7_Basic_Video_shooting.html)
- rental_history.csv 現在用戶已借用器材參考文件
---  

本PRD將作為REAL平台開發的指導文檔，詳細規定了產品要求、功能特性和開發計劃。隨著項目進展，本文檔可能會進一步更新和完善。