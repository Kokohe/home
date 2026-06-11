// ─── SCRIPT COMPILE ───────────────────────────────────────────────────────────
function compileScript(col) {
  try {
    col.scriptFn = new Function(
      'self','map','colony','log','state',
      'move','moveTo','mine','chop','farm','harvest',
      'deposit','build','rest','random',
      col.script
    );
    col.scriptError = null;
  } catch(e) {
    col.scriptFn = null;
    col.scriptError = e.message;
  }
}

// ─── SCRIPTING API ────────────────────────────────────────────────────────────
function makeAPI(col) {

  function matchType(tile, str) {
    switch(str) {
      case 'tree':         return tile.type === T.TREE;
      case 'rock':         return tile.type === T.ROCK;
      case 'ore':          return tile.type === T.ORE;
      case 'crop_ready':   return tile.type === T.CROP_READY;
      case 'crop_growing': return tile.type === T.CROP_GROWING;
      case 'farmplot':     return tile.type === T.FARMPLOT || tile.type === T.CROP_GROWING || tile.type === T.CROP_READY;
      case 'stockpile':    return tile.type === T.STOCKPILE;
      case 'dirt':         return tile.type === T.DIRT;
      case 'grass':        return tile.type === T.GRASS;
      default: return false;
    }
  }

  const mapAPI = {
    get(x, y) { return isExplored(x, y) ? { ...tileAt(x, y) } : null; },
    find(typeStr, radius = 20) {
      let best = null, bestD = Infinity;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = col.x + dx, ny = col.y + dy;
          if (!isExplored(nx, ny)) continue; // fog of war — can't target unseen tiles
          const t = tileAt(nx, ny);
          const match = (typeof typeStr === 'function')
            ? typeStr(t, nx, ny)
            : matchType(t, typeStr);
          if (match) {
            const d = Math.abs(dx) + Math.abs(dy);
            if (d < bestD) { bestD = d; best = { x: nx, y: ny, ...t }; }
          }
        }
      }
      return best;
    }
  };

  function isPassable(x, y, ignoreColonists) {
    const t = tileAt(x, y).type;
    if (t === T.WALL || t === T.DEEP_ROCK || t === T.ROCK || t === T.TREE) return false;
    if (!ignoreColonists && colonists.some(c => c !== col && c.x === x && c.y === y)) return false;
    return true;
  }

  function stepToward(tx, ty) {
    if (col.x === tx && col.y === ty) return true;

    // BFS — find first step toward target, capped at 200 nodes to stay fast per tick
    const start = `${col.x},${col.y}`;
    const goal  = `${tx},${ty}`;
    const queue = [[col.x, col.y]];
    const prev  = new Map([[start, null]]);
    const DIRS  = [[1,0],[-1,0],[0,1],[0,-1]];
    let found   = false;

    while (queue.length > 0 && prev.size < 200) {
      const [cx, cy] = queue.shift();
      if (cx === tx && cy === ty) { found = true; break; }
      for (const [ddx, ddy] of DIRS) {
        const nx = cx + ddx, ny = cy + ddy;
        const key = `${nx},${ny}`;
        if (prev.has(key)) continue;
        // Allow stepping onto the goal tile even if a colonist stands there
        if (!isPassable(nx, ny, nx === tx && ny === ty)) continue;
        prev.set(key, [cx, cy]);
        queue.push([nx, ny]);
      }
    }

    if (!found) {
      // Completely blocked — try any open neighbour as a nudge
      for (const [ddx, ddy] of DIRS) {
        const nx = col.x + ddx, ny = col.y + ddy;
        if (isPassable(nx, ny, false)) { col.x = nx; col.y = ny; return false; }
      }
      return false;
    }

    // Trace back to find the first step from start
    let cur = [tx, ty];
    while (true) {
      const p = prev.get(`${cur[0]},${cur[1]}`);
      if (`${p[0]},${p[1]}` === start) break;
      cur = p;
    }
    col.x = cur[0];
    col.y = cur[1];
    return false;
  }

  function tryWork(tileTypes, progressMax, onComplete) {
    for (const [dx, dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = col.x + dx, ny = col.y + dy;
      const tile = tileRef(nx, ny); // mutable reference
      if (tileTypes.includes(tile.type)) {
        tile.progress = (tile.progress || 0) + 1;
        if (tile.progress >= progressMax) {
          tile.progress = 0;
          onComplete(tile, nx, ny);
        }
        return true;
      }
    }
    return false;
  }

  return {
    self: col,
    map: mapAPI,
    colony,
    state: col.state,
    log(msg) {
      col.logBuffer.push(String(msg));
      addLog(`[${col.name}] ${msg}`);
    },
    move(x, y) {
      col.action = 'moving';
      const px = col.x, py = col.y;
      stepToward(Math.round(x), Math.round(y));
      return col.x !== px || col.y !== py; // true if actually moved
    },
    moveTo(typeStr) {
      const t = mapAPI.find(typeStr);
      if (!t) return false;
      col.action = 'moving';
      const px = col.x, py = col.y;
      stepToward(t.x, t.y);
      return col.x !== px || col.y !== py;
    },
    mine() {
      col.action = 'mining';
      tryWork([T.ROCK, T.ORE], 5, (tile) => {
        const drop = tile.type === T.ORE ? 'iron' : 'stone';
        tile.type = T.DIRT;
        colony[drop] += 2;
        addLog(`${col.name} mined ${drop}.`, 'info');
      });
    },
    chop() {
      col.action = 'chopping';
      tryWork([T.TREE], 4, (tile) => {
        tile.type = T.DIRT;
        colony.wood += 3;
        addLog(`${col.name} chopped wood.`, 'info');
      });
    },
    farm() {
      col.action = 'farming';
      const tile = tileRef(col.x, col.y);
      if (tile.type === T.GRASS || tile.type === T.DIRT) {
        tile.type = T.FARMPLOT;
      } else if (tile.type === T.FARMPLOT) {
        tile.type = T.CROP_GROWING;
        tile.progress = 0;
      }
    },
    harvest() {
      col.action = 'harvesting';
      tryWork([T.CROP_READY], 1, (tile) => {
        tile.type = T.FARMPLOT;
        colony.food += 5;
        addLog(`${col.name} harvested crops.`, 'success');
      });
    },
    deposit() {
      if (!col.carrying) return;
      for (const [dx, dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) {
        if (tileAt(col.x+dx, col.y+dy).type === T.STOCKPILE) {
          colony[col.carrying] = (colony[col.carrying] || 0) + 1;
          col.carrying = null;
          return;
        }
      }
    },
    build() {
      if (colony.wood < 2) return;
      col.action = 'building';
      tryWork([T.DIRT, T.GRASS], 6, (tile) => {
        tile.type = T.WALL;
        colony.wood -= 2;
        addLog(`${col.name} built a wall.`, 'success');
      });
    },
    rest() {
      col.energy = Math.min(100, col.energy + 5);
      col.action = 'resting';
    },
    random(n) { return Math.floor(Math.random() * n); }
  };
}

// ─── TICK COLONISTS ───────────────────────────────────────────────────────────
function tickColonists() {
  for (const col of colonists) {
    col.action = 'idle';
    col.logBuffer = [];
    col.hunger  = Math.max(0, col.hunger  - 0.2);
    col.energy  = Math.max(0, col.energy  - 0.1);

    if (col.hunger < 20 && colony.food > 0) {
      colony.food--;
      col.hunger = Math.min(100, col.hunger + 25);
    }

    if (col.scriptFn) {
      const api = makeAPI(col);
      try {
        col.scriptFn(
          api.self, api.map, api.colony, api.log, api.state,
          api.move, api.moveTo, api.mine, api.chop,
          api.farm, api.harvest, api.deposit, api.build, api.rest, api.random
        );
        col.scriptError = null;
      } catch(e) {
        col.scriptError = e.message;
      }
    }
  }
}
