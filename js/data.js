/**
 * data.js — Shared data layer using localStorage
 * Admin saves here; gallery reads from here.
 */

const DB_KEY = 'promptGallery_images';

// ── Sample seed data (shown on first load) ────────────────────────────────────
const SEED_DATA = [
  {
    id: 'seed_1',
    title: 'Golden Family Portrait',
    category: 'family',
    image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&q=80',
    prompt: 'A warm, golden-hour family portrait with cinematic lighting, shot on 85mm lens, bokeh background of a lush garden, mother, father, two children laughing naturally, film grain, Kodak Portra 400 style, soft shadows, warm tones, professional photography, 8k ultra-detailed',
    tags: ['family', 'portrait', 'golden hour', 'cinematic'],
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'seed_2',
    title: 'Elegant Bride Portrait',
    category: 'wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
    prompt: 'A breathtaking bridal portrait, ethereal white dress, soft natural light streaming through stained glass, bokeh floral background, dreamy atmosphere, film photography, Fuji 400H, shallow depth of field, timeless elegance, 8k resolution, award-winning photography',
    tags: ['wedding', 'bride', 'portrait', 'elegant'],
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: 'seed_3',
    title: 'Futuristic Girl Portrait',
    category: 'girl',
    image: 'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=600&q=80',
    prompt: 'A futuristic cyberpunk girl with neon-lit face, glowing eyes, holographic accessories, rain-soaked night city background, dramatic rim lighting in purple and blue, hyper-realistic, 8k, intricate details, cinematic composition, concept art style',
    tags: ['girl', 'cyberpunk', 'neon', 'futuristic'],
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'seed_4',
    title: 'Happy Birthday Cake',
    category: 'birthday',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    prompt: 'A magical birthday celebration, colorful confetti falling, beautiful layered cake with glowing candles, bokeh fairy lights, vibrant and joyful atmosphere, children laughing, wide-angle lens, HDR, photorealistic, 8k ultra detail, warm and festive lighting',
    tags: ['birthday', 'cake', 'celebration', 'kids'],
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'seed_5',
    title: 'Adventure Boy',
    category: 'boy',
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80',
    prompt: 'A young adventurous boy exploring a misty forest at dawn, golden light filtering through trees, wearing explorer gear, sense of wonder and discovery, cinematic wide shot, Nikon D850, 24mm lens, realistic textures, National Geographic style, award-winning photography',
    tags: ['boy', 'adventure', 'forest', 'cinematic'],
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: 'seed_6',
    title: 'Kids Playing Together',
    category: 'kids',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80',
    prompt: 'Joyful children playing in a sunlit meadow, colorful clothes, big smiles, motion blur on running children, golden hour lighting, shallow depth of field, Canon 5D Mark IV, 135mm f/2, warm tones, lifestyle photography, natural candid moments, 8k',
    tags: ['kids', 'playing', 'outdoor', 'joyful'],
    createdAt: Date.now() - 86400000 * 0.5
  },
  {
    id: 'seed_7',
    title: 'Luxury Wedding Invitation',
    category: 'invitation',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80',
    prompt: 'An elegant luxury wedding invitation design, gold foil typography on ivory textured paper, floral watercolor border, rose gold ribbon details, soft shadow, overhead flat lay shot, macro photography, high detail, premium stationery feel, warm diffused light',
    tags: ['invitation', 'wedding', 'luxury', 'design'],
    createdAt: Date.now()
  },
  {
    id: 'seed_8',
    title: 'Family Beach Sunset',
    category: 'family',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    prompt: 'A beautiful family silhouette on a tropical beach at golden sunset, ocean waves softly lapping, warm orange and pink sky, parents holding hands with children, long exposure, cinematic wide angle, emotional and heartfelt, Lightroom edited, 8k resolution',
    tags: ['family', 'beach', 'sunset', 'silhouette'],
    createdAt: Date.now()
  }
];

// ── Data Access Functions ─────────────────────────────────────────────────────

function getAllImages() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    // Seed data on first load
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  try { return JSON.parse(raw); }
  catch { return []; }
}

function saveAllImages(images) {
  localStorage.setItem(DB_KEY, JSON.stringify(images));
}

function addImage(img) {
  const images = getAllImages();
  img.id = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  img.createdAt = Date.now();
  images.unshift(img);
  saveAllImages(images);
  return img;
}

function updateImage(id, updates) {
  const images = getAllImages();
  const idx = images.findIndex(i => i.id === id);
  if (idx === -1) return false;
  images[idx] = { ...images[idx], ...updates };
  saveAllImages(images);
  return true;
}

function deleteImage(id) {
  const images = getAllImages().filter(i => i.id !== id);
  saveAllImages(images);
}

function getImagesByCategory(cat) {
  const all = getAllImages();
  if (cat === 'all') return all;
  return all.filter(i => i.category === cat);
}

// Copy counter
const COPY_KEY = 'promptGallery_copies';
function incrementCopyCount() {
  const n = parseInt(localStorage.getItem(COPY_KEY) || '0', 10) + 1;
  localStorage.setItem(COPY_KEY, n);
  return n;
}
function getCopyCount() {
  return parseInt(localStorage.getItem(COPY_KEY) || '0', 10);
}
