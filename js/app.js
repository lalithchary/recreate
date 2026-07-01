/**
 * app.js — Public Gallery with 3D effects, stars, lightbox
 */
(function () {
  'use strict';

  let activeCategory = 'all';
  let searchQuery = '';
  let isListView = false;
  let lightboxData = null;

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    initStars();
    updateCounters();
    renderGallery();
    bindEvents();
    initTypedText();
  }

  // ── Star Canvas ───────────────────────────────────────────────────────────────
  function initStars() {
    const canvas = document.getElementById('starCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random(),
        speed: Math.random() * 0.4 + 0.1
      }));
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.speed * 0.008;
        if (s.a > 1) s.a = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.sin(s.a * Math.PI) * 0.7})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Typed Text Animation ──────────────────────────────────────────────────────
  function initTypedText() {
    const el = document.getElementById('typedText');
    if (!el) return;
    const phrases = ['Create Magic.', 'Tell Stories.', 'Make Memories.', 'Inspire Others.'];
    let pi = 0, ci = 0, deleting = false;
    function type() {
      const phrase = phrases[pi];
      if (!deleting) {
        el.textContent = phrase.slice(0, ++ci);
        if (ci === phrase.length) { deleting = true; setTimeout(type, 2200); return; }
        setTimeout(type, 60);
      } else {
        el.textContent = phrase.slice(0, --ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(type, 300); return; }
        setTimeout(type, 35);
      }
    }
    type();
  }

  // ── Counters ──────────────────────────────────────────────────────────────────
  function updateCounters() {
    const all = getAllImages();
    animCount(document.getElementById('totalImages'), all.length);
    animCount(document.getElementById('totalCopied'), getCopyCount());
  }
  function animCount(el, target) {
    if (!el) return;
    let n = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const t = setInterval(() => {
      n = Math.min(n + step, target);
      el.textContent = n;
      if (n >= target) clearInterval(t);
    }, 25);
  }

  // ── Render Gallery ────────────────────────────────────────────────────────────
  function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const empty = document.getElementById('emptyState');
    const countEl = document.getElementById('galleryCount');
    if (!grid) return;

    let imgs = getAllImages();
    if (activeCategory !== 'all') imgs = imgs.filter(i => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      imgs = imgs.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.prompt.toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q)) ||
        i.category.toLowerCase().includes(q)
      );
    }

    if (countEl) countEl.textContent = `${imgs.length} image${imgs.length !== 1 ? 's' : ''} found`;

    if (!imgs.length) {
      grid.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = imgs.map((img, idx) => buildCard(img, idx)).join('');

    // Stagger entrance
    grid.querySelectorAll('.card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 70);
    });

    // 3D tilt on desktop
    if (window.matchMedia('(hover: hover)').matches) {
      grid.querySelectorAll('.card').forEach(card => attach3DTilt(card));
    }
  }

  // ── Build Card ────────────────────────────────────────────────────────────────
  function buildCard(img) {
    const tags = (img.tags || []).slice(0, 3)
      .map(t => `<span class="tag">${esc(t)}</span>`).join('');
    const preview = esc(img.prompt.substring(0, 90)) + (img.prompt.length > 90 ? '…' : '');
    return `
      <article class="card" data-id="${esc(img.id)}">
        <div class="card-img">
          <img src="${esc(img.image)}" alt="${esc(img.title)}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=600&q=60'" />
          <span class="cat-badge">${esc(img.category)}</span>
          <div class="card-img-overlay">
            <div class="overlay-hint"><i class="fa-solid fa-expand"></i> View full</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${esc(img.title)}</div>
          <div class="prompt-row">
            <div class="prompt-preview">${preview}</div>
            <button class="copy-btn" data-prompt="${escAttr(img.prompt)}" title="Copy full prompt">
              <i class="fa-solid fa-copy"></i> Copy
            </button>
          </div>
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        </div>
      </article>`;
  }

  // ── 3D Tilt ───────────────────────────────────────────────────────────────────
  function attach3DTilt(card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / (rect.height / 2)) * -8;
      const ry = ((e.clientX - cx) / (rect.width / 2)) * 8;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  // ── Events ────────────────────────────────────────────────────────────────────
  function bindEvents() {
    // Category tabs
    document.getElementById('catTabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderGallery();
    });

    // Search
    let debounce;
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { searchQuery = e.target.value; renderGallery(); }, 280);
    });

    // Keyboard shortcut ⌘K / Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
      if (e.key === 'Escape') closeLightbox();
    });

    // View toggle
    document.getElementById('viewGrid')?.addEventListener('click', () => {
      isListView = false;
      document.getElementById('galleryGrid')?.classList.remove('list-view');
      document.getElementById('viewGrid')?.classList.add('active');
      document.getElementById('viewList')?.classList.remove('active');
    });
    document.getElementById('viewList')?.addEventListener('click', () => {
      isListView = true;
      document.getElementById('galleryGrid')?.classList.add('list-view');
      document.getElementById('viewList')?.classList.add('active');
      document.getElementById('viewGrid')?.classList.remove('active');
    });

    // Gallery delegation — copy + lightbox
    document.getElementById('galleryGrid')?.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.copy-btn');
      if (copyBtn) { e.stopPropagation(); copyPrompt(copyBtn.dataset.prompt, copyBtn); return; }
      const card = e.target.closest('.card');
      if (card) openLightbox(card.dataset.id);
    });

    // Lightbox copy
    document.getElementById('lbCopyBtn')?.addEventListener('click', () => {
      if (lightboxData) copyPrompt(lightboxData.prompt, document.getElementById('lbCopyBtn'));
    });

    // Lightbox close
    document.getElementById('lbClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lbBackdrop')?.addEventListener('click', closeLightbox);

    // Footer category links
    document.querySelectorAll('[data-cat-link]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.dataset.catLink;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.cat-btn[data-cat="${cat}"]`)?.classList.add('active');
        activeCategory = cat;
        renderGallery();
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Hamburger
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('nav')?.classList.toggle('open');
    });

    // Header scroll
    window.addEventListener('scroll', () => {
      document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  // ── Lightbox ──────────────────────────────────────────────────────────────────
  function openLightbox(id) {
    const imgs = getAllImages();
    const img = imgs.find(i => i.id === id);
    if (!img) return;
    lightboxData = img;
    document.getElementById('lbImg').src = img.image;
    document.getElementById('lbImg').alt = img.title;
    document.getElementById('lbTitle').textContent = img.title;
    document.getElementById('lbPrompt').textContent = img.prompt;
    document.getElementById('lbTags').innerHTML = (img.tags || [])
      .map(t => `<span class="tag">${esc(t)}</span>`).join('');
    document.getElementById('lightbox').style.display = 'flex';
    document.getElementById('lbBackdrop').style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.getElementById('lbBackdrop').style.display = 'none';
    document.body.style.overflow = '';
    lightboxData = null;
  }

  // ── Copy ──────────────────────────────────────────────────────────────────────
  function copyPrompt(text, btn) {
    const orig = btn.innerHTML;
    navigator.clipboard.writeText(text).then(success).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); success();
    });
    function success() {
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btn.classList.add('done');
      incrementCopyCount();
      const el = document.getElementById('totalCopied');
      if (el) el.textContent = getCopyCount();
      showToast('Full prompt copied!');
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('done'); }, 2200);
    }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────────
  function showToast(msg) {
    const wrap = document.getElementById('toastWrap');
    const msgEl = document.getElementById('toastMsg');
    if (!wrap) return;
    msgEl.textContent = msg;
    wrap.classList.add('show');
    setTimeout(() => wrap.classList.remove('show'), 2800);
  }

  // ── Utils ─────────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
