# Learned Preferences & Corrections Log

This file captures patterns learned from user feedback, corrections, and preferences. The AI MUST consult this before generating code or making decisions to avoid repeating past mistakes and to match the user's working style.

> **How this works:** After the user corrects the AI or expresses a preference, the AI should append it to the appropriate section below using the `/learn` command or by updating this file directly.

---

## User Preferences

### General
- User prefers concise responses — no filler or disclaimers.
- User values credit/token efficiency — avoid unnecessary file reads and rewrites.
- User wants the AI to check scope (style vs client vs server) BEFORE doing anything.

### Code Style
- All CSS goes in a single `index.css` file — no CSS modules, no styled-components, no Tailwind.
- Use CSS custom properties (`var(--token)`) for all design values — never hardcode colors/sizes.
- React components use functional components with hooks — no class components.
- Georgian (`ka`) is the default language, English (`en`) is secondary.

### Workflow
- User wants auto-update behavior: when files change, keep architecture docs in sync.
- User wants a learning file that evolves based on their corrections.
- User prefers surgical, scoped changes over full file rewrites.

---

## Corrections History

<!-- 
Format for new entries:
### [DATE] - Brief description
- **What the AI did wrong:** ...
- **What the user wanted instead:** ...
- **Rule learned:** ...
-->

_No corrections logged yet. Entries will be added as the user provides feedback._

---

## Do's & Don'ts (Accumulated)

### Always Do ✅
- Check scope triage (style/client/server) before touching any files.
- Use `StartLine`/`EndLine` when viewing files > 60 lines.
- Use `replace_file_content` with minimal diffs, not full rewrites.
- Provide clickable file links in all responses.
- Keep architecture docs in sync after structural changes.
- Consult `styles.md` before any CSS/visual work.

### Never Do ❌
- Never read `.env`, `.env.local`, or `.env.production`.
- Never open server files for a styling problem.
- Never open client/CSS files for an API/DB problem.
- Never dump entire large files into view.
- Never create separate CSS files — everything goes in `index.css`.
- Never hardcode color/size values in JSX inline styles.
- Never search `node_modules/` or `dist/`.
