# Save to LunaTask — Chrome Extension v2

Select text on any webpage or web app → right-click → save directly to LunaTask.

## Context Menu
- **Save as Note…** → pick a configured note; repeated saves **append** below previous captures
- **Save as Task…** → pick an Area (required) + Goal (optional) + set task name
<img width="1481" height="602" alt="Screenshot_20260411_130545" src="https://github.com/user-attachments/assets/e8f9607c-474d-46f9-a643-17e146ecf3ae" />
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

## Compatibility
Uses **Shadow DOM** for the modal — fully isolated from page styles/scripts. Works on all
pages including SPAs, React/Vue/Angular web apps, Gmail, Notion, Linear, etc.

## Finding UUIDs in LunaTask
- **Note**: Open note → ⋯ → Share/Copy link → extract UUID from URL
- **Area**: Open area → ⋯ → Settings → UUID in URL
- **Goal**: Open goal → ⋯ → Settings → UUID in URL
