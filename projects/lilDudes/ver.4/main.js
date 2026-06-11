// ─── GAME LOOP ────────────────────────────────────────────────────────────────
const TICK_MS = [500, 250, 100];
let tickSpeed = 0;
let paused = false;
let tick = 0;
let gameInterval;
const colonists = [];

function gameTick() {
  tick++;
  document.getElementById('tick-display').textContent = `tick: ${tick}`;

  for (const tile of worldOverrides.values()) {
    if (tile.type === T.CROP_GROWING) {
      tile.progress++;
      if (tile.progress > 30) { tile.type = T.CROP_READY; tile.progress = 0; }
    }
  }

  tickColonists();

  // Reveal fog around each colonist each tick
  for (const col of colonists) {
    revealAround(col.x, col.y, FOG_RADIUS);
  }

  updateResDisplay();
  renderColonistList();
}

function renderLoop() {
  handleCamera();
  drawMap();
  requestAnimationFrame(renderLoop);
}

// ─── CONTROLS ─────────────────────────────────────────────────────────────────
document.getElementById('btn-pause').addEventListener('click', () => {
  paused = !paused;
  document.getElementById('btn-pause').textContent = paused ? '▶ Resume' : '⏸ Pause';
});

const speedLabels = ['1×', '2×', '5×'];
document.getElementById('btn-speed').addEventListener('click', () => {
  tickSpeed = (tickSpeed + 1) % 3;
  document.getElementById('btn-speed').textContent = speedLabels[tickSpeed];
  clearInterval(gameInterval);
  gameInterval = setInterval(() => { if (!paused) gameTick(); }, TICK_MS[tickSpeed]);
});

// ─── EDITOR ───────────────────────────────────────────────────────────────────
document.getElementById('btn-apply').addEventListener('click', () => {
  if (!selectedColonist) {
    document.getElementById('run-status').textContent = 'No colonist selected.';
    return;
  }
  selectedColonist.script = document.getElementById('script-editor').value;
  compileScript(selectedColonist);
  document.getElementById('run-status').textContent =
    selectedColonist.scriptError ? '⚠ ' + selectedColonist.scriptError : '✓ Running';
});

document.getElementById('script-editor').addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const el = e.target;
    const start = el.selectionStart, end = el.selectionEnd;
    el.value = el.value.slice(0, start) + '  ' + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + 2;
  }
});

// Sidebar tabs
document.querySelectorAll('.stab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-colonists').style.display = tab.dataset.tab === 'colonists' ? '' : 'none';
    document.getElementById('tab-log').style.display       = tab.dataset.tab === 'log'       ? '' : 'none';
    document.getElementById('tab-docs').style.display      = tab.dataset.tab === 'docs'      ? '' : 'none';
  });
});

// Canvas click
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const tileSize = TS * zoom;
  const camTileX = camera.x / TS;
  const camTileY = camera.y / TS;
  const cx = Math.floor((e.clientX - rect.left) / tileSize + camTileX);
  const cy = Math.floor((e.clientY - rect.top)  / tileSize + camTileY);
  const col = colonists.find(c => c.x === cx && c.y === cy);
  if (col) selectColonist(col);
});

// Zoom scroll wheel
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta));
}, { passive: false });

// ─── HINT FADE ────────────────────────────────────────────────────────────────
const hint = document.getElementById('camera-hint');
setTimeout(() => { hint.style.transition = 'opacity 1s'; hint.style.opacity = '0'; }, 4000);

// ─── INIT ─────────────────────────────────────────────────────────────────────
resizeCanvas();
initStartingArea();

camera.x = -(canvas.width  / 2) + TS / 2;
camera.y = -(canvas.height / 2) + TS / 2;

const c1 = addColonist(0, 0);
const c2 = addColonist(1, 0);

// Reveal starting area for initial colonists
revealAround(0, 0, FOG_RADIUS + 2);

selectColonist(c1);
updateResDisplay();
renderCmdList();
renderDocs();

gameInterval = setInterval(() => { if (!paused) gameTick(); }, TICK_MS[0]);
requestAnimationFrame(renderLoop);

addLog('Colony founded. Select a colonist, pick a template, and apply it!', 'success');
addLog('New colonists are born when the colony has enough food & happiness.', 'info');
