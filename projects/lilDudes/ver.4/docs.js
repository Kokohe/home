// ─── DOCUMENTATION TAB ───────────────────────────────────────────────────────

function renderDocs() {
  const el = document.getElementById('tab-docs');
  if (!el) return;

  el.innerHTML = `
<div class="docs-content">

<div class="docs-section">
  <div class="docs-heading">📜 Script Basics</div>
  <p class="docs-p">Each colonist runs their script <b>every tick</b>. Scripts are plain JavaScript — use any JS logic you like. The script has access to a set of API functions and objects listed below.</p>
</div>

<div class="docs-section">
  <div class="docs-heading">⚙️ Control Flow</div>
  <div class="docs-table">
    <div class="docs-row"><code>if / else</code><span>Branch on conditions</span></div>
    <div class="docs-row"><code>while / for</code><span>Loops (use carefully — infinite loops freeze the tick)</span></div>
    <div class="docs-row"><code>return</code><span>Stop the script early this tick</span></div>
    <div class="docs-row"><code>let / const</code><span>Declare local variables</span></div>
    <div class="docs-row"><code>function</code><span>Define helper functions inside the script</span></div>
  </div>
</div>

<div class="docs-section">
  <div class="docs-heading">🧑 self — The Colonist</div>
  <div class="docs-table">
    <div class="docs-row"><code>self.x, self.y</code><span>Current tile position</span></div>
    <div class="docs-row"><code>self.hunger</code><span>0–100. Drops over time; auto-eats from colony food below 20</span></div>
    <div class="docs-row"><code>self.energy</code><span>0–100. Drains each tick. Replenish with <code>rest()</code></span></div>
    <div class="docs-row"><code>self.carrying</code><span>Resource being carried, or <code>null</code></span></div>
    <div class="docs-row"><code>self.action</code><span>Current action string (read-only, set by API calls)</span></div>
  </div>
</div>

<div class="docs-section">
  <div class="docs-heading">🗺 map — The World</div>
  <div class="docs-table">
    <div class="docs-row"><code>map.get(x, y)</code><span>Returns <code>{type, item, progress}</code> for the tile at (x,y)</span></div>
    <div class="docs-row"><code>map.find(type, radius?)</code><span>Finds nearest tile of the given type within radius (default 20). Returns <code>{x, y, type, …}</code> or <code>null</code>. Type strings: <code>'tree' 'rock' 'ore' 'farmplot' 'crop_ready' 'crop_growing' 'stockpile' 'grass' 'dirt'</code></span></div>
  </div>
</div>

<div class="docs-section">
  <div class="docs-heading">🏘 colony — Shared Resources</div>
  <div class="docs-table">
    <div class="docs-row"><code>colony.food</code><span>Total food stockpiled</span></div>
    <div class="docs-row"><code>colony.wood</code><span>Total wood stockpiled</span></div>
    <div class="docs-row"><code>colony.stone</code><span>Total stone stockpiled</span></div>
    <div class="docs-row"><code>colony.iron</code><span>Total iron stockpiled</span></div>
  </div>
</div>

<div class="docs-section">
  <div class="docs-heading">🚶 Movement</div>
  <div class="docs-table">
    <div class="docs-row"><code>move(x, y)</code><span>Move one step toward world tile (x, y). Call every tick to keep moving.</span></div>
    <div class="docs-row"><code>moveTo(type)</code><span>Find nearest tile of <code>type</code> and step toward it</span></div>
  </div>
</div>

<div class="docs-section">
  <div class="docs-heading">⛏ Work Actions</div>
  <div class="docs-table">
    <div class="docs-row"><code>chop()</code><span>Chop an adjacent or occupied tree. Takes ~4 ticks; yields 3 wood.</span></div>
    <div class="docs-row"><code>mine()</code><span>Mine an adjacent rock or ore. Takes ~5 ticks; yields 2 stone (rock) or 2 iron (ore).</span></div>
    <div class="docs-row"><code>farm()</code><span>On grass/dirt: converts to farmplot. On farmplot: plants crops. Crops grow automatically over ~30 ticks.</span></div>
    <div class="docs-row"><code>harvest()</code><span>Harvest an adjacent <code>crop_ready</code> tile. Yields 5 food.</span></div>
    <div class="docs-row"><code>deposit()</code><span>Deposit carried item at an adjacent stockpile</span></div>
    <div class="docs-row"><code>build()</code><span>Build a wall on adjacent dirt/grass. Costs 2 wood, takes ~6 ticks.</span></div>
    <div class="docs-row"><code>rest()</code><span>Recover 5 energy this tick</span></div>
  </div>
</div>

<div class="docs-section">
  <div class="docs-heading">🎲 Utility</div>
  <div class="docs-table">
    <div class="docs-row"><code>random(n)</code><span>Returns random integer 0 to n-1</span></div>
    <div class="docs-row"><code>log("msg")</code><span>Print a message to the game log</span></div>
  </div>
</div>

<div class="docs-section">
  <div class="docs-heading">💾 state — Persistent Memory</div>
  <p class="docs-p">The <code>state</code> object persists between ticks. Write any properties you need — they survive across script runs for that colonist. Cleared if you re-apply the script.</p>
  <div class="docs-table">
    <div class="docs-row"><code>state.x = 5</code><span>Store any value — numbers, strings, booleans</span></div>
    <div class="docs-row"><code>if (!state.phase) state.phase = 'init'</code><span>Initialise on first tick</span></div>
  </div>
  <p class="docs-p" style="margin-top:6px"><b>Spiral explorer example:</b></p>
  <pre class="docs-pre">if (!state.ring) { state.ring=1; state.side=0; state.pos=0; }
const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
const [dx,dy] = dirs[state.side];
move(self.x+dx, self.y+dy);
state.pos++;
if (state.pos >= state.ring*2) {
  state.pos = 0;
  state.side = (state.side+1) % 4;
  if (state.side === 0) state.ring++;
}</pre>
</div>


  <p class="docs-p">Each colonist reveals a <b>${FOG_RADIUS}-tile</b> radius around them. Explored tiles are remembered but appear darker when no colonist is nearby. Send an Explorer into the dark to uncover new terrain.</p>
</div>

<div class="docs-section">
  <div class="docs-heading">⚡ Command Scripts</div>
  <p class="docs-p">Command scripts run <b>once instantly</b> when you click Run. Assign them to specific colonists (or all). Use them to issue one-off orders: rally to a position, emergency harvest, etc. The same API is available.</p>
</div>

<div class="docs-section">
  <div class="docs-heading">💡 Tips</div>
  <p class="docs-p">• Scripts run <b>every tick</b> — avoid infinite loops.<br>
  • <code>return</code> early to skip the rest of the script when a condition is met.<br>
  • Check <code>self.energy</code> before heavy work — exhausted colonists waste ticks.<br>
  • <code>map.find()</code> searches an area each call — cache the result in a variable if you call it multiple times in one tick.<br>
  • Colonists are born naturally — keep <code>colony.food</code> high.</p>
</div>

</div>`;
}
