# Save to LunaTask — Chrome Extension v2.1

Select text on any webpage or web app → right-click → save directly to LunaTask.

## Context Menu
- **Save as Note…** → pick a configured note; repeated saves **append** below previous captures
- **Save as Task…** → pick an Area (required) + Goal (optional) + set task name

## Install
1. `chrome://extensions/` → enable **Developer mode**
2. **Load unpacked** → select this folder
3. Click the 🌙 icon → configure settings

## Settings Tabs
| Tab | What to add |
|---|---|
| 🔑 Auth | LunaTask bearer token (Settings → Access Tokens) |
| 📝 Notes | Notes you capture to (label + UUID from LunaTask) |
| 🌿 Areas | Areas of Life (label + UUID — required for tasks) |
| 🎯 Goals | Goals (label + UUID — optional for tasks) |

## Append Behaviour
LunaTask's API is E2E-encrypted — it cannot merge/append server-side (`PUT /v1/notes/:id` replaces
entire content). This extension caches note content in `chrome.storage.local` and appends
new snippets before each PUT. **Use a dedicated capture note** — do not hand-edit it inside
LunaTask, as those edits will be overwritten on the next save from this extension.

## Keyboard Shortcuts (in modal)
- `Esc` — close
- `Ctrl/⌘ + Enter` — save

## Dark Mode
The popup (settings page) and the in-page modal both fully respect `prefers-color-scheme`. If your OS or Chrome is set to dark mode, everything adapts automatically — no toggle needed.

## Compatibility
Uses **Shadow DOM** for the modal — fully isolated from page styles/scripts. Works on all
pages including SPAs, React/Vue/Angular web apps, Gmail, Notion, Linear, etc.

## Finding UUIDs in LunaTask
- **Note**: Open note → ⋯ → Share/Copy link → extract UUID from URL
- **Area**: Open area → ⋯ → Settings → UUID in URL
- **Goal**: Open goal → ⋯ → Settings → UUID in URL


## Toolbar Popup (v2.2)
Single-clicking the extension icon opens a quick panel for the **current tab**.

- Save current page link as **Note**
- Save current page link as **Task**
- Reuses configured Notes / Areas / Goals
- Detects active tab title + URL via Chrome tabs API
