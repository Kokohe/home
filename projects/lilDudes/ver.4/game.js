// ─── TILE TYPES ───────────────────────────────────────────────────────────────
const T = {
  GRASS:0, DIRT:1, STONE_FLOOR:2, WALL:3, TREE:4, ROCK:5,
  FARMPLOT:6, CROP_GROWING:7, CROP_READY:8, STOCKPILE:9,
  DEEP_ROCK:10, ORE:11
};

const TILE_COLOR = {
  [T.GRASS]:'#2d4a1e',    [T.DIRT]:'#6b4c2a',      [T.STONE_FLOOR]:'#4a4a55',
  [T.WALL]:'#888899',     [T.TREE]:'#1a5c20',       [T.ROCK]:'#6a6a7a',
  [T.FARMPLOT]:'#7a5c30', [T.CROP_GROWING]:'#5a8a30',[T.CROP_READY]:'#8aaa30',
  [T.STOCKPILE]:'#4a3a20',[T.DEEP_ROCK]:'#28282f',  [T.ORE]:'#6a4a7a'
};

// ─── FOG OF WAR ───────────────────────────────────────────────────────────────
const FOG_RADIUS = 4;          // tiles each colonist reveals
const exploredTiles = new Set(); // "x,y" keys of permanently revealed tiles

function revealAround(cx, cy, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dy) <= radius + 1) {
        exploredTiles.add(`${cx + dx},${cy + dy}`);
      }
    }
  }
}

function isExplored(x, y) {
  return exploredTiles.has(`${x},${y}`);
}

function isVisible(x, y) {
  // Currently lit by a colonist (within FOG_RADIUS manhattan distance)
  for (const col of colonists) {
    if (Math.abs(col.x - x) + Math.abs(col.y - y) <= FOG_RADIUS) return true;
  }
  return false;
}

// ─── WORLD: INFINITE CHUNK MAP ────────────────────────────────────────────────
const CHUNK = 16;
const worldChunks = new Map();
const worldOverrides = new Map();

function noise(x, y, seed = 12345) {
  let n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453;
  return n - Math.floor(n);
}

// Smooth value noise — average 2x2 cell corners for a gradient-like feel
function smoothNoise(x, y, seed, scale) {
  const sx = x / scale, sy = y / scale;
  const ix = Math.floor(sx), iy = Math.floor(sy);
  const fx = sx - ix, fy = sy - iy;
  // Smoothstep
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = noise(ix,   iy,   seed);
  const b = noise(ix+1, iy,   seed);
  const c = noise(ix,   iy+1, seed);
  const d = noise(ix+1, iy+1, seed);
  return a + (b-a)*ux + (c-a)*uy + (d-a)*ux*uy; // bilinear with smoothstep
}

// Fractal Brownian Motion — stack octaves for natural-looking terrain
function fbm(x, y, seed, scale, octaves = 4) {
  let v = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    v   += smoothNoise(x, y, seed + i * 997, scale / freq) * amp;
    max += amp;
    amp  *= 0.5;
    freq *= 2;
  }
  return v / max; // normalise to 0..1
}

