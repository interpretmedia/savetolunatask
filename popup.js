let notes = [], areas = [], goals = [];
let currentTab = null;
let currentMode = 'note';
const el = id => document.getElementById(id);
async function init() { bindUI(); await loadStorage(); await loadCurrentTab(); renderLists(); updateMode(); }
function bindUI() {
  el('modeNote').addEventListener('click', () => { currentMode = 'note'; updateMode(); });
  el('modeTask').addEventListener('click', () => { currentMode = 'task'; updateMode(); });
  el('saveBtn').addEventListener('click', saveCurrentPage);
  el('openSettings').addEventListener('click', () => chrome.runtime.openOptionsPage());
  el('reloadPageInfo').addEventListener('click', loadCurrentTab);
  el('noteSel').addEventListener('change', updateAppendHint);
}
async function loadStorage() { const data = await chrome.storage.sync.get(['notes','areas','goals']); notes = data.notes || []; areas = data.areas || []; goals = data.goals || []; }
async function loadCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  currentTab = tabs && tabs[0] ? tabs[0] : null;
  const title = currentTab?.title || 'Unable to detect page title';
  const url = currentTab?.url || 'Unable to detect URL';
  el('pageTitle').textContent = title; el('pageUrl').textContent = url;
  if (!el('taskName').value || el('taskName').dataset.autofill !== 'manual') { el('taskName').value = title; el('taskName').dataset.autofill = 'auto'; }
  el('taskName').addEventListener('input', () => { el('taskName').dataset.autofill = 'manual'; }, { once: true });
}
function renderLists() {
  el('noteSel').innerHTML = '<option value="">— Select a note —</option>' + notes.map(n => `<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('');
  el('areaSel').innerHTML = '<option value="">— Select an area —</option>' + areas.map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
  el('goalSel').innerHTML = '<option value="">— No goal —</option>' + goals.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
  updateAppendHint();
}
function updateMode() {
  const isNote = currentMode === 'note';
  el('modeNote').classList.toggle('active', isNote); el('modeTask').classList.toggle('active', !isNote);
  el('panelNote').classList.toggle('hidden', !isNote); el('panelTask').classList.toggle('hidden', isNote);
}
async function updateAppendHint() {
  const noteId = el('noteSel').value;
  if (!noteId) { el('appendHint').style.display = 'none'; return; }
  const local = await chrome.storage.local.get(`nc_${noteId}`);
  el('appendHint').style.display = local[`nc_${noteId}`] ? 'block' : 'none';
}
async function saveCurrentPage() {
  clearStatus();
  if (!currentTab?.url) return showStatus('Unable to read current page URL.', false);
  const title = currentTab.title || currentTab.url;
  const url = currentTab.url;
  const btn = el('saveBtn'); btn.disabled = true; btn.textContent = 'Saving…';
  try {
    let res;
    if (currentMode === 'note') {
      const noteId = el('noteSel').value;
      if (!noteId) { flash(el('noteSel')); return resetBtn(); }
      const entry = notes.find(n => n.id === noteId);
      res = await chrome.runtime.sendMessage({ type: 'LT_SAVE_NOTE', noteId, noteTitle: entry?.name || title, selectedText: `[${title}](${url})`, pageTitle: title, pageUrl: url });
      if (res.ok) showStatus(res.appended ? 'Appended page link to note.' : 'Saved page link to note.', true); else showStatus(`Error: ${res.error}`, false);
    } else {
      const taskName = el('taskName').value.trim() || title;
      const areaId = el('areaSel').value; const goalId = el('goalSel').value;
      if (!areaId) { flash(el('areaSel')); return resetBtn(); }
      res = await chrome.runtime.sendMessage({ type: 'LT_SAVE_TASK', taskName, areaId, goalId, selectedText: `[${title}](${url})`, pageTitle: title, pageUrl: url });
      if (res.ok) showStatus('Saved page link as task.', true); else showStatus(`Error: ${res.error}`, false);
    }
  } catch (e) { showStatus(`Error: ${e.message}`, false); } finally { resetBtn(); }
}
function resetBtn() { el('saveBtn').disabled = false; el('saveBtn').textContent = 'Save to LunaTask'; }
function showStatus(msg, ok) { const s = el('status'); s.textContent = msg; s.className = 'status show ' + (ok ? 'ok' : 'err'); }
function clearStatus() { el('status').className = 'status'; el('status').textContent = ''; }
function flash(node) { node.classList.add('error'); node.focus(); setTimeout(() => node.classList.remove('error'), 1600); }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
document.addEventListener('DOMContentLoaded', init);
