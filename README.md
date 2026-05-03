# Capstone Project Monitoring System

A full-stack web application for monitoring capstone projects, built with React, Node.js/Express, and MongoDB.

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Router, SheetJS (xlsx) (port 3000)
- **Backend**: Node.js, Express, JWT authentication, Multer (port 5000)
- **Database**: MongoDB + Mongoose
- **File uploads**: Multer (PDF only)

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

## Setup

### 1. Install MongoDB

**macOS (Homebrew)**:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Or use MongoDB Atlas** — create a free cluster and copy the connection string into `.env`.

### 2. Clone and install dependencies

```bash
git clone <repo-url>
cd capstone-monitoring-system
npm run install:all
```

### 3. Configure environment

Edit `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/capstone_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 4. Seed the database

```bash
cd backend && node seed.js
```

### 5. Start the app

```bash
# From the project root:
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- About Page: http://localhost:3000/about

---

## Demo Credentials

### Coordinator
| Field | Value |
|-------|-------|
| Name | Dr. Smitha Dange |
| Email | smitha.dange@capstone.edu |
| Password | password123 |

### Mentors
| Name | Email | Password |
|------|-------|----------|
| Mrs. Chetana | chetana@capstone.edu | password123 |
| Mrs. Nupur | nupur@capstone.edu | password123 |

### Student Teams
| Team ID | Password | Leader | Roll No | CGPI | Div | Department |
|---------|----------|--------|---------|------|-----|------------|
| 2026001 | Pass1234 | Allen | 1023214 | 8.5 | B | Computer Engineering |
| 2026002 | Pass5678 | Riya  | 1023271 | 9.0 | B | Computer Engineering |

**Team 2026001 Members:**
- Aarya (Roll: 1023221, CGPI 8.1, Div B)
- Melissa (Roll: 1023235, CGPI 7.9, Div B)
- Mentor: Mrs. Chetana | Remark: Internal

**Team 2026002 Members:**
- Pratiksha (Roll: 1023282, CGPI 8.7, Div B)
- Sandra (Roll: 1023295, CGPI 7.5, Div B)
- Mentor: Mrs. Nupur | Remark: Internal

> **Note:** Project titles are submitted from the student dashboard after login, not during registration.

---

## Public Pages

| Route | Description |
|-------|-------------|
| `/login` | Login / Registration page (Student & Staff) |
| `/about` | About Us page — team info, guides, platform overview |

---

## Team ID Format

- Auto-generated as: `{current_year}{3-digit-sequence}` e.g. `2026001`, `2026002`, `2026003`
- Sequence resets each new year (e.g. `2027001`, `2027002`)
- Team ID is the login username for student teams

## Roll Number Format

- Exactly 7 digits (e.g. `1023214`)
- Validated on both frontend and backend

## Division Field

- Single character: A, B, C, or D
- Collected for leader and all members during registration
- Stored in the Team document and included in Excel exports

## Remark Field

- Default value: `Internal`
- Coordinator can edit remark per team inline from the Teams table
- Reflected in the downloaded Team Sheet Excel file

## File Uploads

- **Only PDF files are accepted** for milestone submissions
- Max file size: 10 MB
- Max 5 files per submission
- Submissions must be linked to a coordinator-set milestone

---

## Features

### Student
- Register team with leader info (name, roll number, CGPI, division, department) and up to 4 members
- Auto-generated Team ID (`{year}{seq}`) and password shown on registration — save these credentials
- Submit project title from dashboard after login
- Monthly calendar view of milestones with color-coded status
- Submit progress reports (PDF only) linked to a specific milestone
- View mentor feedback across milestones and submissions
- **Download LaTeX Report** (.tex file) with full team, member, and submission details

### Mentor
- Register with name, department, and expertise
- View assigned teams with full milestone and submission history
- Separate Submissions section for reviewing all submissions across teams
- Approve or reject milestones and submissions with comments

### Coordinator (pre-seeded, no registration)
- Assign mentors to student teams
- Set milestones for individual teams or all teams (appears on student calendar)
- Monitor all project progress with team table (Team ID, leader, department, remark, mentor, progress)
- Edit remark per team inline (click the remark badge)
- **Download Team Sheet** (.xlsx) — all teams with members, roll numbers, division, branch, remark, guide
- **Download Milestone Sheet** (.xlsx) — all milestones with team, project title, deadline, status, mentor
- Per-team sheet download from the Teams table
- View Mentors directory with team assignment counts
- Post announcements visible to all users

---

## Project Structure

```
capstone-monitoring-system/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Team.js      # remark + division fields
│   │   │   ├── Milestone.js
│   │   │   ├── Submission.js
│   │   │   ├── Feedback.js
│   │   │   └── Announcement.js
│   │   ├── routes/
│   │   │   ├── auth.js      # team registration with division
│   │   │   ├── student.js
│   │   │   ├── mentor.js
│   │   │   ├── coordinator.js  # remark editing endpoint
│   │   │   └── reports.js   # GET /api/reports/latex/:teamId
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── index.js
│   ├── uploads/
│   └── seed.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage.js         # division field + About link
        │   ├── AboutPage.js         # public /about route
        │   ├── StudentDashboard.js  # LaTeX download button
        │   ├── MentorDashboard.js
        │   └── CoordinatorDashboard.js  # Excel downloads + remark edit
        └── ...
```
