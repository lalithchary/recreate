/**
 * admin.js — Admin Panel Logic
 * Change ADMIN_PASSWORD below to set your own password.
 */

(function () {
  'use strict';

  // ── CHANGE THIS PASSWORD ───────────────────────────────────────────────────
  const ADMIN_PASSWORD = 'admin123';
  // ──────────────────────────────────────────────────────────────────────────

  const SESSION_KEY = 'promptGallery_admin_session';

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    checkSession();
    bindLoginEvents();
    bindAdminEvents();
    bindSidebarNav();
  }

  // ── Session ──────────────────────────────────────────────────────────────────
  function checkSession() {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      showAdminPanel();
    }
  }

  function showAdminPanel() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminWrap').style.display = 'flex';
    updateSidebarStats();
    renderManageGrid();
  }

  function hideAdminPanel() {
    sessionStorage.removeItem(SESSION_KEY);
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('adminWrap').style.display = 'none';
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  function bindLoginEvents() {
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('passwordInput');

    loginBtn?.addEventListener('click', attemptLogin);
    passwordInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  function attemptLogin() {
    const val = document.getElementById('passwordInput').value;
    if (val === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      showAdminPanel();
    } else {
      const field = document.querySelector('.login-field');
      field.style.borderColor = '#f87171';
      field.style.boxShadow = '0 0 0 3px rgba(248,113,113,0.2)';
      showToast('Incorrect password', 'error');
      setTimeout(() => {
        field.style.borderColor = '';
        field.style.boxShadow = '';
      }, 1500);
    }
  }

  // ── Sidebar Nav ──────────────────────────────────────────────────────────────
  function bindSidebarNav() {
    document.querySelectorAll('.s-link[data-panel]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const panel = link.dataset.panel;
        document.querySelectorAll('.s-link[data-panel]').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + panel)?.classList.add('active');
        if (panel === 'manage') renderManageGrid();
      });
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      hideAdminPanel();
    });
  }

  // ── Stats ────────────────────────────────────────────────────────────────────
  function updateSidebarStats() {
    const all = getAllImages();
    const sTotal = document.getElementById('sTotal');
    const sPublished = document.getElementById('sPublished');
    if (sTotal) sTotal.textContent = all.length;
    if (sPublished) sPublished.textContent = all.length;
  }

  // ── Add Form ─────────────────────────────────────────────────────────────────
  function bindAdminEvents() {
    // Char count
    document.getElementById('imgPrompt')?.addEventListener('input', (e) => {
      const count = document.getElementById('promptCharCount');
      if (count) count.textContent = e.target.value.length + ' characters';
    });

    // Image preview
    document.getElementById('previewBtn')?.addEventListener('click', () => {
      const url = document.getElementById('imgUrl').value.trim();
      const wrap = document.getElementById('imgPreviewWrap');
      const preview = document.getElementById('imgPreview');
      if (!url) { showToast('Enter an image URL first', 'error'); return; }
      preview.src = url;
      preview.onload = () => { wrap.style.display = 'block'; };
      preview.onerror = () => { showToast('Could not load image. Check the URL.', 'error'); wrap.style.display = 'none'; };
    });

    // Clear form
    document.getElementById('clearFormBtn')?.addEventListener('click', clearAddForm);

    // Save image
    document.getElementById('saveImageBtn')?.addEventListener('click', saveNewImage);

    // Manage search + filter
    document.getElementById('manageSearch')?.addEventListener('input', renderManageGrid);
    document.getElementById('manageFilter')?.addEventListener('change', renderManageGrid);

    // Export JSON
    document.getElementById('exportBtn')?.addEventListener('click', exportJSON);

    // Edit modal
    document.getElementById('closeModal')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit')?.addEventListener('click', closeEditModal);
    document.getElementById('saveEdit')?.addEventListener('click', saveEdit);

    // Close modal on overlay click
    document.getElementById('editModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('editModal')) closeEditModal();
    });
  }

  // ── Save New Image ────────────────────────────────────────────────────────────
  function saveNewImage() {
    const title = document.getElementById('imgTitle').value.trim();
    const category = document.getElementById('imgCategory').value;
    const image = document.getElementById('imgUrl').value.trim();
    const prompt = document.getElementById('imgPrompt').value.trim();
    const tagsRaw = document.getElementById('imgTags').value.trim();

    // Validate
    if (!title || !category || !image || !prompt) {
      showToast('Please fill in all required fields', 'error');
      highlightEmpty();
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const img = addImage({ title, category, image, prompt, tags });
    showToast('Image added to gallery!');
    clearAddForm();
    updateSidebarStats();
  }

  function highlightEmpty() {
    ['imgTitle', 'imgCategory', 'imgUrl', 'imgPrompt'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value.trim()) {
        el.style.borderColor = '#f87171';
        setTimeout(() => { el.style.borderColor = ''; }, 2000);
      }
    });
  }

  function clearAddForm() {
    ['imgTitle', 'imgUrl', 'imgPrompt', 'imgTags'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('imgCategory').value = '';
    document.getElementById('imgPreviewWrap').style.display = 'none';
    document.getElementById('promptCharCount').textContent = '0 characters';
  }

  // ── Manage Grid ───────────────────────────────────────────────────────────────
  function renderManageGrid() {
    const grid = document.getElementById('manageGrid');
    const empty = document.getElementById('manageEmpty');
    if (!grid) return;

    let images = getAllImages();
    const q = document.getElementById('manageSearch')?.value.toLowerCase().trim();
    const filter = document.getElementById('manageFilter')?.value;

    if (filter && filter !== 'all') images = images.filter(i => i.category === filter);
    if (q) images = images.filter(i => i.title.toLowerCase().includes(q) || i.prompt.toLowerCase().includes(q));

    if (images.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = images.map(img => buildManageCard(img)).join('');

    // Bind actions
    grid.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    grid.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });
  }

  function buildManageCard(img) {
    return `
      <div class="manage-card" data-id="${esc(img.id)}">
        <div class="manage-card-img">
          <img src="${esc(img.image)}" alt="${esc(img.title)}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/400x225?text=No+Image'" />
        </div>
        <div class="manage-card-body">
          <div class="manage-card-title">${esc(img.title)}</div>
          <span class="manage-card-cat">${esc(img.category)}</span>
          <div class="manage-card-prompt">${esc(img.prompt)}</div>
          <div class="manage-card-actions">
            <button class="btn-edit" data-id="${esc(img.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn-delete" data-id="${esc(img.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Edit Modal ────────────────────────────────────────────────────────────────
  function openEditModal(id) {
    const images = getAllImages();
    const img = images.find(i => i.id === id);
    if (!img) return;

    document.getElementById('editId').value = img.id;
    document.getElementById('editTitle').value = img.title;
    document.getElementById('editCategory').value = img.category;
    document.getElementById('editUrl').value = img.image;
    document.getElementById('editPrompt').value = img.prompt;
    document.getElementById('editTags').value = (img.tags || []).join(', ');

    document.getElementById('editModal').style.display = 'flex';
  }

  function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
  }

  function saveEdit() {
    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value.trim();
    const category = document.getElementById('editCategory').value;
    const image = document.getElementById('editUrl').value.trim();
    const prompt = document.getElementById('editPrompt').value.trim();
    const tagsRaw = document.getElementById('editTags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!title || !image || !prompt) { showToast('Required fields missing', 'error'); return; }

    updateImage(id, { title, category, image, prompt, tags });
    showToast('Changes saved!');
    closeEditModal();
    renderManageGrid();
    updateSidebarStats();
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  function confirmDelete(id) {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    deleteImage(id);
    showToast('Image deleted');
    renderManageGrid();
    updateSidebarStats();
  }

  // ── Export JSON ───────────────────────────────────────────────────────────────
  function exportJSON() {
    const data = getAllImages();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptgallery-export-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported successfully!');
  }

  // ── Toast ─────────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    toastMsg.textContent = msg;
    toast.style.background = type === 'error'
      ? 'linear-gradient(135deg, #dc2626, #f87171)'
      : 'linear-gradient(135deg, var(--accent), var(--accent2))';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // ── Utils ─────────────────────────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Start ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
