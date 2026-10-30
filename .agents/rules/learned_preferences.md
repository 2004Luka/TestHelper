# Learned Preferences & Corrections Log

This file captures patterns learned from user feedback, corrections, and preferences. The AI MUST consult this before generating code or making decisions to avoid repeating past mistakes and to match the user's working style.

> **How this works:** After the user corrects the AI or expresses a preference, the AI should append it to the appropriate section below using the `/learn` command or by updating this file directly.

---

## User Preferences

### General
- User prefers concise responses — no filler or disclaimers.
- User values credit/token efficiency — avoid unnecessary file reads, recursive directory searches, and multi-file dumps.
- User wants the AI to check scope (style vs client vs server) BEFORE doing anything.
- User wants AI to use `STRUCTURE.md` for fast onboarding with minimal token consumption.
- User wants rules to be modular: load ONLY the rule needed for the task, never all rule files simultaneously.

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

### [2026-10-26] - Strict Prohibition of AI Icons and Emojis
- **What the AI did wrong:** Added emojis/AI icons (e.g. 🎓, 👨‍🏫, 🏫, 🌐, 🔒, 🟢, 🔴, 🚀, 📝, 👥, 🗑) across navigation, buttons, tab titles, and badges.
- **What the user wanted instead:** Zero AI icons or emojis anywhere in the application. Clean, elegant, professional typography and clean SVGs or text only.
- **Rule learned:** NEVER use emojis or AI icons in UI buttons, titles, navigation, badges, or translation texts. Keep the design minimalist, professional, and emoji-free.

### [2026-10-26] - Quiz Access & Permissions Priority Hierarchy
- **What the AI did wrong:** Contradictory permission checks: tests that were publicly closed (`isActive: false`) remained closed to assigned class students, and opening a whole class did not clear student-level blocks, leaving individual students locked out.
- **What the user wanted instead:** A strictly unified priority hierarchy where:
  1. Opening a class opens access for all students in that class, immediately clearing any individual student blocks so no student remains disabled.
  2. Publicly closed tests (`isActive: false`) remain accessible to assigned classes and individually permitted students.
  3. All access checkpoints (access control list, student portal list, quiz taking, submission grading) must use the identical evaluation logic with zero contradictions.
### [2026-10-26] - Full Page for Settings Over Popups/Modals
- **What the AI did wrong:** Created a small floating modal dialog for profile and settings, which overlapped dashboard content and looked cramped.
- **What the user wanted instead:** A dedicated, full-page route (`/settings`) for profile, registration link, and settings with spacious layout and clean structure.
- **Rule learned:** Always prefer dedicated full pages (`/settings`) for core configuration, profile, and settings rather than cramped popup modals, unless a tiny confirmation dialog is specifically requested.

### [2026-10-28] - Maximally Low Credits & Fast Structure Navigation
- **What the AI did wrong:** Wasted excessive credits and tokens by reading entire files, scanning directories, and loading multiple rule files simultaneously.
- **What the user wanted instead:** Maximum token and credit efficiency: fast onboarding via `STRUCTURE.md`, direct line-range file inspection, modular rule loading (only the 1 relevant rule file), and keeping all rule files updated.
- **Rule learned:** Never load all rule files at once. Use `STRUCTURE.md` to find the exact target file and load ONLY the single matching rule file for the task. Always view <= 60-80 lines at a time.

---

## Do's & Don'ts (Accumulated)

### Always Do [REQUIRED]
- Open [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md) first to get instant file paths and eliminate token-burning searches.
- Check scope triage (style/client/server) before touching any files.
- Load ONLY the single relevant rule file matching the task domain.
- Use `StartLine`/`EndLine` when viewing files > 60 lines (target <= 60-80 lines).
- Use `edit_file` / `replace_file_content` with minimal diffs, not full rewrites.
- Animate `background-position` for repeating dot grids / particle meshes.
- Oversize ambient glow containers (`-25vmax`) to prevent edge cutoffs.
- Provide clickable file links in all responses.
- Keep architecture docs in sync after structural changes (`STRUCTURE.md` and `codebase_architecture.md`).
- Consult `styles.md` before any CSS/visual work.

### Never Do [PROHIBITED]
- Never read `.env`, `.env.local`, or `.env.production`.
- Never use emojis or AI icons anywhere in UI components, buttons, tabs, badges, translation files, or rule files.
- Never load all rule files into context simultaneously.
- Never open server files for a styling problem.
- Never open client/CSS files for an API/DB problem.
- Never dump entire large files into view.
- Never create separate CSS files — everything goes in `index.css`.
- Never hardcode color/size values in JSX inline styles.
- Never search `node_modules/` or `dist/`.
