// content.js — LunaTask Extension v2.1 (dark mode aware)
(function () {
  'use strict';

  // ── Toast styles injected once into the real document ──────────────────
  function ensureToastStyles() {
    if (document.getElementById('__lt_ts')) return;
    const s = document.createElement('style');
    s.id = '__lt_ts';
    s.textContent = `
      @keyframes __ltFadeOut { to { opacity:0; transform:translateY(4px) } }
      #__lt_toast {
        position:fixed; bottom:20px; right:20px; z-index:2147483647;
        border-radius:8px; padding:10px 16px;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
        font-size:13px; font-weight:500; line-height:1.4;
        box-shadow:0 2px 12px rgba(0,0,0,.15); max-width:280px;
        transition:opacity .25s;
      }
      #__lt_toast.lt-ok  { background:#e6f4ea; color:#137333; border:1px solid #ceead6; }
      #__lt_toast.lt-err { background:#fce8e6; color:#c5221f; border:1px solid #f5c6c3; }
      #__lt_toast.lt-bye { animation:__ltFadeOut .25s ease forwards; }

      @media (prefers-color-scheme: dark) {
        #__lt_toast.lt-ok  { background:#1e3a2a; color:#81c995; border-color:#2d5a3d; }
        #__lt_toast.lt-err { background:#3a1e1e; color:#f28b82; border-color:#5a2d2d; }
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  window.__ltToast = function (msg, ok) {
    ensureToastStyles();
    let t = document.getElementById('__lt_toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.id = '__lt_toast';
    t.className = ok ? 'lt-ok' : 'lt-err';
    t.textContent = msg;
    document.documentElement.appendChild(t);
    setTimeout(() => { t.classList.add('lt-bye'); setTimeout(() => t?.remove(), 260); }, 3000);
  };

  // ── Listen for background messages ─────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LT_OPEN_MODAL') openModal(msg);
  });

  // ── Shadow DOM CSS — light + dark ─────────────────────────────────────
  const CSS = `
    :host { all:initial; display:block; }

    /* ── Tokens ── */
    :host {
      --bg:         #ffffff;
      --bg-surface: #f8f9fa;
      --bg-input:   #ffffff;
      --border:     #dadce0;
      --border-sub: #e8eaed;
      --text:       #202124;
      --text-2:     #5f6368;
      --text-3:     #80868b;
      --accent:     #1a73e8;
      --accent-h:   #1557b0;
      --accent-bg:  rgba(26,115,232,.12);
      --accent-txt: #174ea6;
      --badge-bg:   #e8f0fe;
      --badge-cl:   #1a73e8;
      --badge-bd:   #c5d9fb;
      --append-bg:  #e6f4ea;
      --append-cl:  #137333;
      --append-bd:  #ceead6;
      --callout-bg: #e8f0fe;
      --callout-cl: #174ea6;
      --callout-bd: #c5d9fb;
      --shadow:     0 4px 24px rgba(0,0,0,.18);
      --overlay:    rgba(32,33,36,.45);
      --kbd-bg:     #f1f3f4;
      --kbd-bd:     #dadce0;
      --kbd-cl:     #5f6368;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --bg:         #202124;
        --bg-surface: #292a2d;
        --bg-input:   #292a2d;
        --border:     #3c4043;
        --border-sub: #2d2e31;
        --text:       #e8eaed;
        --text-2:     #9aa0a6;
        --text-3:     #5f6368;
        --accent:     #8ab4f8;
        --accent-h:   #aecbfa;
        --accent-bg:  rgba(138,180,248,.12);
        --accent-txt: #aecbfa;
        --badge-bg:   #1a2744;
        --badge-cl:   #8ab4f8;
        --badge-bd:   #2a4080;
        --append-bg:  #1e3a2a;
        --append-cl:  #81c995;
        --append-bd:  #2d5a3d;
        --callout-bg: #1a2744;
        --callout-cl: #aecbfa;
        --callout-bd: #2a4080;
        --shadow:     0 4px 28px rgba(0,0,0,.5);
        --overlay:    rgba(0,0,0,.6);
        --kbd-bg:     #2d2e31;
        --kbd-bd:     #3c4043;
        --kbd-cl:     #9aa0a6;
      }
    }

    /* ── Animations ── */
    @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { opacity:0; transform:translateY(7px) } to { opacity:1; transform:translateY(0) } }

    /* ── Overlay ── */
    .overlay {
      position:fixed; inset:0; z-index:2147483646;
      background:var(--overlay);
      display:flex; align-items:center; justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
      animation:fadeIn .15s ease;
    }

    /* ── Modal ── */
    .modal {
      background:var(--bg);
      border:1px solid var(--border);
      border-radius:10px;
      box-shadow:var(--shadow);
      width:380px;
      max-width:calc(100vw - 32px);
      overflow:hidden;
      animation:slideUp .18s ease;
      color:var(--text);
    }

    .modal-header {
      padding:13px 15px 11px;
      border-bottom:1px solid var(--border-sub);
      display:flex; align-items:center; justify-content:space-between;
    }
    .modal-title {
      font-size:13.5px; font-weight:600; color:var(--text);
      display:flex; align-items:center; gap:7px;
    }
    .modal-title svg { flex-shrink:0; }
    .btn-close {
      background:none; border:none; cursor:pointer; color:var(--text-3);
      padding:4px; border-radius:4px; line-height:1; font-size:15px;
      display:flex; align-items:center;
      transition:background .15s, color .15s;
    }
    .btn-close:hover { background:var(--bg-surface); color:var(--text); }

    /* ── Preview ── */
    .preview {
      margin:11px 15px 0;
      padding:8px 10px;
      background:var(--bg-surface);
      border:1px solid var(--border-sub);
      border-radius:6px;
      font-size:12px; color:var(--text-2); line-height:1.5;
      max-height:58px; overflow:hidden; position:relative;
    }
    .preview::after {
      content:''; position:absolute; bottom:0; left:0; right:0; height:18px;
      background:linear-gradient(transparent, var(--bg-surface));
    }

    /* ── Form ── */
    .form { padding:11px 15px 15px; display:flex; flex-direction:column; gap:11px; }

    .field { display:flex; flex-direction:column; gap:4px; }
    .label {
      font-size:10.5px; font-weight:600; color:var(--text-2);
      text-transform:uppercase; letter-spacing:.05em;
    }
    .req { color:#e74c3c; }

    .input, .select {
      background:var(--bg-input);
      border:1px solid var(--border);
      border-radius:6px;
      padding:8px 10px;
      font-size:13.5px; color:var(--text);
      font-family:inherit; outline:none;
      transition:border-color .15s, box-shadow .15s;
    }
    .input:focus, .select:focus {
      border-color:var(--accent);
      box-shadow:0 0 0 2px var(--accent-bg);
    }
    .input.error, .select.error {
      border-color:#e74c3c;
      box-shadow:0 0 0 2px rgba(231,76,60,.12);
    }
    .select {
      cursor:pointer; appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2380868b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat:no-repeat; background-position:right 10px center; padding-right:28px;
    }

    .hint { font-size:11.5px; color:var(--text-3); line-height:1.45; }
    .hint a { color:var(--accent); cursor:pointer; text-decoration:underline; }

    /* ── Append badge ── */
    .append-badge {
      display:inline-flex; align-items:center; gap:4px;
      background:var(--append-bg); color:var(--append-cl);
      font-size:10.5px; font-weight:600;
      padding:2px 8px; border-radius:99px; border:1px solid var(--append-bd);
    }

    /* ── Actions ── */
    .actions { display:flex; gap:8px; }
    .btn {
      flex:1; padding:9px 14px; border-radius:6px;
      font-size:13.5px; font-weight:500; cursor:pointer;
      border:1px solid transparent; font-family:inherit;
      transition:background .15s, border-color .15s;
    }
    .btn-cancel {
      background:var(--bg); border-color:var(--border); color:var(--text-2);
    }
    .btn-cancel:hover { background:var(--bg-surface); }
    .btn-save { background:var(--accent); color:#fff; }
    .btn-save:hover:not(:disabled) { background:var(--accent-h); }
    .btn-save:disabled { opacity:.5; cursor:not-allowed; }

    /* ── Shortcut hint ── */
    .shortcut-hint {
      font-size:11px; color:var(--text-3); text-align:center;
    }
    kbd {
      background:var(--kbd-bg); border:1px solid var(--kbd-bd);
      border-radius:3px; padding:1px 5px; font-size:10px;
      font-family:inherit; color:var(--kbd-cl);
    }
  `;

  // ── Open Modal ─────────────────────────────────────────────────────────
  async function openModal(msg) {
    document.getElementById('__lt_host')?.remove();

    const storage = await chrome.runtime.sendMessage({
      type: 'LT_GET_STORAGE', keys: ['notes', 'areas', 'goals']
    });
    const notes  = storage.notes  || [];
    const areas  = storage.areas  || [];
    const goals  = storage.goals  || [];
    const isNote = msg.action === 'note';

    const host = document.createElement('div');
    host.id = '__lt_host';
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    shadow.appendChild(styleEl);

    const container = document.createElement('div');
    container.innerHTML = buildHTML(isNote, msg, notes, areas, goals);
    shadow.appendChild(container);

    // Update append badge on note select change
    if (isNote) {
      const sel = shadow.querySelector('#lt-note-sel');
      sel?.addEventListener('change', async e => {
        const id = e.target.value;
        if (!id) { updateBadge(shadow, false); return; }
        const local = await chrome.storage.local.get(`nc_${id}`);
        updateBadge(shadow, !!(local[`nc_${id}`]));
      });
      // Init badge for first option
      if (notes.length) {
        const local = await chrome.storage.local.get(`nc_${notes[0].id}`);
        updateBadge(shadow, !!(local[`nc_${notes[0].id}`]));
      }
    }

    shadow.querySelector('.btn-close').addEventListener('click', close);
    shadow.querySelector('.btn-cancel').addEventListener('click', close);
    shadow.querySelector('.overlay').addEventListener('click', e => {
      if (e.target === shadow.querySelector('.overlay')) close();
    });
    shadow.querySelector('.btn-save').addEventListener('click', () => doSave(shadow, isNote, msg));
    shadow.querySelector('#lt-settings-link')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'LT_OPEN_OPTIONS' }); close();
    });

    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) shadow.querySelector('.btn-save')?.click();
    }
    document.addEventListener('keydown', onKey);
    host.__ltCleanup = () => document.removeEventListener('keydown', onKey);

    setTimeout(() => shadow.querySelector('.select, .input')?.focus(), 40);
  }

  function close() {
    const h = document.getElementById('__lt_host');
    h?.__ltCleanup?.(); h?.remove();
  }

  function updateBadge(shadow, show) {
    const b = shadow.querySelector('#lt-badge');
    if (b) b.style.display = show ? 'inline-flex' : 'none';
  }

  // ── Build HTML ─────────────────────────────────────────────────────────
  function buildHTML(isNote, msg, notes, areas, goals) {
    const preview  = esc(msg.selectedText.slice(0, 200));
    const noItems  = isNote ? !notes.length : !areas.length;
    const noteOpts = notes.map(n => `<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('');
    const areaOpts = areas.map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
    const goalOpts = goals.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');

    const icoNote = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;
    const icoTask = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;

    return `<div class="overlay"><div class="modal">
      <div class="modal-header">
        <div class="modal-title">
          ${isNote ? icoNote : icoTask}
          ${isNote ? 'Save as Note' : 'Save as Task'}
          <span class="append-badge" id="lt-badge" style="display:none">↩ Will append</span>
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
            <p class="hint">
              ${noItems
                ? `No notes configured yet. <a id="lt-settings-link">Open Settings</a> to add them.`
                : `Selecting the same note again will append below previous captures.`}
            </p>
          </div>
        ` : `
          <div class="field">
            <label class="label" for="lt-task-name">Task Name</label>
            <input class="input" id="lt-task-name" type="text"
              value="${esc(msg.selectedText.slice(0, 100))}" placeholder="Describe the task…">
          </div>
          <div class="field">
            <label class="label" for="lt-area-sel">Area of Life <span class="req">*</span></label>
            <select class="select" id="lt-area-sel">
              <option value="">— Select an area —</option>
              ${areaOpts}
            </select>
            ${noItems ? `<p class="hint">No areas configured. <a id="lt-settings-link">Open Settings</a> to add them.</p>` : ''}
          </div>
          <div class="field">
            <label class="label" for="lt-goal-sel">
              Goal <span style="font-weight:400;text-transform:none;color:var(--text-3)">(optional)</span>
            </label>
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
        <p class="shortcut-hint">
          <kbd>Esc</kbd> close &nbsp;·&nbsp;
          <kbd>${/Mac/.test(navigator.platform) ? '⌘' : 'Ctrl'}</kbd>+<kbd>Enter</kbd> save
        </p>
      </div>
    </div></div>`;
  }

  // ── Save ───────────────────────────────────────────────────────────────
  async function doSave(shadow, isNote, msg) {
    const btn = shadow.querySelector('.btn-save');
    btn.disabled = true; btn.textContent = 'Saving…';
    let res;

    if (isNote) {
      const noteId = shadow.querySelector('#lt-note-sel').value;
      if (!noteId) { flash(shadow, '#lt-note-sel'); reset(btn); return; }
      const storage = await chrome.runtime.sendMessage({ type: 'LT_GET_STORAGE', keys: ['notes'] });
      const entry = (storage.notes || []).find(n => n.id === noteId);
      res = await chrome.runtime.sendMessage({
        type: 'LT_SAVE_NOTE', noteId,
        noteTitle:    entry?.name || msg.pageTitle,
        selectedText: msg.selectedText,
        pageTitle:    msg.pageTitle,
        pageUrl:      msg.pageUrl
      });
      if (res.ok) { close(); window.__ltToast(res.appended ? '↩ Appended to note!' : '📝 Note saved!', true); }
    } else {
      const taskName = shadow.querySelector('#lt-task-name').value.trim();
      const areaId   = shadow.querySelector('#lt-area-sel').value;
      const goalId   = shadow.querySelector('#lt-goal-sel').value;
      if (!taskName) { flash(shadow, '#lt-task-name'); reset(btn); return; }
      if (!areaId)   { flash(shadow, '#lt-area-sel');  reset(btn); return; }
      res = await chrome.runtime.sendMessage({
        type: 'LT_SAVE_TASK', taskName, areaId, goalId,
        selectedText: msg.selectedText, pageTitle: msg.pageTitle, pageUrl: msg.pageUrl
      });
      if (res.ok) { close(); window.__ltToast('✅ Task saved to LunaTask!', true); }
    }

    if (!res.ok) { reset(btn); window.__ltToast(`Error: ${res.error}`, false); }
  }

  function reset(btn) { btn.disabled = false; btn.textContent = 'Save to LunaTask'; }
  function flash(shadow, sel) {
    const el = shadow.querySelector(sel);
    if (!el) return;
    el.classList.add('error'); el.focus();
    setTimeout(() => el.classList.remove('error'), 2000);
  }
  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
})();