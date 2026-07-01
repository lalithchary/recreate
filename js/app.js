/**
 * app.js — Public Gallery
 */

(function () {
  'use strict';

  let activeCategory = 'all';
  let searchQuery = '';

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    updateStats();
    renderGallery();
    bindEvents();
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  function updateStats() {
    const all = getAllImages();
    const totalEl = document.getElementById('totalImages');
    const copiedEl = document.getElementById('totalCopied');
    if (totalEl) animateNumber(totalEl, all.length);
    if (copiedEl) animateNumber(copiedEl, getCopyCount());
  }

  function animateNumber(el, target) {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(interval);
    }, 30);
  }

  // ── Render Gallery ──────────────────────────────────────────────────────────
  function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const empty = document.getElementById('emptyState');
    if (!grid) return;

    let images = getAllImages();

    // Filter by category
    if (activeCategory !== 'all') {
      images = images.filter(img => img.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      images = images.filter(img =>
        img.title.toLowerCase().includes(q) ||
        img.prompt.toLowerCase().includes(q) ||
        (img.tags || []).some(t => t.toLowerCase().includes(q)) ||
        img.category.toLowerCase().includes(q)
      );
    }

    if (images.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';
    grid.innerHTML = images.map(img => buildCard(img)).join('');

    // Stagger animation
    grid.querySelectorAll('.card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 60);
    });
  }

  // ── Build Card ──────────────────────────────────────────────────────────────
  function buildCard(img) {
    const tags = (img.tags || []).slice(0, 3).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
    const promptPreview = escHtml(img.prompt.substring(0, 100)) + (img.prompt.length > 100 ? '...' : '');

    return `
      <article class="card" data-id="${escHtml(img.id)}">
        <div class="card-img-wrap">
          <img src="${escHtml(img.image)}" alt="${escHtml(img.title)}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=60'"/>
          <span class="card-cat-badge">${escHtml(img.category)}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${escHtml(img.title)}</div>
          <div class="prompt-box">
            <div class="prompt-text">${promptPreview}</div>
            <button class="copy-btn" data-prompt="${escAttr(img.prompt)}" title="Copy full prompt">
              <i class="fa-solid fa-copy"></i> Copy
            </button>
          </div>
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        </div>
      </article>
    `;
  }

  // ── Events ──────────────────────────────────────────────────────────────────
  function bindEvents() {
    // Category tabs
    document.getElementById('catTabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.cat-tab');
      if (!tab) return;
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.cat;
      renderGallery();
    });

    // Search
    let searchTimeout;
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        renderGallery();
      }, 300);
    });

    // Copy buttons (event delegation)
    document.getElementById('galleryGrid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.copy-btn');
      if (!btn) return;
      const prompt = btn.dataset.prompt;
      copyToClipboard(prompt, btn);
    });

    // Hamburger
    const ham = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    ham?.addEventListener('click', () => nav.classList.toggle('open'));

    // Header scroll shadow
    window.addEventListener('scroll', () => {
      const header = document.getElementById('header');
      if (window.scrollY > 20) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
    }, { passive: true });
  }

  // ── Copy to Clipboard ───────────────────────────────────────────────────────
  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      // Update button
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('copied');
      }, 2000);

      // Increment counter
      incrementCopyCount();
      const copiedEl = document.getElementById('totalCopied');
      if (copiedEl) copiedEl.textContent = getCopyCount();

      showToast('Prompt copied to clipboard!');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Prompt copied!');
    });
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // ── Utils ───────────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
