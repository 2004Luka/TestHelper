# Request Triage & Scope Isolation Protocol

Before executing ANY file inspection, search, or modification, the AI agent MUST categorize the incoming user prompt using the following decision tree and strictly isolate its actions to the matching subsystem.

---

## 1. Scope Decision Tree (IF / ELSE IF / ELSE)

```
IF (Request is purely visual, layout, color, responsiveness, animation, or CSS related) {
    CLASSIFICATION: STYLE_PROBLEM;
    TARGET_DIRECTORY: client/src/index.css, client/src/context/StyleContext.jsx;
    FORBIDDEN_ACTIONS: Do NOT touch server/ or backend files; do NOT modify React logic unless adding className/style props.
}
ELSE IF (Request is UI state, frontend routing, form inputs, React hooks, or client-side rendering) {
    CLASSIFICATION: CLIENT_PROBLEM;
    TARGET_DIRECTORY: client/src/components/, client/src/pages/, client/src/context/, client/src/api/;
    FORBIDDEN_ACTIONS: Do NOT touch server/ routes, controllers, or database models. Do NOT read backend files unless verifying an API contract payload.
}
ELSE IF (Request is API endpoints, database queries, authentication tokens, file uploads, or backend business logic) {
    CLASSIFICATION: SERVER_PROBLEM;
    TARGET_DIRECTORY: server/controllers/, server/routes/, server/models/, server/middleware/, server/server.js;
    FORBIDDEN_ACTIONS: Do NOT touch client/src/ or frontend CSS files. Do NOT inspect UI components.
}
ELSE (Request requires an end-to-end full-stack feature touching both DB/API and UI) {
    CLASSIFICATION: FULL_STACK_FEATURE;
    WORKFLOW:
      Step 1: Implement/adjust backend in server/ first.
      Step 2: Connect frontend in client/src/ using targeted edits.
      Step 3: Restrict touches strictly to the relevant files.
}
```

---

## 2. Partition Rules

### Style Partition (`client/src/index.css`, `client/src/context/StyleContext.jsx`)
- **Permitted Files:**
  - `client/src/index.css` (tokens, themes, component classes, media queries)
  - `client/src/context/StyleContext.jsx` (theme state, design tokens, badge styles)
- **Constraint:** Never open backend files (`server/*`) for styling bugs. If a style fix only needs a CSS class adjustment, do not edit backend or core state logic.

### Client Partition (`client/src/`)
- **Permitted Files:**
  - Components: `client/src/components/`
  - Pages: `client/src/pages/`
  - Contexts: `client/src/context/` (`AuthContext.jsx`, `LanguageContext.jsx`, `StyleContext.jsx`)
  - API Client: `client/src/api/`
- **Constraint:** Fix frontend state, prop passing, form handling, and render logic inside `client/`. Never rewrite server controllers for a client-side rendering issue.

### Server Partition (`server/`)
- **Permitted Files:**
  - Routes: `server/routes/`
  - Controllers: `server/controllers/`
  - Models: `server/models/`
  - Middleware: `server/middleware/`
  - Entry point: `server/server.js`
  - Templates: `server/.env.example`
- **Constraint:** NEVER open `.env` or sensitive secret files. Only look at backend code for server, database, or API route problems.
