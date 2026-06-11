// ─── COLONIST STATE ───────────────────────────────────────────────────────────
let colId = 0;
let selectedColonist = null;

const NAMES  = ['Ren','Ora','Sev','Kipp','Vex','Mira','Dax','Juno','Pell','Crow'];
const COLORS  = ['#4ade80','#fb923c','#60a5fa','#f472b6','#a78bfa','#34d399','#fbbf24','#f87171','#67e8f9','#c084fc'];

const DEFAULT_SCRIPT =
`// This colonist does nothing yet.
// Select them and write a script, or use Templates.
rest();`;

function addColonist(spawnX, spawnY) {
  const id = colId++;
  const sx = spawnX !== undefined ? spawnX : Math.floor(Math.random()*4) - 2;
  const sy = spawnY !== undefined ? spawnY : Math.floor(Math.random()*3) - 1;
  const col = {
    id,
    name: NAMES[id % NAMES.length],
    color: COLORS[id % COLORS.length],
    x: sx, y: sy,
    hunger: 80, energy: 100,
    carrying: null,
    script: DEFAULT_SCRIPT,
    scriptFn: null, scriptError: null,
    action: 'idle',
    logBuffer: [],
    state: {}
  };
  compileScript(col);
  colonists.push(col);
  renderColonistList();
  addLog(`${col.name} joined the colony.`, 'success');
  return col;
}

function renderColonistList() {
  const el = document.getElementById('tab-colonists');
  el.innerHTML = '';
  for (const col of colonists) {
    const card = document.createElement('div');
    card.className = 'colonist-card' + (col === selectedColonist ? ' selected' : '');
    const errDot = col.scriptError
      ? '<span style="color:#f87171;font-size:10px"> ⚠ error</span>' : '';
    card.innerHTML = `
      <div class="col-name" style="color:${col.color}">${col.name}${errDot}</div>
      <div class="col-status">${col.action}${col.carrying ? ' · carrying ' + col.carrying : ''}</div>
      <div class="need-label"><span>hunger</span><span>${Math.floor(col.hunger)}%</span></div>
      <div class="need-bar"><div class="need-fill" style="width:${col.hunger}%;background:${col.hunger>50?'#4ade80':col.hunger>25?'#fbbf24':'#f87171'}"></div></div>
      <div class="need-label"><span>energy</span><span>${Math.floor(col.energy)}%</span></div>
      <div class="need-bar"><div class="need-fill" style="width:${col.energy}%;background:#60a5fa"></div></div>`;
    card.addEventListener('click', () => selectColonist(col));
    el.appendChild(card);
  }
}

function selectColonist(col) {
  selectedColonist = col;
  document.getElementById('editor-colonist-name').textContent = col.name;
  document.getElementById('script-editor').value = col.script;
  document.getElementById('run-status').textContent = col.scriptError ? '⚠ ' + col.scriptError : '';
  renderColonistList();
  drawMap();
}
