# Auto-Update & Self-Maintenance Protocol

This rule defines how the AI agent keeps project documentation and architecture files in sync with actual codebase changes.

---

## 1. Trigger Conditions (When to Auto-Update)

After completing ANY task that modifies the file system structure, the AI MUST check whether these documentation files need updating:

```
IF (a new file or directory was CREATED or DELETED or RENAMED) {
    UPDATE: .agents/rules/codebase_architecture.md
      - Add/remove the file from the Workspace Layout tree
      - Add/remove from the Directory Responsibilities table if it's a key file
    UPDATE: STRUCTURE.md
      - Add/remove from the Zero-Credit Fast Dispatch Matrix if it's a primary file
    UPDATE: AGENTS.md § Codebase Navigation Map
      - Add/remove file links if the file is a primary target for any subsystem
}

IF (a new .md rule file was CREATED in .agents/rules/) {
    UPDATE: .agents/rules/codebase_architecture.md
      - Add to the .agents/rules/ tree listing with a short description
    UPDATE: AGENTS.md § Codebase Navigation Map
      - Reference the new rule in the Detailed Rules Directory note
}

IF (a new context file was CREATED in client/src/context/) {
    UPDATE: .agents/rules/codebase_architecture.md
      - Add to the context/ subtree
    UPDATE: AGENTS.md § Scope Triage
      - Include the new context in the appropriate CLIENT_PROBLEM target path list
    UPDATE: main.jsx
      - Wrap the new Provider in the provider tree if applicable
}

IF (a new route file was CREATED in server/routes/) {
    UPDATE: .agents/rules/codebase_architecture.md
      - Add to the server/routes/ subtree
}

IF (a new page was CREATED in client/src/pages/) {
    UPDATE: .agents/rules/codebase_architecture.md
      - Add to the pages/ subtree
    UPDATE: client/src/App.jsx
      - Add route if applicable (verify with user first)
}

IF (new CSS tokens were ADDED to :root in index.css) {
    UPDATE: .agents/rules/styles.md
      - Add the new tokens to the appropriate Token Reference table
    IF (dark-only token added) {
        UPDATE: index.css [data-theme="light"] block
          - Add a corresponding light-mode override
    }
}

IF (StyleContext.jsx exports changed) {
    UPDATE: .agents/rules/styles.md § StyleContext.jsx API Reference
      - Reflect new exports, hooks, or helper functions
}
```

---

## 2. What NOT to Auto-Update

- Do NOT update documentation for internal logic changes that don't affect the file tree or public API surface.
- Do NOT update if only the content of an existing file changed (e.g., bug fix inside a controller) without adding/removing files.
- Do NOT auto-update `package.json` dependency listings in architecture docs — those change too frequently.

---

## 3. Update Format

When updating `codebase_architecture.md`, follow these conventions:
- Use the exact same indentation and tree characters (`├──`, `│   `, `└──`) as the existing tree.
- Keep descriptions as brief trailing comments after `#`.
- Alphabetize files within their directory level.

When updating `AGENTS.md`, keep edits surgical — only add/remove the specific line or link, never rewrite the entire section.

---

## 4. Verification Step

After performing auto-updates, do a quick mental check:
1. Does the tree in `codebase_architecture.md` match the actual file system?
2. Are all context providers listed in the triage decision tree?
3. Are all rule `.md` files listed in the tree?

If any mismatch is found, fix it in the same edit pass.
