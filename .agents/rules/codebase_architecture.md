# Codebase Architecture & File System Directory Guide

This document defines the file system structure, subsystem responsibilities, and routing boundaries for seamless AI navigation.

---

## Workspace Layout Overview

```
TESTGENERATOR/
├── .agents/                        # AI rules, custom skills, and behavior configs
│   └── rules/
│       ├── auto_update.md          # Auto-sync protocol for architecture docs
│       ├── codebase_architecture.md # This file — file map & boundaries
│       ├── credit_optimization.md  # Token & credit saving guidelines
│       ├── learned_preferences.md  # Living log of user corrections & preferences
│       ├── security.md             # Secret protection rules (.env prohibition)
│       ├── styles.md               # Style system tokens, conventions & rules
│       └── triage_decision_tree.md # Style vs Client vs Server scope isolation
├── AGENTS.md                       # Root instructions loaded by AI agents every turn
├── client/                         # Frontend SPA (Vite + React 18 + Vanilla CSS)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js           # Axios/Fetch endpoint helpers
│   │   ├── components/
│   │   │   ├── Discussion.jsx      # Comment / discussion widget
│   │   │   ├── FileUpload.jsx      # File upload input component
│   │   │   ├── Logo.jsx            # QUIZZUP brand logo
│   │   │   ├── ProtectedRoute.jsx  # Auth-gated route wrapper
│   │   │   ├── QuizPreview.jsx     # Quiz card preview widget
│   │   │   └── QuizSettings.jsx    # Quiz configuration panel
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Authentication & user session state
│   │   │   ├── LanguageContext.jsx  # Georgian ('ka') / English ('en') i18n
│   │   │   └── StyleContext.jsx    # Theme mode, design tokens, badge helpers
│   │   ├── pages/
│   │   │   ├── CreateQuiz.jsx      # Quiz creation form page
│   │   │   ├── Dashboard.jsx       # Teacher dashboard & analytics
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Login.jsx           # Teacher login form
│   │   │   ├── QuizDetail.jsx      # Quiz detail & management view
│   │   │   ├── Register.jsx        # Teacher registration form
│   │   │   └── TakeQuiz.jsx        # Student quiz-taking interface
│   │   ├── App.jsx                 # Navigation, routing, and layout shell
│   │   ├── index.css               # Unified QUIZZUP design system & CSS variables
│   │   ├── main.jsx                # React DOM root & provider wrapper tree
│   │   └── translations.js         # Ka/En locale dictionaries
│   └── package.json
├── server/                         # Backend API (Node.js + Express + MongoDB)
│   ├── config/
│   │   └── db.js                   # MongoDB connection setup
│   ├── controllers/
│   │   ├── authController.js       # Register, login, token refresh logic
│   │   ├── commentController.js    # Discussion/comment CRUD
│   │   ├── quizController.js       # Quiz CRUD & file-based generation
│   │   └── submissionController.js # Student submission handling & grading
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification & request auth guard
│   │   └── errorHandler.js         # Global error handling middleware
│   ├── models/
│   │   ├── Comment.js              # Comment/Discussion Mongoose schema
│   │   ├── Quiz.js                 # Quiz Mongoose schema
│   │   ├── Submission.js           # Student submission Mongoose schema
│   │   └── Teacher.js              # Teacher/User Mongoose schema
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/* route definitions
│   │   ├── commentRoutes.js        # /api/comments/* route definitions
│   │   ├── quizRoutes.js           # /api/quiz/* route definitions
│   │   └── submissionRoutes.js     # /api/submissions/* route definitions
│   ├── uploads/                    # Temporary file upload storage
│   ├── utils/
│   │   └── wordParser.js           # .docx/.doc parsing utility
│   ├── server.js                   # Express server bootstrap & middleware pipeline
│   ├── .env.example                # Environment variable template (SAFE TO READ)
│   └── package.json
└── netlify.toml                    # Netlify deployment config
```

---

## Directory Responsibilities & Quick Navigation

| Problem Domain | Primary Target Files | Secondary References |
|:---|:---|:---|
| **Styles & Themes** | `client/src/index.css`, `client/src/context/StyleContext.jsx` | `.agents/rules/styles.md`, relevant component JSX |
| **Internationalization (i18n)** | `client/src/translations.js`, `client/src/context/LanguageContext.jsx` | Relevant page/component |
| **Authentication (Frontend)** | `client/src/context/AuthContext.jsx`, `client/src/pages/Login.jsx` | `client/src/components/ProtectedRoute.jsx` |
| **Authentication (Backend)** | `server/controllers/authController.js`, `server/middleware/authMiddleware.js` | `server/models/Teacher.js` |
| **Quiz CRUD** | `server/controllers/quizController.js`, `server/models/Quiz.js` | `client/src/pages/CreateQuiz.jsx`, `QuizDetail.jsx` |
| **Student Submissions** | `server/controllers/submissionController.js`, `server/models/Submission.js` | `client/src/pages/TakeQuiz.jsx` |
| **Comments / Discussion** | `server/controllers/commentController.js`, `server/models/Comment.js` | `client/src/components/Discussion.jsx` |
| **File Uploads & Parsing** | `server/utils/wordParser.js`, `client/src/components/FileUpload.jsx` | `server/uploads/` |
| **API Client (Frontend)** | `client/src/api/client.js` | — |
| **Environment Variables** | `server/.env.example` (NEVER open `.env`) | — |
| **AI Rules & Behavior** | `.agents/rules/*.md`, `AGENTS.md` | `.agents/rules/learned_preferences.md` |
