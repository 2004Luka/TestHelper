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
- Preserve the existing visual style, but avoid unnecessary animation. Use simple state transitions and reserve motion for useful loading or status feedback.
- Any remaining motion must respect `prefers-reduced-motion`; do not add animated backgrounds or decorative shimmer/glow effects unless requested.
- Full responsiveness across all screen sizes (mobile, tablet, desktop) without broken layouts.

---

## Corrections History

### [2026-10-22] - Background Animation Translation Artifacts
- **What the AI did wrong:** Translated `body::after` grid and `body::before` via `transform: translate(60px, 60px)`, shifting the whole layer sideways and creating a visible cutoff / gap on the left edge.
- **What the user wanted instead:** A truly seamless animated background without whole-canvas shifting or edge inaccuracies.
- **Rule learned:** Avoid decorative gradient backgrounds and animated grids. If a background needs an overlay, use a flat color layer and keep the image/container stationary.

### [2026-10-22] - Mobile Background Mask Repeat & Cutoff Seams
- **What the AI did wrong:** Used CSS `mask-image: radial-gradient(...)` on fixed background layers; on mobile browsers, masks default to repeating or suffer GPU texture tile boundary seams, creating an abrupt horizontal cut line.
- **What the user wanted instead:** A seamless continuous background on mobile without horizontal seams or cutoffs.
- **Rule learned:** Never use mask images or gradient rays on large fixed backgrounds. Use a flat color overlay, avoid decorative glow boxes, and check image edges at mobile widths.

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

### [2026-11-19] - Use Existing Classes for Tutor Finance
- **What the AI did wrong:** Added a separate custom group workflow for finance instead of using the classes and student roster already maintained in the app.
- **What the user wanted instead:** Show existing classes and their roster automatically, expand a class to see its students, and let the teacher manage billing, payment plans, password reset, and student deletion from that view.
- **Rule learned:** Reuse the app's existing class and student records for tutor finance. Do not add another group-creation flow or ask teachers to re-add students; keep finance actions attached to the existing roster.

### [2026-11-19] - Keep Class Actions and Student Actions Focused
- **What the AI did wrong:** Repeated the destructive student delete action in both the roster row and the student information dialog, and made class cards expand inline rather than opening the requested student popup.
- **What the user wanted instead:** Keep student deletion in the information dialog and make clicking a class card open a dismissible popup listing that class's students.
- **Rule learned:** Avoid duplicating destructive actions across roster and detail views. Make class cards open a keyboard-operable dialog that closes with its close button, Escape, or an outside click.

### [2026-11-19] - Currency Entry and Conversion Clarity
- **What the AI did wrong:** Added an external National Bank of Georgia rate feed and automatic conversion when the user only wanted a same-day estimate and plans to implement conversion later.
- **What the user wanted instead:** Remove the external rate integration and leave currency conversion implementation for later.
- **Rule learned:** Do not connect external rate APIs or auto-convert finance records unless the user explicitly asks for that implementation. Keep requested currency-entry controls and readable native option styling.

### [2026-11-19] - Reduce Unnecessary Motion
- **What the user wanted:** Remove unnecessary animations without changing functionality, and limit the work to styles.
- **Rule learned:** Remove decorative page/modal entrances, shimmer, and glow pulses. Preserve essential loading and status feedback, and keep this work in stylesheets without changing application behavior.

### [2026-11-19] - Independent Student Signup and Multiple Teachers
- **What the user wanted:** Let students register without choosing a teacher, add multiple teachers later, and filter tests by teacher without choosing a group during registration.
- **Rule learned:** Keep teacher enrollment optional and repeatable from the student portal. Scope each teacher's class membership and tests to that teacher, and keep group selection out of student registration.

### [2026-11-20] - Payment Entry Fields
- **What the user wanted:** Record the payment date automatically when a teacher saves a payment, and remove the note field from payment entry and history.
- **Rule learned:** Ask only for the payment amount; stamp the current local date on save and omit payment notes from teacher and student billing views.

### [2026-11-20] - Warm Dark Application Palette
- **What the user wanted:** Apply the reference palette across the app in dark mode, with warm charcoal surfaces and cream/taupe text. Keep cream/white as the common highlight and use the logo's `#FFC700` yellow sparingly for primary actions and important statuses.
- **Rule learned:** For broad palette requests, update shared style tokens and theme token values so all pages stay consistent; use one logo-matched yellow and preserve semantic status colors and existing theme controls.

### [2026-11-20] - Quiz Share Link Controls
- **What the user wanted:** Remove duplicate copy buttons from test views and keep one copy button at the end of the share link.
- **Rule learned:** Show a single copy control next to each quiz share link; avoid duplicate copy actions in headers or card action rows.

### [2026-11-22] - Borderless Section Surfaces
- **What the user corrected:** Visible shape borders around sections were unwanted, in addition to yellow hover glow and hover outlines. They want shadows to separate sections, subtle darkening on hover, and buttons to press down.
- **Rule learned:** Remove visible borders from section and card surfaces while preserving input and button boundaries. Remove decorative hover glows and border changes, retain elevation shadows, darken surfaces slightly on hover, and press buttons downward. Keep keyboard focus indicators visible.

### [2026-11-22] - Button Variant Contrast
- **What the user reported:** Ghost buttons in the quiz editor had dark text on dark surfaces.
- **Rule learned:** Give every button variant an explicit foreground and background color so it does not inherit an unreadable browser default.

---

## Do's & Don'ts (Accumulated)

### Always Do [REQUIRED]
- Open [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md) first to get instant file paths and eliminate token-burning searches.
- Check scope triage (style/client/server) before touching any files.
- Load ONLY the single relevant rule file matching the task domain.
- Use `StartLine`/`EndLine` when viewing files > 60 lines (target <= 60-80 lines).
- Use `edit_file` / `replace_file_content` with minimal diffs, not full rewrites.
- Keep motion limited to essential loading or status feedback; prefer direct transitions for state changes.
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
