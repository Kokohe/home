const TEMPLATES = {

  'Woodcutter': `// Finds the nearest tree and chops it down.
// Rests when energy is low.
if (self.energy < 20) {
  rest();
} else {
  let tree = map.find('tree');
  if (tree) {
    move(tree.x, tree.y);
    chop();
  } else {
    rest(); // No trees in range
  }
}`,

  'Miner': `// Mines the nearest rock. Prefers ore veins.
if (self.energy < 15) {
  rest();
} else {
  let ore = map.find('ore');
  let target = ore || map.find('rock');
  if (target) {
    move(target.x, target.y);
    mine();
  } else {
    rest();
  }
}`,

  'Farmer': `// Harvests ready crops first, then tends plots.
// Converts grass/dirt into farm plots if needed.
if (self.hunger < 30) {
  // Desperate — harvest anything ready
  let ready = map.find('crop_ready');
  if (ready) { move(ready.x, ready.y); harvest(); return; }
}

let ready = map.find('crop_ready');
if (ready) {
  move(ready.x, ready.y);
  harvest();
} else {
  let plot = map.find('farmplot');
  if (plot) {
    move(plot.x, plot.y);
    farm();
  } else {
    // No plots yet — turn the ground beneath you into one
    farm();
  }
}`,

  'Generalist': `// Reads colony needs and does whatever is most urgent.
if (self.energy < 20) {
  rest();
  return;
}

if (colony.food < 10) {
  let ready = map.find('crop_ready');
  if (ready) { move(ready.x, ready.y); harvest(); }
  else { let p = map.find('farmplot'); if (p) { move(p.x, p.y); farm(); } else farm(); }

} else if (colony.wood < 8) {
  let tree = map.find('tree');
  if (tree) { move(tree.x, tree.y); chop(); }

} else if (colony.stone < 8) {
  let rock = map.find('rock') || map.find('ore');
  if (rock) { move(rock.x, rock.y); mine(); }

} else {
  rest();
}`,

  'Builder': `// Builds walls on adjacent dirt/grass tiles in a pattern.
// Only builds when there is enough wood.
if (self.energy < 15) {
  rest();
} else if (colony.wood >= 4) {
  build(); // Works on adjacent tile
} else {
  // Wait for a woodcutter to supply wood
  rest();
}`,

  'Explorer': `// Seeks unexplored frontier tiles. Picks a new target if blocked.
if (self.energy < 25) { rest(); return; }

// Pick a new frontier target if we don't have one or reached the last one
if (!state.tx || (self.x === state.tx && self.y === state.ty)) {
  state.stuckTicks = 0;
  let frontier = map.find((tile, tx, ty) => {
    return [[1,0],[-1,0],[0,1],[0,-1]].some(([nx,ny]) => !map.get(tx+nx, ty+ny));
  }, 40);
  if (frontier) { state.tx = frontier.x; state.ty = frontier.y; }
}

if (state.tx) {
  const moved = move(state.tx, state.ty);
  if (!moved) {
    state.stuckTicks = (state.stuckTicks || 0) + 1;
    if (state.stuckTicks > 2) {
      // Target is blocked — clear it so we pick a new one next tick
      state.tx = null; state.ty = null; state.stuckTicks = 0;
    }
  } else {
    state.stuckTicks = 0;
  }
}`,

};

// ─── TEMPLATE PICKER UI ───────────────────────────────────────────────────────
let templateOpen = false;
let templatePopup = null;

document.getElementById('btn-template').addEventListener('click', () => {
  if (templateOpen) {
    closeTemplates();
    return;
  }
  templateOpen = true;
  document.getElementById('btn-template').classList.add('active');

  templatePopup = document.createElement('div');
  Object.assign(templatePopup.style, {
    position: 'fixed', bottom: '56px', right: '16px',
    background: 'var(--panel)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '8px', zIndex: '100', minWidth: '170px'
  });

  for (const [name, code] of Object.entries(TEMPLATES)) {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:4px';
    btn.textContent = name;
    btn.addEventListener('click', () => {
      document.getElementById('script-editor').value = code;
      closeTemplates();
    });
    templatePopup.appendChild(btn);
  }
  document.body.appendChild(templatePopup);
});

function closeTemplates() {
  templateOpen = false;
  document.getElementById('btn-template').classList.remove('active');
  if (templatePopup) { templatePopup.remove(); templatePopup = null; }
}
