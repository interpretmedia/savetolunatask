// options.js — LunaTask Settings

// ── Tab switching ──────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab,.panel').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ── Token visibility toggle ────────────────────────────────────────────
document.getElementById('toggleToken').addEventListener('click', () => {
  const inp = document.getElementById('apiToken');
  const btn = document.getElementById('toggleToken');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? 'Show' : 'Hide';
});

// ── State ──────────────────────────────────────────────────────────────
let notes = [], areas = [], goals = [];

// ── Load saved data ────────────────────────────────────────────────────
chrome.storage.sync.get(['apiToken', 'notes', 'areas', 'goals'], data => {
  if (data.apiToken) document.getElementById('apiToken').value = data.apiToken;
  notes = data.notes || [];
  areas = data.areas || [];
  goals = data.goals || [];
  renderAll();
});

function renderAll() {
  render('notes', notes);
  render('areas', areas);
  render('goals', goals);
}

// ── Render list ────────────────────────────────────────────────────────
function render(type, items) {
  const container = document.getElementById(type + '-list');
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = `<div class="empty-msg">No ${type} added yet.</div>`;
    return;
  }
  items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <span class="item-name" title="${esc(item.name)}">${esc(item.name)}</span>
      <span class="item-id" title="${esc(item.id)}">${esc(item.id)}</span>
      <button class="btn-del" data-type="${type}" data-i="${i}" title="Remove">✕</button>
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i), t = btn.dataset.type;
      if (t === 'notes') notes.splice(i, 1), render('notes', notes);
      if (t === 'areas') areas.splice(i, 1), render('areas', areas);
      if (t === 'goals') goals.splice(i, 1), render('goals', goals);
    });
  });
}

// ── Add item ───────────────────────────────────────────────────────────
function addItem(nameId, idId, arr, type) {
  const name = document.getElementById(nameId).value.trim();
  const id   = document.getElementById(idId).value.trim();
  if (!name) { document.getElementById(nameId).focus(); return; }
  if (!id)   { document.getElementById(idId).focus();   return; }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    showStatus(`⚠ "${id}" doesn't look like a valid UUID. Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`, false);
    document.getElementById(idId).focus();
    return;
  }
  if (arr.find(x => x.id === id)) {
    showStatus('⚠ This UUID is already in the list.', false); return;
  }
  arr.push({ name, id });
  render(type, arr);
  document.getElementById(nameId).value = '';
  document.getElementById(idId).value = '';
  document.getElementById(nameId).focus();
}

document.getElementById('note-add').addEventListener('click', () => addItem('note-name', 'note-id', notes, 'notes'));
document.getElementById('area-add').addEventListener('click', () => addItem('area-name', 'area-id', areas, 'areas'));
document.getElementById('goal-add').addEventListener('click', () => addItem('goal-name', 'goal-id', goals, 'goals'));

// Enter key in add forms
[['note-name','note-id','note-add'],
 ['area-name','area-id','area-add'],
 ['goal-name','goal-id','goal-add']].forEach(([name, id, btn]) => {
  [name, id].forEach(fieldId => {
    document.getElementById(fieldId)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById(btn).click();
    });
  });
});

// ── Test connection ────────────────────────────────────────────────────
document.getElementById('pingBtn').addEventListener('click', async () => {
  const token = document.getElementById('apiToken').value.trim();
  const el = document.getElementById('pingResult');
  if (!token) { el.textContent = '⚠ Enter a token first'; el.className = 'ping-msg err'; return; }
  el.textContent = 'Testing…'; el.className = 'ping-msg';
  try {
    // Use tasks list as a connectivity test (ping endpoint may not exist)
    const res = await fetch('https://api.lunatask.app/v1/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      el.textContent = '✓ Connected — token is valid!'; el.className = 'ping-msg ok';
    } else if (res.status === 401) {
      el.textContent = '✗ Invalid token (401 Unauthorized)'; el.className = 'ping-msg err';
    } else {
      el.textContent = `✗ HTTP ${res.status}`; el.className = 'ping-msg err';
    }
  } catch {
    el.textContent = '✗ Network error'; el.className = 'ping-msg err';
  }
});

// ── Save ───────────────────────────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', () => {
  const token = document.getElementById('apiToken').value.trim();
  if (!token) {
    showStatus('⚠ API token is required', false);
    document.getElementById('apiToken').focus(); return;
  }
  chrome.storage.sync.set({ apiToken: token, notes, areas, goals }, () => {
    showStatus('✓ Settings saved!', true);
  });
});

function showStatus(msg, ok) {
  const el = document.getElementById('saveStatus');
  el.textContent = msg;
  el.className = 'save-status show ' + (ok ? 'ok' : 'err');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}