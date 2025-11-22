App.UI.Modal = {
  init() {
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();
  },

  open(title, bodyHtml, buttons = []) {
    const backdrop = document.getElementById('modal-backdrop');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    if (!backdrop || !titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = title || 'Details';
    bodyEl.innerHTML = bodyHtml || '';

    footerEl.innerHTML = '';
    if (buttons.length === 0) {
      buttons = [{ text: 'Close', variant: 'ghost', onClick: () => {} }];
    }

    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.className = 'btn ' + (btn.variant === 'primary' ? 'btn-primary' : 'btn-ghost');
      b.textContent = btn.text;
      b.onclick = () => {
        const res = btn.onClick && btn.onClick();
        if (res !== false) this.close();
      };
      footerEl.appendChild(b);
    });

    backdrop.classList.remove('hidden');
  },

  close() {
    const backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.add('hidden');
  }
};



App.UI.Toast = {
  show(message, timeout = 2500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 300);
    }, timeout);
  }
};
