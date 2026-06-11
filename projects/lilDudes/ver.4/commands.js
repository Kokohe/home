// ─── COMMAND SCRIPTS ─────────────────────────────────────────────────────────
// Scripts you can execute on-demand against selected colonists

let commandScripts = []; // { id, name, script, assignedIds: Set<colonistId> }
let editingCmdId = null;
let cmdIdCounter = 0;

function renderCmdList() {
  const el = document.getElementById('cmd-list');
  if (!el) return;
  el.innerHTML = '';

  if (commandScripts.length === 0) {
    el.innerHTML = '<div class="cmd-empty">No command scripts yet.<br>Click + New to create one.</div>';
    return;
  }

  for (const cmd of commandScripts) {
    const row = document.createElement('div');
    row.className = 'cmd-row';

    const assigned = colonists.filter(c => cmd.assignedIds.has(c.id));
    const assignedText = assigned.length === 0
      ? 'no colonists'
      : assigned.length === colonists.length
        ? 'all colonists'
        : assigned.map(c => c.name).join(', ');

    row.innerHTML = `
      <div class="cmd-row-info">
        <div class="cmd-row-name">${cmd.name}</div>
        <div class="cmd-row-assigned">${assignedText}</div>
      </div>
      <div class="cmd-row-actions">
        <button class="btn btn-sm" data-edit="${cmd.id}">✎</button>
        <button class="btn btn-sm active" data-exec="${cmd.id}">▶ Run</button>
      </div>`;
    el.appendChild(row);
  }

  el.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openCmdModal(parseInt(btn.dataset.edit)));
  });
  el.querySelectorAll('[data-exec]').forEach(btn => {
    btn.addEventListener('click', () => execCmd(parseInt(btn.dataset.exec)));
  });
}

function execCmd(cmdId) {
  const cmd = commandScripts.find(c => c.id === cmdId);
  if (!cmd) return;
  const targets = colonists.filter(c => cmd.assignedIds.has(c.id));
  if (targets.length === 0) {
    addLog(`Command "${cmd.name}": no colonists assigned.`, 'error');
    return;
  }
  let compiled;
  try {
    compiled = new Function(
      'self','map','colony','log',
      'move','moveTo','mine','chop','farm','harvest',
      'deposit','build','rest','random',
      cmd.script
    );
  } catch(e) {
    addLog(`Command "${cmd.name}" compile error: ${e.message}`, 'error');
    return;
  }
  for (const col of targets) {
    const api = makeAPI(col);
    try {
      compiled(
        api.self, api.map, api.colony, api.log,
        api.move, api.moveTo, api.mine, api.chop,
        api.farm, api.harvest, api.deposit, api.build, api.rest, api.random
      );
    } catch(e) {
      addLog(`Command "${cmd.name}" error on ${col.name}: ${e.message}`, 'error');
    }
  }
  addLog(`▶ "${cmd.name}" executed on ${targets.map(c=>c.name).join(', ')}.`, 'success');
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openCmdModal(cmdId) {
  editingCmdId = cmdId !== undefined ? cmdId : null;
  const cmd = editingCmdId !== null ? commandScripts.find(c => c.id === editingCmdId) : null;

  document.getElementById('cmd-modal-title').textContent = cmd ? `Edit: ${cmd.name}` : 'New Command Script';
  document.getElementById('cmd-name-input').value = cmd ? cmd.name : '';
  document.getElementById('cmd-script-editor').value = cmd ? cmd.script : '// Script runs once when executed\nlog("Hello!");';
  document.getElementById('btn-cmd-delete').style.display = cmd ? '' : 'none';

  // Build colonist checkboxes
  const box = document.getElementById('cmd-colonist-checkboxes');
  box.innerHTML = '';
  for (const col of colonists) {
    const label = document.createElement('label');
    label.className = 'cmd-check-label';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = col.id;
    cb.checked = cmd ? cmd.assignedIds.has(col.id) : true;
    label.appendChild(cb);
    const dot = document.createElement('span');
    dot.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;background:${col.color};margin:0 4px`;
    label.appendChild(dot);
    label.appendChild(document.createTextNode(col.name));
    box.appendChild(label);
  }

  // Tab-indent in cmd editor
  document.getElementById('cmd-script-editor').onkeydown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const s = el.selectionStart;
      el.value = el.value.slice(0, s) + '  ' + el.value.slice(el.selectionEnd);
      el.selectionStart = el.selectionEnd = s + 2;
    }
  };

  document.getElementById('cmd-modal').style.display = 'flex';
}

function closeCmdModal() {
  document.getElementById('cmd-modal').style.display = 'none';
  editingCmdId = null;
}

document.getElementById('btn-new-cmd').addEventListener('click', () => openCmdModal());
document.getElementById('btn-cmd-close').addEventListener('click', closeCmdModal);

document.getElementById('btn-cmd-save').addEventListener('click', () => {
  const name = document.getElementById('cmd-name-input').value.trim() || 'Unnamed';
  const script = document.getElementById('cmd-script-editor').value;
  const checked = [...document.querySelectorAll('#cmd-colonist-checkboxes input:checked')];
  const assignedIds = new Set(checked.map(cb => parseInt(cb.value)));

  if (editingCmdId !== null) {
    const cmd = commandScripts.find(c => c.id === editingCmdId);
    if (cmd) { cmd.name = name; cmd.script = script; cmd.assignedIds = assignedIds; }
  } else {
    commandScripts.push({ id: cmdIdCounter++, name, script, assignedIds });
  }
  closeCmdModal();
  renderCmdList();
});

document.getElementById('btn-cmd-delete').addEventListener('click', () => {
  if (editingCmdId !== null) {
    commandScripts = commandScripts.filter(c => c.id !== editingCmdId);
  }
  closeCmdModal();
  renderCmdList();
});

// Close modal on backdrop click
document.getElementById('cmd-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('cmd-modal')) closeCmdModal();
});
