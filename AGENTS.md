# Agent Guidelines & Operational Rules

> **FAST START:** For immediate zero-credit routing and instant file targets, read [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md) first. Never perform broad searches or load all rules simultaneously.

## 1. Environment & Secret Protection
- **Strict Prohibition on Secret Files:** NEVER read, view, search, edit, or touch `.env`, `.env.local`, `.env.production`, or any file containing private credentials, API keys, or production secrets.
- **Use Template Files Exclusively:** ONLY inspect, reference, or modify `.env.example` or documentation template files.
- **Instruct the User for Secrets:** If a new environment variable or configuration key is needed, document it in `.env.example` and instruct the user to configure it in their `.env` file manually.

---

## 2. Strict Prohibition on Emojis & AI Icons
- **Zero Emojis / AI Icons:** NEVER use emojis or AI icon decorations (e.g. 🎓, 👨‍🏫, 🏫, 🌐, 🔒, 🟢, 🔴, 🚀, 📝, 👥, 🗑, etc.) anywhere in UI components, buttons, tabs, labels, navigation links, badges, or translation files.
- **Professional Typography:** Use clean typography, text labels, and clean SVGs only if an icon is required. Never use emojis as iconography.

---

## 3. Mandatory Scope Triage (Execute Before Any Action)

Before viewing or editing files, the AI MUST classify the user's request using the following logic and strictly limit its inspection to that subsystem:

```
IF (request is visual, CSS, theme, colors, layout, animations, or styling) {
    // STYLE PROBLEM
    TARGET_PATHS:
      - client/src/index.css
      - client/src/context/StyleContext.jsx
    RULE: Do NOT inspect or modify server files or backend routes.
    RULE: Only modify React components if adding CSS class names or inline style tokens.
}
ELSE IF (request is React UI state, forms, user interaction, routing, or client-side logic) {
    // CLIENT PROBLEM
    TARGET_PATHS:
      - client/src/components/
      - client/src/pages/
      - client/src/context/ (AuthContext.jsx, LanguageContext.jsx, StyleContext.jsx)
      - client/src/api/
    RULE: Do NOT inspect or modify server routes, controllers, or database models.
}
ELSE IF (request is API endpoint, Express route, controller, Mongoose model, database query, or backend auth) {
    // SERVER PROBLEM
    TARGET_PATHS:
      - server/controllers/
      - server/routes/
      - server/models/
      - server/middleware/
      - server/server.js
    RULE: Do NOT touch client/src/ or frontend CSS stylesheets.
}
ELSE {
    // FULL-STACK / END-TO-END FEATURE
    WORKFLOW:
      1. Inspect API contract / backend implementation in server/ first.
      2. Connect frontend integration in client/src/ second.
      3. Strictly touch only the specific files required for the feature.
}
```

---

## 4. Token & Credit Optimization Rules (Cost Efficiency)
- **Targeted Line Views:** NEVER view entire large files. ALWAYS use line-range parameters (`StartLine` and `EndLine` in `read_file` or `view_file`) to inspect only the relevant slice (<= 60-80 lines at a time).
- **Surgical Edits:** Use `edit_file` or `replace_file_content` with minimal target chunks. Never rewrite whole files to adjust a few lines.
- **Zero Speculative Searching:** Do not perform broad directory grep/find searches across `node_modules`, `build`, or unrelated folders. Navigate directly to known paths via [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md).
- **Concise Outputs:** Avoid conversational filler, disclaimers, or echoing entire unchanged files in responses. State what was done, link files, and stop.
- **No Redundant Steps:** Once a bug or feature is resolved, complete the task immediately rather than executing unnecessary verification loops.

---

## 5. Codebase Navigation Map

- **Instant Structure & Dispatch:** [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md) — read first for any task
- **Styles & Themes:** [index.css](file:///d:/TESTGENERATOR/client/src/index.css), [StyleContext.jsx](file:///d:/TESTGENERATOR/client/src/context/StyleContext.jsx) — consult [styles.md](file:///d:/TESTGENERATOR/.agents/rules/styles.md) first
- **Languages & Translations:** [translations.js](file:///d:/TESTGENERATOR/client/src/translations.js), [LanguageContext.jsx](file:///d:/TESTGENERATOR/client/src/context/LanguageContext.jsx)
- **Auth & Sessions:** [AuthContext.jsx](file:///d:/TESTGENERATOR/client/src/context/AuthContext.jsx), [authMiddleware.js](file:///d:/TESTGENERATOR/server/middleware/authMiddleware.js)
- **Frontend Pages & Routes:** [App.jsx](file:///d:/TESTGENERATOR/client/src/App.jsx), [pages/](file:///d:/TESTGENERATOR/client/src/pages/)
- **Backend API & Logic:** [server.js](file:///d:/TESTGENERATOR/server/server.js), [routes/](file:///d:/TESTGENERATOR/server/routes/), [controllers/](file:///d:/TESTGENERATOR/server/controllers/), [models/](file:///d:/TESTGENERATOR/server/models/)
- **Detailed Rules Directory:** [.agents/rules/](file:///d:/TESTGENERATOR/.agents/rules/)

---

## 6. Targeted Rule Loading (Zero-Credit Rule Execution)

Do NOT read all rule files at once. Load ONLY the specific rule matching your active domain:

| Domain | Consult This Rule Only |
|:---|:---|
| Styling, layout, theme tokens, animations | [.agents/rules/styles.md](file:///d:/TESTGENERATOR/.agents/rules/styles.md) |
| Ambiguous scope triage & boundaries | [.agents/rules/triage_decision_tree.md](file:///d:/TESTGENERATOR/.agents/rules/triage_decision_tree.md) |
| Architecture sync after adding/removing files | [.agents/rules/auto_update.md](file:///d:/TESTGENERATOR/.agents/rules/auto_update.md) |
| User feedback, past corrections, preferences | [.agents/rules/learned_preferences.md](file:///d:/TESTGENERATOR/.agents/rules/learned_preferences.md) |
| Secret protection & credential guidelines | [.agents/rules/security.md](file:///d:/TESTGENERATOR/.agents/rules/security.md) |
| Token / credit minimization details | [.agents/rules/credit_optimization.md](file:///d:/TESTGENERATOR/.agents/rules/credit_optimization.md) |
| Complete workspace directory reference | [.agents/rules/codebase_architecture.md](file:///d:/TESTGENERATOR/.agents/rules/codebase_architecture.md) |

---

## 7. Self-Maintenance Protocol

After ANY task that creates, deletes, or renames files:
1. Update [codebase_architecture.md](file:///d:/TESTGENERATOR/.agents/rules/codebase_architecture.md) and [STRUCTURE.md](file:///d:/TESTGENERATOR/STRUCTURE.md).
2. Update this file's Navigation Map if a primary target file was added/removed.
3. Update [styles.md](file:///d:/TESTGENERATOR/.agents/rules/styles.md) if new CSS tokens were added.
4. See full protocol: [auto_update.md](file:///d:/TESTGENERATOR/.agents/rules/auto_update.md)

---

## 8. Learning & Adaptation

After user corrections or expressed preferences, update [learned_preferences.md](file:///d:/TESTGENERATOR/.agents/rules/learned_preferences.md) with:
- What was corrected and why.
- The rule learned to avoid repeating the mistake.
- Updated Do's & Don'ts if applicable.
