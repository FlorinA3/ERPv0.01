App.UI.Views.Settings = {
  render(root) {
    const cfg = App.Data.Config || {};
    const users = App.Data.Users || [];
    // No export block here - removed as per instructions
    root.innerHTML = `
      <div class="grid grid-2">
        <div class="card-soft">
          <h3 style="font-size:16px; font-weight:600; margin-bottom:8px;">${App.I18n.t('settings.userSection', 'User Management')}</h3>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${users.map(u => `
              <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--color-border); border-radius:8px; padding:8px;">
                <span>${u.name}</span>
                <span style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${u.role}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="card-soft">
          <h3 style="font-size:16px; font-weight:600; margin-bottom:8px;">${App.I18n.t('settings.companySection', 'Company Configuration')}</h3>
          <div class="grid" style="gap:8px;">
            <label class="field-label">${App.I18n.t('settings.companyName', 'Company Name')}</label>
            <input id="set-company" class="input" value="${cfg.companyName || ''}" />
            
            <label class="field-label">${App.I18n.t('settings.address', 'Address')}</label>
            <input id="set-address" class="input" value="${cfg.address || ''}" />
            
            <div class="grid grid-2" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.phone', 'Phone')}</label>
                <input id="set-phone" class="input" value="${cfg.phone || ''}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.email', 'Email')}</label>
                <input id="set-email" class="input" value="${cfg.email || ''}" />
              </div>
            </div>

            <div class="grid grid-2" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.vat', 'VAT ID')}</label>
                <input id="set-vat" class="input" value="${cfg.vatNumber || ''}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.reg', 'Register No')}</label>
                <input id="set-reg" class="input" value="${cfg.commercialRegisterNumber || ''}" />
              </div>
            </div>

            <label class="field-label">${App.I18n.t('settings.bank', 'Bank Name')}</label>
            <input id="set-bank" class="input" value="${cfg.bankName || ''}" />

            <div class="grid grid-2" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.iban', 'IBAN')}</label>
                <input id="set-iban" class="input" value="${cfg.iban || ''}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.bic', 'BIC')}</label>
                <input id="set-bic" class="input" value="${cfg.bic || ''}" />
              </div>
            </div>

            <label class="field-label">${App.I18n.t('settings.payTerms', 'Payment Terms')}</label>
            <input id="set-payterms" class="input" value="${cfg.defaultPaymentTerms || ''}" />

            <label class="field-label">${App.I18n.t('settings.delTerms', 'Delivery Terms')}</label>
            <input id="set-delterms" class="input" value="${cfg.defaultDeliveryTerms || ''}" />

            <div class="grid grid-3" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.vatRate', 'VAT Rate')}</label>
                <input id="set-vatrate" type="number" step="0.01" class="input" value="${cfg.defaultVatRate != null ? cfg.defaultVatRate : 0.2}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.currency', 'Currency')}</label>
                <input id="set-currency" class="input" value="${cfg.currency || 'EUR'}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.lang', 'Language')}</label>
                <input id="set-lang" class="input" value="${cfg.lang || 'en'}" disabled />
              </div>
            </div>
          </div>
          <button class="btn btn-primary mt-16" id="btn-save-config">${App.I18n.t('settings.save', 'Save Settings')}</button>
        </div>
      </div>
    `;
    
    document.getElementById('btn-save-config').onclick = () => {
      cfg.companyName = document.getElementById('set-company').value.trim();
      cfg.address = document.getElementById('set-address').value.trim();
      cfg.phone = document.getElementById('set-phone').value.trim();
      cfg.email = document.getElementById('set-email').value.trim();
      cfg.vatNumber = document.getElementById('set-vat').value.trim();
      cfg.commercialRegisterNumber = document.getElementById('set-reg').value.trim();
      cfg.bankName = document.getElementById('set-bank').value.trim();
      cfg.iban = document.getElementById('set-iban').value.trim();
      cfg.bic = document.getElementById('set-bic').value.trim();
      cfg.defaultPaymentTerms = document.getElementById('set-payterms').value.trim();
      cfg.defaultDeliveryTerms = document.getElementById('set-delterms').value.trim();
      cfg.defaultVatRate = parseFloat(document.getElementById('set-vatrate').value);
      cfg.currency = document.getElementById('set-currency').value.trim() || 'EUR';
      
      App.Data.Config = cfg;
      App.DB.save();
      App.UI.Toast.show(App.I18n.t('settings.saved', 'Settings saved'));
      App.UI.Navbar.render();
    };
  }
};