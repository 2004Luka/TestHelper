# Credit & Token Optimization Guidelines

To minimize credit/token consumption and maximize AI speed and execution efficiency, all AI agents operating in this repository MUST adhere to these optimization standards:

---

## 1. Zero Unnecessary File Views
- **Never dump whole files:** Always supply line-range parameters (`StartLine` and `EndLine` in `read_file` or `view_file`) on files with more than 60 lines. Target <= 60-80 lines per read.
- **Never re-read unchanged files:** If a file was viewed or edited in previous steps, do not re-read it unless essential to verify a critical change.
- **Inspect before search:** Consult [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md) for direct file paths instead of performing expensive multi-file grep, glob, or find searches.
- **Never inspect dependency or lock files:** Never read `node_modules/`, `package-lock.json`, build outputs, or media bundles.

---

## 2. Modular Rule Loading (Zero-Credit Rule Usage)
- **Do NOT load all rules at once:** The `.agents/rules/` directory is modular. Loading all 7 rule files consumes thousands of unnecessary tokens.
- **Load ONLY the domain rule:**
  - Styling -> `styles.md`
  - Unclear scope -> `triage_decision_tree.md`
  - Structural change -> `auto_update.md`
  - User feedback / correction -> `learned_preferences.md`
  - Credentials / secrets -> `security.md`
- If a task is straightforward (e.g., fixing a simple typo or single logic bug where paths are known), do not read rule files at all.

---

## 3. Surgical, Targeted Edits (Save Tokens & Prevent Regressions)
- **Use minimal diffs:** Use `edit_file` or `replace_file_content` with minimal target chunks. Never rewrite an entire component to modify 5 lines.
- **Avoid rewrite cycles:** Plan changes before editing to avoid making consecutive corrections to the same block.

---

## 4. Scope Isolation (Zero Cross-Talk)
- **Do not read outside the problem domain:**
  - If a CSS button color is wrong, do NOT inspect `server/server.js` or `package.json`.
  - If a JWT token expiration fails, do NOT inspect `client/src/index.css` or React UI components.
- Sticking strictly to the problem domain saves up to 80% of tokens per request.

---

## 5. Terminal & Output Discipline
- Keep command outputs compact: avoid commands that list entire trees recursively or output thousands of lines.
- Never use shell search across the entire project root when the exact path is already documented in [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md).

---

## 6. Response Brevity
- Keep explanations direct, concise, and focused on what was changed and why.
- Avoid repetitive disclaimers, conversational fluff, or reproducing unchanged file code in chat.
- Always provide clickable markdown file links (`[filename](file:///...)`).