function genChunk(cx, cy) {
  const tiles = new Array(CHUNK * CHUNK);
  for (let ly = 0; ly < CHUNK; ly++) {
    for (let lx = 0; lx < CHUNK; lx++) {
      const wx = cx * CHUNK + lx;
      const wy = cy * CHUNK + ly;

      // ── Mountain map: large slow blobs (scale 28), high threshold = sparse massifs
      const mountain = fbm(wx, wy, 1111, 28, 5);

      // ── Forest map: medium clumps (scale 14) with jitter noise for ragged edges
      const forestBase  = fbm(wx, wy, 2222, 14, 4);
      const forestJitter = noise(wx, wy, 3333) * 0.18; // rough up the edge
      const forest = forestBase - forestJitter;

      // ── Ore/rock scatter: small-scale detail noise
      const detail = noise(wx, wy, 4444);

      let type = T.GRASS;

      if (mountain > 0.68) {
        // Deep mountain core — impassable
        type = T.DEEP_ROCK;
      } else if (mountain > 0.58) {
        // Mountain flanks — rock with occasional ore seams
        type = detail < 0.25 ? T.ORE : T.ROCK;
      } else if (mountain > 0.48) {
        // Rocky foothills — scattered rocks, higher density near peaks
        const rockChance = (mountain - 0.48) / 0.10; // 0→1 as we approach flank
        if (detail < rockChance * 0.5) type = T.ROCK;
      } else if (forest > 0.54) {
        // Dense forest core
        type = T.TREE;
      } else if (forest > 0.40) {
        // Forest edge — trees thin out based on how far from core
        const treeChance = (forest - 0.40) / 0.14;
        if (detail < treeChance * 0.75) type = T.TREE;
      } else {
        // Open land — very occasional lone trees / rocks
        if      (detail < 0.03) type = T.TREE;
        else if (detail < 0.05) type = T.ROCK;
      }

      tiles[ly * CHUNK + lx] = { type, item: null, progress: 0 };
    }
  }
  return tiles;
}

function getChunk(cx, cy) {
  const key = `${cx},${cy}`;
  if (!worldChunks.has(key)) worldChunks.set(key, genChunk(cx, cy));
  return worldChunks.get(key);
}

function tileAt(x, y) {
  const okey = `${x},${y}`;
  if (worldOverrides.has(okey)) return worldOverrides.get(okey);
  const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
  const lx = ((x % CHUNK) + CHUNK) % CHUNK, ly = ((y % CHUNK) + CHUNK) % CHUNK;
  return getChunk(cx, cy)[ly * CHUNK + lx];
}

function tileRef(x, y) {
  const okey = `${x},${y}`;
  if (!worldOverrides.has(okey)) {
    worldOverrides.set(okey, { ...tileAt(x, y) });
  }
  return worldOverrides.get(okey);
}

function inBounds() { return true; }

function initStartingArea() {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const t = tileRef(dx, dy);
      if (t.type !== T.GRASS && t.type !== T.DIRT) t.type = T.GRASS;
    }
  }
  tileRef(-1, 1).type = T.STOCKPILE;
  tileRef( 0, 1).type = T.STOCKPILE;
}

// ─── COLONY RESOURCES ─────────────────────────────────────────────────────────
const colony = { food:20, wood:10, stone:5, iron:0 };
const gameLog = [];

// ─── CANVAS & CAMERA ──────────────────────────────────────────────────────────
const TS = 32;
let zoom = 1.0;
const ZOOM_MIN = 0.4, ZOOM_MAX = 2.5, ZOOM_STEP = 0.15;
const camera = { x: 0, y: 0 };
const CAM_PX_PER_FRAME = 6;
const keysDown = {};
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}
window.addEventListener('resize', () => { resizeCanvas(); });
window.addEventListener('keydown', e => {
  keysDown[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  if (e.key === '=' || e.key === '+') zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP);
  if (e.key === '-' || e.key === '_') zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP);
});
window.addEventListener('keyup', e => { keysDown[e.key] = false; });

function handleCamera() {
  const speed = CAM_PX_PER_FRAME / zoom;
  if (keysDown['ArrowLeft'])  camera.x -= speed;
  if (keysDown['ArrowRight']) camera.x += speed;
  if (keysDown['ArrowUp'])    camera.y -= speed;
  if (keysDown['ArrowDown'])  camera.y += speed;
}

