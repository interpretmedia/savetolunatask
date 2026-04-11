// content.js — LunaTask Extension v2
// Uses Shadow DOM for full isolation — works on web apps without style conflicts

(function () {
  'use strict';

  // ── Toast (injected outside Shadow DOM for visibility) ─────────────────
  window.__ltToast = function (msg, ok) {
    let t = document.getElementById('__lt_toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.id = '__lt_toast';
    Object.assign(t.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647',
      background: ok ? '#e6f4ea' : '#fce8e6',
      color:      ok ? '#137333' : '#c5221f',
      border:     `1px solid ${ok ? '#ceead6' : '#f5c6c3'}`,
      borderRadius: '8px', padding: '10px 16px',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      fontSize: '13px', fontWeight: '500', lineHeight: '1.4',
      boxShadow: '0 2px 10px rgba(0,0,0,.12)', maxWidth: '280px',
      animation: 'none', transition: 'opacity .25s'
    });
    t.textContent = msg;
    document.documentElement.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t?.remove(), 260); }, 3000);
  };

  // ── Listen for background messages ─────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LT_OPEN_MODAL') openModal(msg);
  });

  // ── Styles (scoped inside Shadow DOM — no leakage) ────────────────────
  const CSS = `
    :host { all: initial; display: block; }

    .overlay {
      position: fixed; inset: 0; z-index: 2147483646;
      background: rgba(32,33,36,.45);
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }

    .modal {
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 10px;
      box-shadow: 0 4px 24px rgba(0,0,0,.18);
      width: 380px;
      max-width: calc(100vw - 32px);
      overflow: hidden;
      animation: slideUp .18s ease;
    }

    .modal-header {
      padding: 14px 16px 12px;
      border-bottom: 1px solid #f1f3f4;
      display: flex; align-items: center; justify-content: space-between;
    }
    .modal-title {
      font-size: 14px; font-weight: 600; color: #202124;
      display: flex; align-items: center; gap: 7px;
    }
    .modal-title svg { flex-shrink: 0; }
    .btn-close {
      background: none; border: none; cursor: pointer; color: #80868b;
      padding: 4px; border-radius: 4px; line-height: 1; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .btn-close:hover { background: #f1f3f4; color: #202124; }

    .preview {
      margin: 12px 16px 0;
      padding: 8px 10px;
      background: #f8f9fa;
      border: 1px solid #e8eaed;
      border-radius: 6px;
      font-size: 12px; color: #5f6368; line-height: 1.5;
      max-height: 60px; overflow: hidden; position: relative;
    }
    .preview::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 20px;
      background: linear-gradient(transparent, #f8f9fa);
    }

    .form { padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 11px; }

    .field { display: flex; flex-direction: column; gap: 4px; }
    .label {
      font-size: 11px; font-weight: 600; color: #5f6368;
      text-transform: uppercase; letter-spacing: .04em;
    }
    .req { color: #d93025; }
    .input, .select {
      background: #fff; border: 1px solid #dadce0; border-radius: 6px;
      padding: 8px 10px; font-size: 13.5px; color: #202124;
      font-family: inherit; outline: none;
      transition: border-color .15s, box-shadow .15s;
    }
    .input:focus, .select:focus {
      border-color: #1a73e8;
      box-shadow: 0 0 0 2px rgba(26,115,232,.15);
    }
    .select {
      cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2380868b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 28px;
    }
    .select option { font-family: inherit; }
    .input.error, .select.error { border-color: #d93025; box-shadow: 0 0 0 2px rgba(217,48,37,.12); }

    .hint {
      font-size: 11px; color: #80868b; line-height: 1.45;
    }
    .hint a { color: #1a73e8; cursor: pointer; text-decoration: underline; }

    .actions {
      display: flex; gap: 8px; padding-top: 2px;
    }
    .btn {
      flex: 1; padding: 9px 16px; border-radius: 6px; font-size: 13.5px;
      font-weight: 500; cursor: pointer; border: 1px solid transparent;
      font-family: inherit; transition: background .15s, border-color .15s;
    }
    .btn-cancel {
      background: #fff; border-color: #dadce0; color: #444746;
    }
    .btn-cancel:hover { background: #f8f9fa; }
    .btn-save {
      background: #1a73e8; color: #fff;
    }
    .btn-save:hover:not(:disabled) { background: #1557b0; }
    .btn-save:disabled { opacity: .5; cursor: not-allowed; }

    .shortcut-hint {
      font-size: 11px; color: #bdc1c6; text-align: center; margin-top: 4px;
    }
    kbd {
      background: #f1f3f4; border: 1px solid #dadce0; border-radius: 3px;
      padding: 1px 4px; font-size: 10px; font-family: inherit; color: #5f6368;
    }

    .append-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #e6f4ea; color: #137333; font-size: 11px; font-weight: 500;
      padding: 2px 7px; border-radius: 99px; border: 1px solid #ceead6;
    }
  `;

  // ── Open Modal ─────────────────────────────────────────────────────────
  async function openModal(msg) {
    // Remove existing
    document.getElementById('__lt_host')?.remove();

    const storage = await chrome.runtime.sendMessage({
      type: 'LT_GET_STORAGE',
      keys: ['notes', 'areas', 'goals']
    });
    const notes = storage.notes || [];
    const areas = storage.areas || [];
    const goals = storage.goals || [];
    const isNote = msg.action === 'note';

    // Shadow DOM host
    const host = document.createElement('div');
    host.id = '__lt_host';
    // Must NOT use document.body — use documentElement so it works in all web apps
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    shadow.appendChild(styleEl);

    // Build HTML
    const container = document.createElement('div');
    container.innerHTML = buildHTML(isNote, msg, notes, areas, goals);
    shadow.appendChild(container);

    // Check local cache for existing note content (to show append badge)
    let cachedNoteContent = '';
    if (isNote && notes.length > 0) {
      const firstNoteId = notes[0].id;
      const local = await chrome.storage.local.get(`nc_${firstNoteId}`);
      cachedNoteContent = local[`nc_${firstNoteId}`] || '';
      updateAppendBadge(shadow, cachedNoteContent);
    }

    // Events
    shadow.querySelector('.btn-close').addEventListener('click', close);
    shadow.querySelector('.btn-cancel').addEventListener('click', close);
    shadow.querySelector('.overlay').addEventListener('click', e => {
      if (e.target === shadow.querySelector('.overlay')) close();
    });

    // Update append badge when note selection changes
    if (isNote) {
      shadow.querySelector('#lt-note-sel')?.addEventListener('change', async (e) => {
        const noteId = e.target.value;
        if (!noteId) return updateAppendBadge(shadow, '');
        const local = await chrome.storage.local.get(`nc_${noteId}`);
        updateAppendBadge(shadow, local[`nc_${noteId}`] || '');
      });
    }

    shadow.querySelector('.btn-save').addEventListener('click', () => doSave(shadow, isNote, msg));

    // Keyboard
    function onKey(e) {
      if (e.key === 'Escape') { close(); }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        shadow.querySelector('.btn-save')?.click();
      }
    }
    document.addEventListener('keydown', onKey);
    host.__ltCleanup = () => document.removeEventListener('keydown', onKey);

    // Focus first field
    setTimeout(() => shadow.querySelector('.input, .select')?.focus(), 40);
  }

  function close() {
    const host = document.getElementById('__lt_host');
    host?.__ltCleanup?.();
    host?.remove();
  }

  function updateAppendBadge(shadow, existing) {
    const badge = shadow.querySelector('#lt-append-badge');
    if (!badge) return;
    badge.style.display = existing ? 'inline-flex' : 'none';
  }

  // ── Build HTML ─────────────────────────────────────────────────────────
  function buildHTML(isNote, msg, notes, areas, goals) {
    const preview = esc(msg.selectedText.slice(0, 200));
    const noItems = isNote ? notes.length === 0 : areas.length === 0;
    const noteOpts = notes.map(n => `<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('');
    const areaOpts = areas.map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
    const goalOpts = goals.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');

    const noteIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;
    const taskIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;

    return `
      <div class="overlay">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              ${isNote ? noteIcon : taskIcon}
              ${isNote ? 'Save as Note' : 'Save as Task'}
              <span class="append-badge" id="lt-append-badge" style="display:none">↩ Will append</span>
            </div>
            <button class="btn-close" aria-label="Close">✕</button>
          </div>

          <div class="preview">${preview}</div>

          <div class="form">
            ${isNote ? `
              <div class="field">
                <label class="label" for="lt-note-sel">Note</label>
                <select class="select" id="lt-note-sel">
                  <option value="">— Select a note —</option>
                  ${noteOpts}
                </select>
                ${noItems
                  ? `<p class="hint">No notes configured. <a id="lt-settings-link">Open Settings</a> to add them.</p>`
                  : `<p class="hint">Selecting the same note repeatedly will append your captures below previous text.</p>`
                }
              </div>
            ` : `
              <div class="field">
                <label class="label" for="lt-task-name">Task Name</label>
                <input class="input" id="lt-task-name" type="text"
                  value="${esc(msg.selectedText.slice(0, 100))}"
                  placeholder="Describe the task…">
              </div>
              <div class="field">
                <label class="label" for="lt-area-sel">Area of Life <span class="req">*</span></label>
                <select class="select" id="lt-area-sel">
                  <option value="">— Select an area —</option>
                  ${areaOpts}
                </select>
                ${noItems
                  ? `<p class="hint">No areas configured. <a id="lt-settings-link">Open Settings</a> to add them.</p>`
                  : ''
                }
              </div>
              <div class="field">
                <label class="label" for="lt-goal-sel">Goal <span style="color:#80868b;font-weight:400;text-transform:none">(optional)</span></label>
                <select class="select" id="lt-goal-sel">
                  <option value="">— No goal —</option>
                  ${goalOpts}
                </select>
              </div>
            `}

            <div class="actions">
              <button class="btn btn-cancel">Cancel</button>
              <button class="btn btn-save">Save to LunaTask</button>
            </div>
            <div class="shortcut-hint">
              <kbd>Esc</kbd> to close &nbsp;·&nbsp; <kbd>${/Mac/.test(navigator.platform) ? '⌘' : 'Ctrl'}</kbd>+<kbd>Enter</kbd> to save
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Save Handler ───────────────────────────────────────────────────────
  async function doSave(shadow, isNote, msg) {
    const btn = shadow.querySelector('.btn-save');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    let res;

    if (isNote) {
      const noteId = shadow.querySelector('#lt-note-sel').value;
      if (!noteId) {
        flash(shadow, '#lt-note-sel');
        btn.disabled = false; btn.textContent = 'Save to LunaTask';
        return;
      }

      // Get note title from configured notes list
      const storage = await chrome.runtime.sendMessage({ type: 'LT_GET_STORAGE', keys: ['notes'] });
      const noteEntry = (storage.notes || []).find(n => n.id === noteId);
      const noteTitle = noteEntry?.name || msg.pageTitle;

      res = await chrome.runtime.sendMessage({
        type: 'LT_SAVE_NOTE',
        noteId, noteTitle,
        selectedText: msg.selectedText,
        pageTitle:    msg.pageTitle,
        pageUrl:      msg.pageUrl
      });

      if (res.ok) {
        close();
        window.__ltToast(res.appended ? '↩ Appended to note!' : '📝 Note saved!', true);
      }
    } else {
      const taskName = shadow.querySelector('#lt-task-name').value.trim();
      const areaId   = shadow.querySelector('#lt-area-sel').value;
      const goalId   = shadow.querySelector('#lt-goal-sel').value;

      if (!taskName) { flash(shadow, '#lt-task-name'); btn.disabled = false; btn.textContent = 'Save to LunaTask'; return; }
      if (!areaId)   { flash(shadow, '#lt-area-sel');  btn.disabled = false; btn.textContent = 'Save to LunaTask'; return; }

      res = await chrome.runtime.sendMessage({
        type: 'LT_SAVE_TASK',
        taskName, areaId, goalId,
        selectedText: msg.selectedText,
        pageTitle:    msg.pageTitle,
        pageUrl:      msg.pageUrl
      });

      if (res.ok) {
        close();
        window.__ltToast('✅ Task saved to LunaTask!', true);
      }
    }

    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = 'Save to LunaTask';
      window.__ltToast(`Error: ${res.error}`, false);
    }
  }

  function flash(shadow, sel) {
    const el = shadow.querySelector(sel);
    if (!el) return;
    el.classList.add('error');
    el.focus();
    setTimeout(() => el.classList.remove('error'), 2000);
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

})();