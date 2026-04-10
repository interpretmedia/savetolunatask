// background.js — LunaTask Extension v2
const API = 'https://api.lunatask.app/v1';

// ── Menus ────────────────────────────────────────────────────────────────
function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'lt-note', title: 'Save as Note…', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'lt-task', title: 'Save as Task…', contexts: ['selection'] });
  });
}
chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

// ── Click handler ────────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { apiToken } = await chrome.storage.sync.get('apiToken');
  if (!apiToken) {
    injectToast(tab.id, '⚠ Set your API token in the extension settings first.', false);
    chrome.runtime.openOptionsPage();
    return;
  }
  sendToContent(tab, {
    type: 'LT_OPEN_MODAL',
    action: info.menuItemId === 'lt-note' ? 'note' : 'task',
    selectedText: info.selectionText || '',
    pageTitle: tab.title || '',
    pageUrl:   tab.url   || ''
  });
});

async function sendToContent(tab, msg) {
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    // Content script not yet injected (e.g., PDF, fresh tab) — inject then retry
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      setTimeout(() => chrome.tabs.sendMessage(tab.id, msg).catch(() => {}), 200);
    } catch (e) {
      injectToast(tab.id, '⚠ Cannot inject into this page.', false);
    }
  }
}

// ── Message router ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'LT_SAVE_NOTE')   { handleSaveNote(msg).then(sendResponse);   return true; }
  if (msg.type === 'LT_SAVE_TASK')   { handleSaveTask(msg).then(sendResponse);   return true; }
  if (msg.type === 'LT_GET_STORAGE') { chrome.storage.sync.get(msg.keys).then(sendResponse); return true; }
  if (msg.type === 'LT_OPEN_OPTIONS') { chrome.runtime.openOptionsPage(); }
});

// ── Save Note (with client-side append) ──────────────────────────────────
async function handleSaveNote(msg) {
  const { apiToken } = await chrome.storage.sync.get('apiToken');
  const { noteId, noteTitle, selectedText, pageTitle, pageUrl } = msg;
  const snippet = buildSnippet(selectedText, pageTitle, pageUrl);

  // Get local cache
  const cacheKey = `nc_${noteId}`;
  const local = await chrome.storage.local.get(cacheKey);
  const existing = local[cacheKey] || '';

  const newContent = existing
    ? existing + '\n\n---\n\n' + snippet
    : snippet;

  // PUT to LunaTask (replaces full content)
  const res = await apiFetch('PUT', `/notes/${noteId}`, apiToken, {
    name:    noteTitle,
    content: newContent
  });

  if (res.ok) {
    // Cache the new content locally
    await chrome.storage.local.set({ [cacheKey]: newContent });
    return { ok: true, appended: !!existing };
  }
  return { ok: false, error: res.error };
}

// ── Save Task ────────────────────────────────────────────────────────────
async function handleSaveTask(msg) {
  const { apiToken } = await chrome.storage.sync.get('apiToken');
  const { taskName, areaId, goalId, selectedText, pageTitle, pageUrl } = msg;
  const body = {
    name:    taskName,
    area_id: areaId,
    note:    buildSnippet(selectedText, pageTitle, pageUrl)
  };
  if (goalId) body.goal_id = goalId;
  const res = await apiFetch('POST', '/tasks', apiToken, body);
  return res;
}

// ── Helpers ──────────────────────────────────────────────────────────────
async function apiFetch(method, path, token, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok || res.status === 204) return { ok: true };
    const txt = await res.text().catch(() => '');
    return { ok: false, error: `HTTP ${res.status}${txt ? ': ' + txt.slice(0, 100) : ''}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function buildSnippet(text, title, url) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `> ${text.replace(/\n/g, '\n> ')}\n\n*${date} — [${title}](${url})*`;
}

async function injectToast(tabId, msg, ok) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (m, o) => window.__ltToast?.(m, o),
      args: [msg, ok]
    });
  } catch {}
}