<div align="center">

<img src="https://img.shields.io/badge/CapTrack-Capstone%20Project%20Monitor-6366f1?style=for-the-badge&logo=checkmarx&logoColor=white" alt="CapTrack" />

<br /><br />

[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br />

**CapTrack** is a full-stack Capstone Project Monitoring System built for Fr. CRIT, designed to streamline the entire capstone lifecycle — from team registration and mentor assignment to milestone tracking, submission reviews, and institutional reporting.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Security](#-security)

</div>

---

## 📋 Overview

CapTrack replaces manual spreadsheet-based capstone tracking with a structured, role-aware platform. Three distinct user roles — **Students**, **Mentors**, and **Coordinators** — each get a dedicated dashboard tailored to their responsibilities.

The system enforces a formal **3-stage approval pipeline**: team registration → mentor approval → coordinator activation, ensuring no team begins work without proper institutional oversight.

---

## ✨ Features

### 🎓 Student Portal

| Feature | Description |
|---|---|
| **Team Registration** | Self-register with leader details, up to 4 members, CGPI, division, and mentor preference |
| **Approval Progress Tracker** | Visual step-by-step pipeline (Pending → Mentor Approved → Active) with status-aware messaging |
| **Project Management** | Create and update project title and description post-activation |
| **Milestone Calendar** | Full interactive calendar with colour-coded milestone deadlines and statuses |
| **Kanban Task Board** | Drag-and-drop board with To Do / In Progress / Review / Done columns, priority levels, and member assignment |
| **Versioned Submissions** | Upload up to 5 PDFs per submission linked to a milestone — auto-increments version number (`v1`, `v2`…) per milestone |
| **Feedback Viewer** | Consolidated view of all mentor feedback across milestones and submissions |
| **Comment Threads** | Threaded discussion on each submission with role badges (Team / Mentor / Coordinator) and time-ago timestamps |
| **Interaction Sheet PDF** | One-click download of a formatted A4 PDF: team info box, member table, submission history, mentor feedback, signature strip |
| **Announcements** | Receive coordinator broadcasts and priority announcements in real-time |

### 🧑‍🏫 Mentor Portal

| Feature | Description |
|---|---|
| **Pending Approvals** | Review incoming team requests with full leader and member details |
| **Team Overview** | Dashboard showing all assigned teams, their milestones, submissions, and progress |
| **Submission Reviews** | Approve, reject, or comment-only on student submissions with structured feedback |
| **Comment Threads** | Participate in per-submission discussions, visible to students and coordinators |
| **Kanban Viewer** | Read-only visibility into each assigned team's task board |
| **Announcements** | View all coordinator-issued announcements |

### 🏛️ Coordinator Cockpit

| Feature | Description |
|---|---|
| **Analytics Dashboard** | Live Recharts bar chart (teams by status) + donut chart (milestone completion rate) with auto-generated smart insights |
| **Smart Insights Panel** | Auto-generated callouts — e.g. "5 teams pending activation", "milestone approval rate below 30%" |
| **Excel Report Export** | Server-side 2-sheet workbook: Teams Overview (status, mentor, project, milestones) + Milestones Detail, with colour-coded cells |
| **Team Activation** | Final approval step — activate or reject mentor-approved teams |
| **All Teams Table** | Searchable table with force mentor reassignment and status revocation |
| **Mentor Management** | View all registered mentors, assignment counts, department, and expertise |
| **Milestone Management** | Create milestones for one team or all active teams at once; set deadlines; delete |
| **Announcement System** | Post Normal / High Priority / Broadcast announcements to all users |
| **Phase Control** | Toggle global capstone phase (Pre-Launch → Synopsis → Mid-Term → Final) — reflected system-wide |
| **Paginated Audit Log** | Every system action logged with action type, actor, target, details, and timestamp — paginated 50/page |
| **Submission Discussion Viewer** | Read all per-submission comment threads across every team |

---

## 🛡️ Security

| Layer | Implementation |
|---|---|
| **Security Headers** | `helmet` — X-Frame-Options, CSP, HSTS, and 11 other HTTP security headers |
| **Brute-Force Protection** | `express-rate-limit` — 100 req/15 min globally, 20 req/15 min on all auth routes |
| **NoSQL Injection Prevention** | `express-mongo-sanitize` — strips `$` and `.` operators from all request bodies and query strings |
| **XSS Sanitisation** | `xss-clean` — strips HTML tags from all user input |
| **Input Validation** | `joi` schemas on every mutation endpoint — incorrect types, invalid enums, and oversized payloads return HTTP 422 |
| **JWT Authentication** | Signed tokens with configurable expiry; role embedded in payload and verified on every request |
| **RBAC Middleware** | Three roles (`STUDENT`, `MENTOR`, `COORDINATOR`) enforced per route — cross-role access returns HTTP 403 |
| **File Upload Hardening** | MIME-type whitelist (PDF only), 10 MB per-file limit, max 5 files per submission |
| **Body Size Cap** | `express.json({ limit: '2mb' })` — rejects oversized payloads before route handlers run |
| **Coordinator Gate** | Institution Master Key required for coordinator registration — not exposed in client code |

---

## 📦 Tech Stack

### Backend
- **Runtime** — Node.js 18+
- **Framework** — Express 4
- **Database** — MongoDB via Mongoose 8 (Atlas-compatible)
- **Auth** — `jsonwebtoken` + `bcryptjs`
- **Validation** — Joi 18
- **File Uploads** — Multer with disk storage
- **PDF Generation** — PDFKit (styled, multi-section A4 documents)
- **Excel Export** — ExcelJS (multi-sheet, styled workbooks with frozen headers)
- **Security Stack** — Helmet · express-rate-limit · express-mongo-sanitize · xss-clean

### Frontend
- **Framework** — React 18 (CRA)
- **Routing** — React Router 6
- **Styling** — Tailwind CSS 3 (custom institutional light theme)
- **Charts** — Recharts (responsive bar + donut)
- **Client Excel** — SheetJS / xlsx
- **State** — React Context (Auth, Toast)

### Data Models (10)
`Team` · `User` · `Milestone` · `Submission` · `Feedback` · `Comment` · `Announcement` · `Task` · `PhaseConfig` · `AuditLog`

---

## 🏗️ Architecture

```
CapTrack/
├── backend/
│   └── src/
│       ├── index.js              # Express app bootstrap, middleware chain, DB connect
│       ├── middleware/
│       │   ├── auth.js           # authenticate · requireTeam · requireRole()
│       │   └── validate.js       # Joi schemas + validate() middleware factory
│       ├── models/               # 10 Mongoose schemas
│       ├── routes/
│       │   ├── auth.js           # Registration + login (all roles)
│       │   ├── student.js        # Milestones · Submissions · Kanban · Comments
│       │   ├── mentor.js         # Approvals · Reviews · Comments
│       │   ├── coordinator.js    # Teams · Milestones · Announcements · Phase · Audit
│       │   └── reports.js        # PDF (PDFKit) · Excel (ExcelJS) · LaTeX
│       └── utils/
│           └── auditLog.js       # Audit log writer
│
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.js    # JWT persistence, user state, logout
        │   └── ToastContext.js   # Global toast queue
        ├── hooks/
        │   └── useApi.js         # Auth-header fetch wrapper (get/post/put/delete)
        ├── components/
        │   └── Layout.js         # Sidebar · mobile nav · Phase badge · QuickActions FAB
        └── pages/
            ├── LoginPage.js           # Tabbed login + multi-step registration flow
            ├── StudentDashboard.js    # 7 sub-pages + CommentThread + Kanban
            ├── MentorDashboard.js     # 5 sub-pages + CommentThread
            └── CoordinatorDashboard.js # 8 sub-pages + Recharts + Smart Insights
```

### Team Approval Pipeline

```
  Student Registers
         │
         ▼
     [PENDING] ──────────────────────────────────► [REJECTED]
         │   Mentor reviews request                 (mentor or coordinator)
         │
         ▼
  [MENTOR_APPROVED]
         │   Coordinator reviews
         │
         ▼
      [ACTIVE] ◄─── Coordinator can revoke to PENDING at any time
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB 6+)
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/your-username/captrack.git
cd captrack
```

### 2. Backend

```bash
cd backend
npm install

# Copy and fill environment variables
cp .env.example .env

# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

### 3. Frontend

```bash
cd frontend
npm install

# Set the API URL
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Development
npm start

# Production build
npm run build
```

---

## ⚙️ Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | ✅ | Random secret for signing JWTs — minimum 32 characters |
| `JWT_EXPIRES_IN` | ✅ | Token lifetime e.g. `7d`, `24h` |
| `PORT` | ✅ | Server port (default `5000`) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `FRONTEND_URL` | ✅ | CORS-allowed origin e.g. `http://localhost:3000` |
| `INSTITUTION_MASTER_KEY` | ✅ | Secret key required to register a coordinator account |

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | ✅ | Full base URL of the backend API e.g. `http://localhost:5000/api` |

---

## 📡 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/login/team` | — | Student team login |
| `POST` | `/login/user` | — | Mentor / Coordinator login |
| `POST` | `/register/team` | — | Team self-registration with members |
| `POST` | `/register/mentor` | — | Mentor account registration |
| `POST` | `/register/coordinator` | Institution Key | Coordinator account creation |
| `GET` | `/mentors` | — | List mentors for registration dropdown |

### Student — `/api/student` *(Bearer token · team role)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/me` | Own team profile with mentor info |
| `GET/POST/PUT` | `/project` | Project title + description CRUD |
| `GET` | `/milestones` | Own milestones with embedded feedback |
| `GET` | `/submissions` | All submissions with version numbers |
| `POST` | `/submissions` | Upload new submission (multipart/form-data) |
| `GET/POST` | `/submissions/:id/comments` | Comment thread read/write |
| `GET/POST/PUT/DELETE` | `/kanban` | Task board CRUD + drag-drop reorder |
| `GET` | `/announcements` | All coordinator announcements |

### Mentor — `/api/mentor` *(Bearer token · MENTOR role)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/me` | Mentor profile + team counts |
| `GET` | `/pending-teams` | Teams awaiting this mentor's approval |
| `POST` | `/approve-team/:id` | Approve team → MENTOR_APPROVED |
| `POST` | `/reject-team/:id` | Reject team |
| `GET` | `/teams` | All assigned teams with milestones + submissions |
| `GET` | `/teams/:teamId/kanban` | Read team task board |
| `POST/PUT` | `/reviews` `/reviews/:id` | Submit or update submission/milestone feedback |
| `GET/POST` | `/submissions/:id/comments` | Comment thread read/write |
| `GET` | `/announcements` | All coordinator announcements |

### Coordinator — `/api/coordinator` *(Bearer token · COORDINATOR role)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/overview` | Aggregated system stats |
| `GET` | `/pending-teams` | Mentor-approved teams awaiting activation |
| `POST` | `/teams/:id/activate` | Final team activation |
| `POST` | `/teams/:id/reject` | Reject at coordinator stage |
| `POST` | `/teams/:id/revoke` | Revoke active status to PENDING |
| `POST` | `/teams/:id/force-assign` | Override mentor assignment |
| `GET/POST/PUT/DELETE` | `/milestones` | Full milestone lifecycle |
| `GET/POST/DELETE` | `/announcements` | Announcement management |
| `GET/PUT` | `/phase` | Read/update global phase config |
| `GET` | `/audit-log?page=&limit=` | Paginated audit log |
| `GET` | `/submissions/:id/comments` | Read submission discussion threads |

### Reports — `/api/reports`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/pdf/me` | Bearer · team | Download own PDF Interaction Sheet |
| `GET` | `/excel` | Bearer · coordinator | Download full Excel report workbook |
| `GET` | `/latex/:teamId` | Bearer · team | Download LaTeX source for formal report |

---

## 🎨 UI Highlights

- **Institutional light theme** — slate-50 background, white cards, indigo-600 primary, no dark mode clutter
- **Sidebar navigation** with role-specific items, live phase badge, and pending-action counters
- **Quick Actions FAB** — floating button with contextual shortcuts per role
- **Skeleton loaders** on every async data section — no layout shift
- **Global toast notifications** — success / error / warning / info with auto-dismiss
- **Fully responsive** — collapsible mobile sidebar with backdrop overlay
- **Drag-and-drop Kanban** — native HTML5 drag events, column highlight on hover, optimistic UI updates
- **Recharts** — fully responsive `BarChart` + `PieChart` with custom tooltips and colour-coded cells

---

## 🗂️ Database Schema Overview

```
Team
  ├── teamUniqueId (auto-generated, year-prefixed sequential)
  ├── leader { name, rollNumber, cgpi, department, division }
  ├── members[]
  ├── projectTitle, projectDescription
  ├── status: PENDING | MENTOR_APPROVED | ACTIVE | REJECTED
  ├── mentorId → User
  └── requestedMentorId → User

Submission
  ├── teamId → Team
  ├── milestoneId → Milestone
  ├── files[] { filename, storedName, path, mimetype, size }
  └── version (auto-incremented per team+milestone)

Comment
  ├── submissionId → Submission
  ├── authorId, authorType: team | mentor | coordinator
  └── body

AuditLog
  ├── action (TEAM_REGISTERED, FEEDBACK_POSTED, PHASE_CHANGED, …)
  ├── performedByName, performedBy
  └── targetType, targetId, targetName, details
```

---

## 📄 License

MIT © 2026 Fr. Conceicao Rodrigues Institute of Technology — Department of Computer Engineering

---

<div align="center">
  <sub>Built with the MERN stack · Tailwind CSS · Recharts · PDFKit · ExcelJS · Joi · Helmet</sub>
</div>