// ─── RENDERING ────────────────────────────────────────────────────────────────
const TILE_ICONS = {
  [T.TREE]:'🌲', [T.ROCK]:'🪨', [T.ORE]:'💎',
  [T.CROP_READY]:'🌾', [T.CROP_GROWING]:'🌱'
};

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const tileSize = TS * zoom;
  const camTileX = camera.x / TS;
  const camTileY = camera.y / TS;
  const visW = Math.ceil(canvas.width  / tileSize) + 2;
  const visH = Math.ceil(canvas.height / tileSize) + 2;
  const startTX = Math.floor(camTileX);
  const startTY = Math.floor(camTileY);

  for (let ty = startTY; ty < startTY + visH; ty++) {
    for (let tx = startTX; tx < startTX + visW; tx++) {
      const sx = Math.round((tx - camTileX) * tileSize);
      const sy = Math.round((ty - camTileY) * tileSize);
      const ts = Math.ceil(tileSize);

      const visible = isVisible(tx, ty);
      const explored = isExplored(tx, ty);

      if (!explored) {
        // Pure black fog — not yet visited
        ctx.fillStyle = '#000';
        ctx.fillRect(sx, sy, ts, ts);
        continue;
      }

      // Draw the tile
      const tile = tileAt(tx, ty);
      ctx.fillStyle = TILE_COLOR[tile.type] || '#222';
      ctx.fillRect(sx, sy, ts, ts);

      if (zoom > 0.6) {
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx + 0.5, sy + 0.5, ts - 1, ts - 1);
      }

      // Progress bar
      if (tile.progress > 0) {
        const maxP = tile.type === T.TREE ? 4 : tile.type === T.CROP_GROWING ? 30 : 6;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(sx + 2, sy + ts - 6, ts - 4, 4);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx + 2, sy + ts - 6, (ts - 4) * (tile.progress / maxP), 4);
      }

      if (zoom > 0.5 && TILE_ICONS[tile.type]) {
        ctx.font = `${tileSize * 0.6}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(TILE_ICONS[tile.type], sx + tileSize/2, sy + tileSize/2);
      }

      // Fog overlay for explored-but-not-visible tiles
      if (!visible) {
        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        ctx.fillRect(sx, sy, ts, ts);
      }
    }
  }

  // Colonists (always visible)
  for (const col of colonists) {
    const sx = Math.round((col.x - camTileX) * tileSize);
    const sy = Math.round((col.y - camTileY) * tileSize);
    if (sx < -tileSize || sx > canvas.width + tileSize) continue;
    if (sy < -tileSize || sy > canvas.height + tileSize) continue;

    const r = tileSize / 3;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + tileSize/2, sy + tileSize - 4*zoom, r, 4*zoom, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = col.color;
    ctx.beginPath();
    ctx.arc(sx + tileSize/2, sy + tileSize/2, r, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (col === selectedColonist) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + tileSize/2, sy + tileSize/2, tileSize/2 - 2, 0, Math.PI*2);
      ctx.stroke();
    }

    if (zoom > 0.5) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(7, 9*zoom)}px JetBrains Mono,monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(col.name.slice(0, 3), sx + tileSize/2, sy + 2);

      const hpct = col.hunger / 100;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(sx + 2, sy, tileSize - 4, 3);
      ctx.fillStyle = hpct > 0.5 ? '#4ade80' : hpct > 0.25 ? '#fbbf24' : '#f87171';
      ctx.fillRect(sx + 2, sy, (tileSize - 4) * hpct, 3);
    }
  }
}

// ─── LOG ─────────────────────────────────────────────────────────────────────
function addLog(msg, type = '') {
  gameLog.unshift({ msg, type, tick });
  if (gameLog.length > 200) gameLog.pop();
  renderLog();
}

function renderLog() {
  const el = document.getElementById('tab-log');
  el.innerHTML = '';
  for (const entry of gameLog.slice(0, 80)) {
    const div = document.createElement('div');
    div.className = 'log-entry' + (entry.type ? ' ' + entry.type : '');
    div.textContent = `[${entry.tick}] ${entry.msg}`;
    el.appendChild(div);
  }
}

function updateResDisplay() {
  document.getElementById('res-food').textContent  = Math.floor(colony.food);
  document.getElementById('res-wood').textContent  = Math.floor(colony.wood);
  document.getElementById('res-stone').textContent = Math.floor(colony.stone);
  document.getElementById('res-iron').textContent  = Math.floor(colony.iron);
}
