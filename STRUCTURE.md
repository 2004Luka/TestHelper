# Quick AI Structure & Zero-Credit Fast Dispatch

> **AI INSTRUCTION:** Read this single file first before touching any code. It gives you the exact file paths and rules for any task in ~400 tokens, eliminating costly searches, greps, and multi-file exploration.

---

## 1. Zero-Credit Fast Dispatch Matrix

Match your task to the problem domain below. Open **ONLY** the designated target files and consult **ONLY** the specified rule file.

| Task Domain | Primary Target Files (Open ONLY these) | Mandatory Rule File |
|:---|:---|:---|
| **Visual, CSS, Theme, Colors, Animations** | `client/src/index.css`<br>`client/src/context/StyleContext.jsx` | `.agents/rules/styles.md` |
| **Georgian / English Translations** | `client/src/translations.js`<br>`client/src/context/LanguageContext.jsx` | — |
| **Frontend Auth & Session** | `client/src/context/AuthContext.jsx`<br>`client/src/pages/Login.jsx`<br>`client/src/pages/Register.jsx` | `triage_decision_tree.md` |
| **Backend Auth & JWT** | `server/controllers/authController.js`<br>`server/controllers/studentAuthController.js`<br>`server/middleware/authMiddleware.js`<br>`server/models/Teacher.js`<br>`server/models/Student.js` | `triage_decision_tree.md` |
| **Quiz Creation & Editing** | `client/src/pages/CreateQuiz.jsx`<br>`client/src/pages/QuizDetail.jsx`<br>`server/controllers/quizController.js`<br>`server/models/Quiz.js` | `triage_decision_tree.md` |
| **Quiz Access & Class Permissions** | `server/utils/quizAccess.js`<br>`client/src/components/QuizAccessControl.jsx`<br>`server/controllers/classController.js` | `learned_preferences.md` (§ Quiz Access) |
| **Quiz Taking & Grading** | `client/src/pages/TakeQuiz.jsx`<br>`server/controllers/submissionController.js`<br>`server/models/Submission.js` | `triage_decision_tree.md` |
| **Comments / Discussion Widget** | `client/src/components/Discussion.jsx`<br>`server/controllers/commentController.js`<br>`server/models/Comment.js` | `triage_decision_tree.md` |
| **Docx Uploads & Parsing** | `client/src/components/FileUpload.jsx`<br>`server/utils/wordParser.js` | — |
| **Teacher Settings & Profile** | `client/src/pages/TeacherSettings.jsx` (dedicated page) | `learned_preferences.md` (§ Settings) |
| **Classes & Student Roster** | `client/src/pages/TeacherStudents.jsx`<br>`server/controllers/classController.js` | — |
| **API Client Network Calls** | `client/src/api/client.js` | — |
| **Server Pipeline & Database Config** | `server/server.js`<br>`server/config/db.js` | — |
| **Architecture / File Tree Updates** | `.agents/rules/codebase_architecture.md`<br>`STRUCTURE.md`<br>`AGENTS.md` | `.agents/rules/auto_update.md` |

---

## 2. Core Architecture at a Glance

- **Client (`client/`):** React 18 SPA bundled with Vite. Single stylesheet `client/src/index.css` contains all design tokens (`:root`), classes, and responsive styles. Context providers (`AuthContext`, `LanguageContext`, `StyleContext`) wrap the app in `main.jsx`.
- **Server (`server/`):** Node.js + Express REST API. Controllers in `server/controllers/`, Mongoose models in `server/models/`, routes in `server/routes/`, auth middleware in `server/middleware/authMiddleware.js`.
- **Database:** MongoDB connected via Mongoose in `server/config/db.js`.

---

## 3. Strict Credit-Saving & Operational Constraints

1. **Slice Line Reads:** ALWAYS use line-range parameters (`StartLine`/`EndLine`) viewing <= 60-80 lines at a time. Never dump entire 300+ line files into context.
2. **Surgical Edits:** Replace only the minimum lines needed for the fix. Never rewrite whole components or entire CSS files.
3. **No Speculative Grep:** Never run recursive search or terminal commands across `node_modules`, `dist`, or the whole repo. Use the matrix above to navigate directly.
4. **Never Read Multiple Rules:** Never load all files in `.agents/rules/` at once. Load ONLY the single rule relevant to your task.
5. **Zero Emojis / AI Icons:** Strictly forbidden anywhere in UI, buttons, tabs, labels, navigation, badges, or translations. Use clean typography and clean SVGs only.
6. **Secret Protection:** NEVER read or touch `.env`, `.env.local`, or any production credential file. Reference only `server/.env.example`.
7. **Keep Updated:** If you create, delete, or rename files, update this file and `.agents/rules/codebase_architecture.md`.

