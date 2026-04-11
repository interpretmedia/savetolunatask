// background.js — LunaTask Extension v2.3
const API = 'https://api.lunatask.app/v1';

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'lt-note', title: 'Save as Note…', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'lt-task', title: 'Save as Task…', contexts: ['selection'] });
  });
}
chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { apiToken } = await chrome.storage.sync.get('apiToken');
  if (!apiToken) {
    injectToast(tab?.id, '⚠ Set your API token in the extension options first.', false);
    chrome.runtime.openOptionsPage();
    return;
  }
  sendToContent(tab, {
    type: 'LT_OPEN_MODAL',
    action: info.menuItemId === 'lt-note' ? 'note' : 'task',
    selectedText: info.selectionText || '',
    pageTitle: tab?.title || '',
    pageUrl: tab?.url || ''
  });
});

async function sendToContent(tab, msg) {
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      setTimeout(() => chrome.tabs.sendMessage(tab.id, msg).catch(() => {}), 200);
    } catch {
      injectToast(tab?.id, '⚠ Cannot inject into this page.', false);
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'LT_SAVE_NOTE') { handleSaveNote(msg).then(sendResponse); return true; }
  if (msg.type === 'LT_SAVE_TASK') { handleSaveTask(msg).then(sendResponse); return true; }
  if (msg.type === 'LT_GET_STORAGE') { chrome.storage.sync.get(msg.keys).then(sendResponse); return true; }
  if (msg.type === 'LT_OPEN_OPTIONS') { chrome.runtime.openOptionsPage(); }
});

async function handleSaveNote(msg) {
  const { apiToken } = await chrome.storage.sync.get('apiToken');
  const { noteId, noteTitle, selectedText, pageTitle, pageUrl } = msg;
  const snippet = buildSnippet(selectedText, pageTitle, pageUrl);
  const cacheKey = `nc_${noteId}`;
  const local = await chrome.storage.local.get(cacheKey);
  const existing = local[cacheKey] || '';
  const newContent = existing ? existing + '\n\n---\n\n' + snippet : snippet;
  const res = await apiFetch('PUT', `/notes/${noteId}`, apiToken, { name: noteTitle, content: newContent });
  if (res.ok) {
    await chrome.storage.local.set({ [cacheKey]: newContent });
    return { ok: true, appended: !!existing };
  }
  return { ok: false, error: res.error };
}

async function handleSaveTask(msg) {
  const { apiToken } = await chrome.storage.sync.get('apiToken');
  const { taskName, areaId, goalId, selectedText, pageTitle, pageUrl } = msg;
  const body = { name: taskName, area_id: areaId, note: buildSnippet(selectedText, pageTitle, pageUrl) };
  if (goalId) body.goal_id = goalId;
  return await apiFetch('POST', '/tasks', apiToken, body);
}

async function apiFetch(method, path, token, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok || res.status === 204) return { ok: true };
    const txt = await res.text().catch(() => '');
    return { ok: false, error: `HTTP ${res.status}${txt ? ': ' + txt.slice(0, 120) : ''}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function buildSnippet(text, title, url) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `> ${String(text).replace(/\n/g, '\n> ')}\n\n*${date} — [${title}](${url})*`;
}

async function injectToast(tabId, msg, ok) {
  if (!tabId) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, func: (m, o) => window.__ltToast?.(m, o), args: [msg, ok] });
  } catch {}
}
