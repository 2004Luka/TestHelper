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

### Styling & Visuals
- Preserving existing class names, color token names, and texts is strictly required — do not rename or invent arbitrary replacements.
- Ultra-modern UI style: subtle glassmorphism, glowing accents, smooth micro-interactions.
- Animated backgrounds MUST be performance-optimized for low-end devices: use CSS transforms/opacity with `will-change`, GPU acceleration, and `@media (prefers-reduced-motion: reduce)`.
- Full responsiveness across all screen sizes (mobile, tablet, desktop) without broken layouts.

---

## Corrections History

### [2026-10-22] - Background Animation Translation Artifacts
- **What the AI did wrong:** Translated `body::after` grid and `body::before` via `transform: translate(60px, 60px)`, shifting the whole layer sideways and creating a visible cutoff / gap on the left edge.
- **What the user wanted instead:** A truly seamless animated background without whole-canvas shifting or edge inaccuracies.
- **Rule learned:** For pattern/grid animations, always animate `background-position` so patterns tile seamlessly without moving the container element. For ambient glowing gradients, use an oversized container (`inset: -25vmax`) with centered rotation/scaling so edges never clip into view.

### [2026-10-22] - Mobile Background Mask Repeat & Cutoff Seams
- **What the AI did wrong:** Used CSS `mask-image: radial-gradient(...)` on fixed background layers; on mobile browsers, masks default to repeating or suffer GPU texture tile boundary seams, creating an abrupt horizontal cut line.
- **What the user wanted instead:** A seamless continuous background on mobile without horizontal seams or cutoffs.
- **Rule learned:** Never use `mask-image` on large fixed backgrounds. Instead, blend rays into the background using native layered `linear-gradient` color stops (`linear-gradient(180deg, transparent 0%, var(--bg-primary) 80%)`). Disable redundant desktop hero glow boxes on mobile screens.

### [2026-10-22] - Mobile Option Item Text Overflow & Badge Clipping
- **What the AI did wrong:** Long unbroken strings without spaces (e.g. comma-separated lists `ეტრუსკები,ლათინები,საბინები,ლიგურები`) inside flex rows didn't wrap, pushing right-aligned badges (`✓ სწორი პასუხი`) outside the card border.
- **What the user wanted instead:** Long texts should wrap cleanly inside the card without overflowing or pushing badges off-screen.
- **Rule learned:** Always apply `overflow-wrap: anywhere; word-break: break-word; min-width: 0;` to option texts, and allow mobile option containers to wrap (`flex-wrap: wrap`) so badges remain securely nested inside cards.

---

## Do's & Don'ts (Accumulated)

### Always Do ✅
- Check scope triage (style/client/server) before touching any files.
- Use `StartLine`/`EndLine` when viewing files > 60 lines.
- Use `replace_file_content` with minimal diffs, not full rewrites.
- Animate `background-position` for repeating dot grids / particle meshes.
- Oversize ambient glow containers (`-25vmax`) to prevent edge cutoffs.
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
