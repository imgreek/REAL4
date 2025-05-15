// i18n.js - 國際化處理共享腳本

// 初始化頁面的多語言支持
function initializeLanguageSupport() {
  // 讀取當前語言設置
  const currentLang = localStorage.getItem('language') || 'zh';
  
  // 更新頁面標題
  updatePageTitle(currentLang);
  
  // 添加語言切換按鈕
  addLanguageSwitcher(currentLang);
  
  // 應用翻譯
  applyTranslations();
}

// 更新頁面標題
function updatePageTitle(lang) {
  const title = document.title;
  if (lang === 'en') {
    document.title = title.replace('REAL 平台', 'REAL Platform');
  } else {
    document.title = title.replace('REAL Platform', 'REAL 平台');
  }
}

// 添加語言切換按鈕
function addLanguageSwitcher(currentLang) {
  const header = document.querySelector('header');
  if (header && !document.getElementById('languageSwitcher')) {
    const languageSwitcher = document.createElement('button');
    languageSwitcher.id = 'languageSwitcher';
    languageSwitcher.className = 'text-white mr-3';
    languageSwitcher.setAttribute('aria-label', 'Switch Language');
    languageSwitcher.innerHTML = '<i class="fas fa-globe"></i>';
    
    languageSwitcher.addEventListener('click', function() {
      const newLang = currentLang === 'zh' ? 'en' : 'zh';
      switchLanguage(newLang);
    });
    
    // 在頂部欄的合適位置插入按鈕
    const rightControls = header.querySelector('div:last-child') || header;
    if (rightControls !== header) {
      rightControls.prepend(languageSwitcher);
    } else {
      // 如果沒有合適的容器，創建一個新容器
      const container = document.createElement('div');
      container.className = 'flex items-center';
      container.appendChild(languageSwitcher);
      
      // 將現有按鈕（如果有）移動到容器中
      const existingButtons = header.querySelectorAll('button:not(#languageSwitcher)');
      existingButtons.forEach(button => {
        container.appendChild(button.cloneNode(true));
        button.remove();
      });
      
      header.appendChild(container);
    }
  }
}

// 更新底部導航的翻譯
function updateBottomNav(lang) {
  const navItems = {
    'home': { zh: '首頁', en: 'Home' },
    'equipment': { zh: '設備', en: 'Equipment' },
    'learning': { zh: '學習', en: 'Learning' },
    'profile': { zh: '我的', en: 'Profile' }
  };
  
  document.querySelectorAll('.bottom-nav-item span').forEach(span => {
    const key = span.parentElement.getAttribute('href').replace('.html', '');
    if (navItems[key]) {
      span.textContent = navItems[key][lang];
    }
  });
}

// 添加到頁面加載時執行的初始化
document.addEventListener('DOMContentLoaded', initializeLanguageSupport);