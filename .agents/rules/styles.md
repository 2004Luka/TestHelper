# Style System Rules & Reference

This is the authoritative reference for all AI styling work. Before making ANY visual, CSS, theme, animation, or layout change, the AI MUST read this file to understand the existing design system and follow its conventions.

---

## 1. Design System Overview

**Brand:** QUIZZUP  
**Theme:** Warm Charcoal, Cream, Taupe & Soft Yellow
**Approach:** CSS custom properties (`:root` variables) in a single `index.css` file, consumed by all components via `var(--token-name)`.  
**State management:** `StyleContext.jsx` handles theme switching (dark/light), persists to `localStorage`, and exposes tokens + helpers.

---

## 2. Token Reference (DO NOT INVENT NEW TOKENS)

All styling MUST use the existing CSS variable tokens defined in `:root` of `index.css`. Do NOT hardcode hex/rgb values in components or inline styles.

### Color Tokens
| Token | Dark Value | Purpose |
|:---|:---|:---|
| `--accent` | `#F0ECE2` | General emphasis, links, and selected controls |
| `--accent-hover` | `#FBF8F0` | Hover state for general emphasis |
| `--accent-dark` | `#D2CABC` | Pressed / active neutral accent |
| `--accent-glow` | `transparent` | Kept transparent; avoid glow effects |
| `--accent-subtle` | `rgba(240,236,226,0.06)` | Subtle neutral accent backgrounds |
| `--accent-contrast` | `#171512` | Text on accent backgrounds |

### Background Tokens
| Token | Dark Value | Purpose |
|:---|:---|:---|
| `--bg-primary` | `#171513` | Page background |
| `--bg-secondary` | `#151311` | Slightly darker section / sidebar surfaces |
| `--bg-card` | `#141210` | Slightly darker card surfaces |
| `--bg-card-hover` | `#12100E` | Slightly darker hover surface |
| `--bg-glass` | Same as `--bg-card` | Compatibility alias; no glass styling |
| `--bg-glass-hover` | `#12100E` | Compatibility alias for the darker hover surface |

### Text Tokens
| Token | Dark Value | Purpose |
|:---|:---|:---|
| `--text-primary` | `#F7F2E8` | Headings & body text |
| `--text-secondary` | `#C9C1B5` | Secondary / label text |
| `--text-muted` | `#A49A8E` | Placeholder / disabled text |

### Status Tokens
| Token | Purpose |
|:---|:---|
| `--status-on` / `--status-on-bg` / `--status-on-border` | Active / enabled states (yellow) |
| `--status-off` / `--status-off-bg` / `--status-off-border` | Inactive / disabled states (gray) |

### Semantic Colors
| Token | Value | Purpose |
|:---|:---|:---|
| `--success` | `#34D399` | Success messages / indicators |
| `--error` | `#F87171` | Error messages / destructive actions |
| `--warning` | `#FFC700` | Rare priority emphasis and warning states |

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
| `--shadow-glow` | `none` |

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
- Keep cream/white as the common highlight; reserve yellow for primary actions and a few important status or warning states.
- Keep section and card surfaces close to the page color, without visible shape borders; use the larger dark shadow for separation. Keep borders on inputs and buttons. Do not use gradients, glass effects, hover outlines, hover lifts, or decorative hover glows. Darken surfaces subtly on hover and press buttons downward when activated. Keep keyboard focus indicators visible.
- Add new classes in `index.css` following the existing naming convention (`section-name`, `section-name__element`, `btn-variant`).
- Support both dark and light themes — if adding a new color variable, define it in both `:root` AND `[data-theme="light"]`.
- Use `transition: var(--transition-base)` for direct hover and state feedback.
- Avoid decorative entrance effects, shimmer, and pulsing glow animations. Keep motion for useful loading or status feedback, and respect `prefers-reduced-motion`.
- Use `border: 1px solid var(--border-color)` patterns for card and input borders.
- Place ALL new CSS in `index.css` — no separate CSS modules or CSS-in-JS.

### DO NOT [PROHIBITED]
- Never hardcode accent colors in JSX `style={{}}` — always use CSS classes or `var()`.
- Never create new `.css` files. All styles live in `index.css`.
- Never use Tailwind, styled-components, or CSS modules.
- Never remove existing CSS classes without verifying they aren't used by other components.
- Never change `:root` token values without explicit user approval — they are brand constants.
- Never add `!important` unless fixing a z-index stacking bug (document the reason in a comment).

---

## 4. Component Styling Patterns

### Buttons
```css
.btn {
  /* Base button */
  box-shadow: var(--shadow-md);
}
.btn-primary {
  background: var(--warning);
  color: var(--accent-contrast);
  box-shadow: var(--shadow-md);
}
.btn:hover:not(:disabled) { transform: none; }
.btn:active:not(:disabled) { transform: translateY(3px); box-shadow: var(--shadow-sm); }
.btn-secondary { background: var(--bg-card); color: var(--text-primary); }
.btn-sm { /* smaller variant */ }
```

### Cards
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-base);
}
.card:hover {
  background: var(--bg-card);
  border-color: var(--border-color);
  box-shadow: var(--shadow-lg);
}
```

### Inputs
```css
.input, .textarea, .select {
  background: var(--bg-primary);
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
