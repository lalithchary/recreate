/**
 * admin.js — Admin Panel Logic
 */
(function () {
  'use strict';

  // Password is stored separately — not exposed in README
  const ADMIN_PASSWORD = 'Oggy@123';
  const SESSION_KEY = 'pg_admin_ok';

  function init() {
    checkSession();
    bindLogin();
    bindPanel();
    bindNav();
  }

  // ── Session ────────────────────────────────────────────────────────────────
  function checkSession() {
    if (sessionStorage.getItem(SESSION_KEY) === '1') showPanel();
  }
  function showPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'flex';
    refreshStats();
    renderManage();
  }
  function hidePanel() {
    sessionStorage.removeItem(SESSION_KEY);
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminLayout').style.display = 'none';
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  function bindLogin() {
    document.getElementById('loginBtn')?.addEventListener('click', tryLogin);
    document.getElementById('passwordInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') tryLogin();
    });
    // Show / hide password
    document.getElementById('toggleEye')?.addEventListener('click', () => {
      const inp = document.getElementById('passwordInput');
      const icon = document.querySelector('#toggleEye i');
      if (inp.type === 'password') {
        inp.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
      } else {
        inp.type = 'password';
        icon.className = 'fa-solid fa-eye';
      }
    });
  }
  function tryLogin() {
    const val = document.getElementById('passwordInput')?.value || '';
    const wrap = document.getElementById('loginFieldWrap');
    if (val === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      showPanel();
    } else {
      wrap?.classList.add('error');
      showToast('Incorrect password', 'err');
      setTimeout(() => wrap?.classList.remove('error'), 1600);
    }
  }

  // ── Sidebar Navigation ─────────────────────────────────────────────────────
  function bindNav() {
    document.querySelectorAll('.aside-link[data-panel]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const p = link.dataset.panel;
        document.querySelectorAll('.aside-link[data-panel]').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.a-panel').forEach(el => el.classList.remove('active'));
        document.getElementById('panel-' + p)?.classList.add('active');
        if (p === 'manage') renderManage();
      });
    });
    document.getElementById('logoutBtn')?.addEventListener('click', hidePanel);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  function refreshStats() {
    const n = getAllImages().length;
    const el = document.getElementById('sTotalCount');
    if (el) el.textContent = n;
  }

  // ── Add Form ───────────────────────────────────────────────────────────────
  function bindPanel() {
    // Char counter
    document.getElementById('imgPrompt')?.addEventListener('input', e => {
      const el = document.getElementById('charCount');
      if (el) el.textContent = e.target.value.length;
    });
    // Preview
    document.getElementById('previewBtn')?.addEventListener('click', () => {
      const url = document.getElementById('imgUrl')?.value.trim();
      const box = document.getElementById('imgPreviewBox');
      const img = document.getElementById('imgPreview');
      if (!url) { showToast('Enter an image URL first', 'err'); return; }
      img.src = url;
      img.onload = () => { box.style.display = 'block'; };
      img.onerror = () => { showToast('Cannot load image — check the URL', 'err'); box.style.display = 'none'; };
    });
    // Clear
    document.getElementById('clearBtn')?.addEventListener('click', clearForm);
    // Save
    document.getElementById('saveBtn')?.addEventListener('click', saveImage);
    // Manage filters
    document.getElementById('mSearch')?.addEventListener('input', renderManage);
    document.getElementById('mFilter')?.addEventListener('change', renderManage);
    // Export
    document.getElementById('exportBtn')?.addEventListener('click', exportData);
    // Edit modal
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelEdit')?.addEventListener('click', closeModal);
    document.getElementById('saveEdit')?.addEventListener('click', saveEdit);
    document.getElementById('editModalBg')?.addEventListener('click', e => {
      if (e.target === document.getElementById('editModalBg')) closeModal();
    });
  }

  function saveImage() {
    const title = v('imgTitle');
    const category = v('imgCategory');
    const image = v('imgUrl');
    const prompt = v('imgPrompt');
    const tagsRaw = v('imgTags');
    if (!title || !category || !image || !prompt) {
      showToast('Fill in all required fields', 'err');
      ['imgTitle','imgCategory','imgUrl','imgPrompt'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) { el.style.borderColor = '#f87171'; setTimeout(() => el.style.borderColor = '', 2000); }
      });
      return;
    }
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    addImage({ title, category, image, prompt, tags });
    showToast('Image added to gallery!');
    clearForm();
    refreshStats();
  }

  function clearForm() {
    ['imgTitle','imgUrl','imgPrompt','imgTags'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('imgCategory').value = '';
    document.getElementById('imgPreviewBox').style.display = 'none';
    document.getElementById('charCount').textContent = '0';
  }

  // ── Manage ─────────────────────────────────────────────────────────────────
  function renderManage() {
    const grid = document.getElementById('manageGrid');
    const empty = document.getElementById('manageEmpty');
    if (!grid) return;
    let imgs = getAllImages();
    const q = document.getElementById('mSearch')?.value.toLowerCase().trim();
    const cat = document.getElementById('mFilter')?.value;
    if (cat && cat !== 'all') imgs = imgs.filter(i => i.category === cat);
    if (q) imgs = imgs.filter(i => i.title.toLowerCase().includes(q) || i.prompt.toLowerCase().includes(q));
    if (!imgs.length) { grid.innerHTML = ''; empty.style.display = 'flex'; return; }
    empty.style.display = 'none';
    grid.innerHTML = imgs.map(buildMCard).join('');
    grid.querySelectorAll('.m-edit').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id)));
    grid.querySelectorAll('.m-del').forEach(btn => btn.addEventListener('click', () => deleteItem(btn.dataset.id)));
  }

  function buildMCard(img) {
    return `<div class="m-card">
      <div class="m-card-img"><img src="${esc(img.image)}" alt="${esc(img.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=400&q=60'"/></div>
      <div class="m-card-body">
        <div class="m-card-title">${esc(img.title)}</div>
        <span class="m-badge">${esc(img.category)}</span>
        <div class="m-prompt">${esc(img.prompt)}</div>
        <div class="m-actions">
          <button class="m-edit" data-id="${esc(img.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="m-del" data-id="${esc(img.id)}"><i class="fa-solid fa-trash"></i> Del</button>
        </div>
      </div>
    </div>`;
  }

  // ── Edit Modal ─────────────────────────────────────────────────────────────
  function openModal(id) {
    const img = getAllImages().find(i => i.id === id);
    if (!img) return;
    document.getElementById('editId').value = img.id;
    document.getElementById('editTitle').value = img.title;
    document.getElementById('editCat').value = img.category;
    document.getElementById('editUrl').value = img.image;
    document.getElementById('editPrompt').value = img.prompt;
    document.getElementById('editTags').value = (img.tags || []).join(', ');
    document.getElementById('editModalBg').style.display = 'flex';
  }
  function closeModal() { document.getElementById('editModalBg').style.display = 'none'; }
  function saveEdit() {
    const id = document.getElementById('editId').value;
    const title = v('editTitle'); const category = v('editCat');
    const image = v('editUrl'); const prompt = v('editPrompt');
    const tags = v('editTags').split(',').map(t => t.trim()).filter(Boolean);
    if (!title || !image || !prompt) { showToast('Required fields missing', 'err'); return; }
    updateImage(id, { title, category, image, prompt, tags });
    showToast('Changes saved!');
    closeModal(); renderManage(); refreshStats();
  }
  function deleteItem(id) {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    deleteImage(id);
    showToast('Image deleted');
    renderManage(); refreshStats();
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function exportData() {
    const blob = new Blob([JSON.stringify(getAllImages(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'promptgallery-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Exported!');
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg, type) {
    const wrap = document.getElementById('toastWrap');
    const msgEl = document.getElementById('toastMsg');
    const inner = document.querySelector('.toast-inner');
    if (!wrap) return;
    msgEl.textContent = msg;
    if (inner) inner.style.background = type === 'err'
      ? 'linear-gradient(135deg,rgba(220,38,38,0.95),rgba(248,113,113,0.95))'
      : 'linear-gradient(135deg,rgba(139,92,246,0.95),rgba(6,182,212,0.95))';
    wrap.classList.add('show');
    setTimeout(() => wrap.classList.remove('show'), 2800);
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function v(id) { return (document.getElementById(id)?.value || '').trim(); }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
