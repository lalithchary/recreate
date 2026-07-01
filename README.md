# PromptGallery ✦

A modern futuristic gallery website for AI-generated images with copyable prompts.

**Live Site:** https://lalithchary.github.io/recreate

---

## Features

- 🖼️ Futuristic dark gallery with animated grid background
- 📋 One-click prompt copy (full prompt copied, preview shown)
- 🗂️ Categories: Family, Girl, Boy, Kids, Birthday, Wedding, Invitations
- 🔍 Search across titles, prompts, and tags
- 🔐 Admin panel (password protected) to add/edit/delete images
- 📤 Export gallery data as JSON backup
- 💾 Data stored in localStorage (no backend needed)

---

## Admin Access

Go to `/admin.html` — default password is `admin123`.

**To change the password:** edit line 10 of `js/admin.js`:
```js
const ADMIN_PASSWORD = 'your_new_password';
```

---

## How to Deploy to GitHub Pages

1. Push this repo to `https://github.com/lalithchary/recreate`
2. Go to repo **Settings → Pages**
3. Set source to **Deploy from branch → main → / (root)**
4. Your site will be live at `https://lalithchary.github.io/recreate`

---

## Adding Images (Admin Panel)

1. Visit `your-site/admin.html`
2. Login with your password
3. Click **Add Image**
4. Fill in:
   - **Title** — display name
   - **Category** — select from dropdown
   - **Image URL** — direct link to image (upload to [imgbb.com](https://imgbb.com) for free hosting)
   - **Full AI Prompt** — paste the complete prompt (visitors see preview, copy gets the full text)
   - **Tags** — optional, comma separated

---

## File Structure

```
├── index.html          — Main gallery page
├── admin.html          — Admin panel
├── css/
│   ├── style.css       — Main styles
│   └── admin.css       — Admin-specific styles
├── js/
│   ├── data.js         — Data layer (localStorage)
│   ├── app.js          — Gallery logic
│   └── admin.js        — Admin panel logic
└── README.md
```
