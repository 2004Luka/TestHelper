# Style System Rules & Reference

This is the authoritative reference for all AI styling work. Before making ANY visual, CSS, theme, animation, or layout change, the AI MUST read this file to understand the existing design system and follow its conventions.

---

## 1. Design System Overview

**Brand:** QUIZZUP  
**Theme:** Charcoal & Luxury Gold  
**Approach:** CSS custom properties (`:root` variables) in a single `index.css` file, consumed by all components via `var(--token-name)`.  
**State management:** `StyleContext.jsx` handles theme switching (dark/light), persists to `localStorage`, and exposes tokens + helpers.

---

## 2. Token Reference (DO NOT INVENT NEW TOKENS)

All styling MUST use the existing CSS variable tokens defined in `:root` of `index.css`. Do NOT hardcode hex/rgb values in components or inline styles.

### Color Tokens
| Token | Dark Value | Purpose |
|:---|:---|:---|
| `--accent` | `#D4AF37` | Primary brand / CTA color |
| `--accent-hover` | `#E2C15A` | Hover state for accent |
| `--accent-dark` | `#A88920` | Pressed / active accent |
| `--accent-glow` | `rgba(212,175,55,0.2)` | Glow / shadow effects |
| `--accent-subtle` | `rgba(212,175,55,0.08)` | Subtle accent backgrounds |
| `--accent-contrast` | `#111113` | Text on accent backgrounds |

### Background Tokens
| Token | Dark Value | Purpose |
|:---|:---|:---|
| `--bg-primary` | `#101012` | Page background |
| `--bg-secondary` | `#1A1A1D` | Section / sidebar backgrounds |
| `--bg-card` | `rgba(31,31,34,0.94)` | Card surfaces |
| `--bg-card-hover` | `rgba(42,42,46,0.96)` | Card hover state |
| `--bg-glass` | `rgba(255,255,255,0.04)` | Glass/frosted backgrounds |

### Text Tokens
| Token | Dark Value | Purpose |
|:---|:---|:---|
| `--text-primary` | `#F8FAFC` | Headings & body text |
| `--text-secondary` | `#C3C3C8` | Secondary / label text |
| `--text-muted` | `#92929A` | Placeholder / disabled text |

### Status Tokens
| Token | Purpose |
|:---|:---|
| `--status-on` / `--status-on-bg` / `--status-on-border` | Active / enabled states (gold) |
| `--status-off` / `--status-off-bg` / `--status-off-border` | Inactive / disabled states (gray) |

### Semantic Colors
| Token | Value | Purpose |
|:---|:---|:---|
| `--success` | `#34D399` | Success messages / indicators |
| `--error` | `#F87171` | Error messages / destructive actions |
| `--warning` | `#D4AF37` | Warning messages / caution |

### Geometry & Spacing
| Token | Value |
|:---|:---|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |
| `--radius-pill` | `9999px` |

### Shadows
| Token | Purpose |
|:---|:---|
| `--shadow-sm` | Subtle card shadow |
| `--shadow-md` | Elevated card shadow |
| `--shadow-lg` | Modal / overlay shadow |
| `--shadow-glow` | Accent glow effect |

### Transitions
| Token | Value |
|:---|:---|
| `--transition-fast` | `0.15s cubic-bezier(0.4,0,0.2,1)` |
| `--transition-base` | `0.25s cubic-bezier(0.4,0,0.2,1)` |

### Fonts
| Token | Value |
|:---|:---|
| `--font-heading` | `'Outfit', -apple-system, sans-serif` |
| `--font-body` | `'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif` |

---

## 3. Mandatory Rules for Style Changes

### DO [REQUIRED]
- Use `var(--token-name)` for all colors, radii, shadows, fonts, and transitions.
- Add new classes in `index.css` following the existing naming convention (`section-name`, `section-name__element`, `btn-variant`).
- Support both dark and light themes — if adding a new color variable, define it in both `:root` AND `[data-theme="light"]`.
- Use `transition: var(--transition-base)` for hover effects and animations.
- Use `border: 1px solid var(--border-color)` patterns for card and input borders.
- Place ALL new CSS in `index.css` — no separate CSS modules or CSS-in-JS.

### DO NOT [PROHIBITED]
- Never hardcode colors like `color: #D4AF37` in JSX `style={{}}` — always use CSS classes or `var()`.
- Never create new `.css` files. All styles live in `index.css`.
- Never use Tailwind, styled-components, or CSS modules.
- Never remove existing CSS classes without verifying they aren't used by other components.
- Never change `:root` token values without explicit user approval — they are brand constants.
- Never add `!important` unless fixing a z-index stacking bug (document the reason in a comment).

---

## 4. Component Styling Patterns

### Buttons
```css
.btn { /* base button */ }
.btn-primary { background: var(--accent); color: var(--accent-contrast); }
.btn-secondary { background: var(--bg-glass); color: var(--text-primary); }
.btn-sm { /* smaller variant */ }
```

### Cards
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}
.card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-active);
}
```

### Inputs
```css
.input, .textarea, .select {
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-md);
}
```

---

## 5. StyleContext.jsx API Reference

| Export | Type | Description |
|:---|:---|:---|
| `useStyle()` / `useTheme()` | Hook | Returns theme context object |
| `theme` | `'dark' \| 'light'` | Current active theme |
| `isDark` | `boolean` | `true` when dark mode is active |
| `toggleTheme()` | `function` | Switches between dark/light |
| `tokens` | `object` | Current theme's design token values |
| `getBadgeClass(active)` | `function` | Returns correct badge CSS class |
| `getStatusColor(active)` | `function` | Returns on/off status color value |

---

## 6. Files to Touch for Style Work

| File | When to Edit |
|:---|:---|
| `client/src/index.css` | Adding/modifying CSS classes, tokens, or media queries |
| `client/src/context/StyleContext.jsx` | Adding theme state, new token objects, or style utility helpers |
| Component `.jsx` files | ONLY to add/change a `className` prop — never add inline style objects with hardcoded values |
