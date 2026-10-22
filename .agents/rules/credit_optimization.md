# Credit & Token Optimization Guidelines

To minimize credit/token consumption and maximize AI speed and execution efficiency, all AI agents operating in this repository MUST adhere to these optimization standards:

---

## 1. Zero Unnecessary File Views
- **Never dump whole files:** Always supply `StartLine` and `EndLine` parameters when calling `view_file` on files with more than 60 lines.
- **Never re-read unchanged files:** If a file was viewed or edited in previous steps, do not re-read it unless essential to verify a critical change.
- **Inspect before search:** If you already know the path (e.g. `client/src/index.css`), view the targeted section directly instead of performing expensive multi-file grep or glob searches.

---

## 2. Surgical, Targeted Edits (Save Tokens & Prevent Regressions)
- **Use `replace_file_content` with minimal blocks:** Never replace an entire 1000-line file to change 5 lines of code. Keep replacement chunks focused only on the necessary diff.
- **Avoid rewrite cycles:** Plan changes before editing to avoid making consecutive corrections to the same block.

---

## 3. Scope Isolation (Zero Cross-Talk)
- **Do not read outside the problem domain:**
  - If a CSS button color is wrong, do NOT inspect `server/server.js` or `package.json`.
  - If a JWT token expiration fails, do NOT inspect `client/src/index.css` or React UI components.
- Sticking strictly to the problem domain saves up to 80% of tokens per request.

---

## 4. Response Brevity
- Keep explanations direct, concise, and focused on what was changed and why.
- Avoid repetitive disclaimers, conversational fluff, or reproducing unchanged file code in chat.
- Always provide clickable markdown file links (`[filename](file:///...)`).
