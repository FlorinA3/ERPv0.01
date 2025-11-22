App.UI.Navbar = {
  init() {
    this.render();
  },
  render() {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    const company = (App.Data.Config && App.Data.Config.companyName) || 'MicroOps';
    const user = App.Services.Auth.currentUser;
    const languages = [
      { code: 'en', label: 'English', flag: '🇬🇧' },
      { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
      // Romanian support as required by specification
      { code: 'ro', label: 'Română', flag: '🇷🇴' },
      { code: 'fr', label: 'Français', flag: '🇫🇷' },
      { code: 'es', label: 'Español', flag: '🇪🇸' },
      { code: 'pt', label: 'Português', flag: '🇵🇹' },
      { code: 'zh', label: '中文', flag: '🇨🇳' },
      { code: 'ja', label: '日本語', flag: '🇯🇵' }
    ];
    const themes = [
      { id: 'light', label: 'Corporate', color: '#3b82f6' },
      { id: 'dark', label: 'Dark Mode', color: '#0f172a' },
      { id: 'cyberpunk', label: 'Cyberpunk', color: '#d946ef' },
      { id: 'vaporwave', label: 'Vaporwave', color: '#8b5cf6' },
      { id: 'steampunk', label: 'Steampunk', color: '#b45309' },
      { id: 'scifi', label: 'Sci‑Fi', color: '#0ea5e9' }
    ];
    const currentLang = (App.Data.Config && App.Data.Config.lang) || 'en';
    const currentTheme = (App.Data.Config && App.Data.Config.theme) || 'dark';
    const langInfo = languages.find(l => l.code === currentLang) || languages[0];
    const themeInfo = themes.find(t => t.id === currentTheme) || themes[0];
    root.innerHTML = `
      <div class="navbar">
        <div class="navbar-left">
          <div class="navbar-logo">M</div>
          <div class="navbar-brand">
            <div class="navbar-brand-title">${company}</div>
            <div class="navbar-brand-subtitle">System Overview & Analytics</div>
          </div>
        </div>
        <div class="navbar-right">
          <div class="navbar-user">
            <div class="navbar-user-avatar">${(user && user.name ? user.name.charAt(0) : 'U').toUpperCase()}</div>
            <div class="navbar-user-name">${user ? user.name : 'Not logged in'}</div>
          </div>
          <div class="dropdown" id="lang-dropdown">
            <button class="btn btn-ghost" id="lang-btn" title="Language">${langInfo.flag}</button>
            <div class="dropdown-menu hidden" id="lang-menu">
              ${languages.map(l => `<button class="dropdown-item" data-lang="${l.code}">${l.flag} ${l.label}</button>`).join('')}
            </div>
          </div>
          <div class="dropdown" id="theme-dropdown">
            <button class="btn btn-ghost" id="theme-btn" title="Theme"><span style="color:${themeInfo.color}">●</span></button>
            <div class="dropdown-menu hidden" id="theme-menu">
              ${themes.map(t => `<button class="dropdown-item" data-theme="${t.id}"><span style="color:${t.color}">●</span> ${t.label}</button>`).join('')}
            </div>
          </div>
          <button class="btn btn-ghost" id="navbar-logout-btn" title="Logout">Logout</button>
        </div>
      </div>
    `;
    const logoutBtn = root.querySelector('#navbar-logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        App.Services.Auth.logout();
      };
    }
    const langBtnEl = root.querySelector('#lang-btn');
    const langMenu = root.querySelector('#lang-menu');
    langBtnEl.onclick = () => {
      langMenu.classList.toggle('hidden');
      const themeMenu = root.querySelector('#theme-menu');
      themeMenu.classList.add('hidden');
    };
    langMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.onclick = () => {
        const code = item.getAttribute('data-lang');
        const info = languages.find(l => l.code === code);
        // Persist language to config (both canonical and legacy keys)
        if (App.Data.config) App.Data.config.lang = code;
        if (App.Data.Config) App.Data.Config.lang = code;
        App.I18n.currentLang = code;
        langBtnEl.textContent = info.flag;
        langMenu.classList.add('hidden');
        App.DB.save();
        // Re-render sidebar and current page to reflect new language
        if (App.UI.Sidebar && App.UI.Sidebar.init) App.UI.Sidebar.init();
        App.Core.Router.navigate(App.Core.Router.currentRoute);
        App.UI.Toast.show('Language set to ' + info.label);
      };
    });
    const themeBtnEl = root.querySelector('#theme-btn');
    const themeMenu = root.querySelector('#theme-menu');
    themeBtnEl.onclick = () => {
      themeMenu.classList.toggle('hidden');
      langMenu.classList.add('hidden');
    };
    themeMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.onclick = () => {
        const id = item.getAttribute('data-theme');
        const info = themes.find(t => t.id === id);
        document.documentElement.setAttribute('data-theme', id);
        if (App.Data.config) App.Data.config.theme = id;
        if (App.Data.Config) App.Data.Config.theme = id;
        themeBtnEl.innerHTML = `<span style="color:${info.color}">●</span>`;
        themeMenu.classList.add('hidden');
        App.DB.save();
        App.UI.Toast.show('Theme set to ' + info.label);
      };
    });
  }
};