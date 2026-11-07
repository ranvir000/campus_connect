# CampusConnect — MRSPTU CSE Student & Department Portal

A full-stack role-based student and department portal built for Maharaja Ranjit Singh Punjab Technical University (MRSPTU), Bathinda — B.Tech Computer Science & Engineering.

---

## 🚀 Features

- **Role-Based Access Control:**
  - **Student Portal:** Personalized dashboard (attendance, CGPA, semester), weekly timetable (IST-anchored), assignments submission tracking, notices & circulars, club events with one-click RSVP/cancellation, academic resources, and grievance/support ticketing with full status history.
  - **Administrator Portal (Head of Department):** Department dashboard with real-time analytics, notice publishing & drafting, event & club management, resource uploads, and student helpdesk resolution.
- **Modern Stack:**
  - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Base UI, Motion, React Router v7, TanStack Query.
  - **Backend:** Python FastAPI, Pydantic v2, PBKDF2-HMAC-SHA256 password security, HTTP-only cookie sessions.
  - **Database:** Dual-mode asynchronous storage — MongoDB Atlas / local MongoDB, with an automatic zero-dependency SQLite fallback (`campusconnect.db`) for immediate offline execution.

---

## 🔑 Demo Credentials

| Role | E-mail | Password | Profile |
| :--- | :--- | :--- | :--- |
| **Student** | `aman.cse084@mrsptu.ac.in` | `student123` | Amanpreet Singh, Roll 2021CSE084 (8th Sem) |
| **Administrator** | `hod.cse@mrsptu.ac.in` | `admin123` | Dr. Hardeep Singh, Head of Department |

---

## 💻 How to Run Locally

### 1. Start the Backend (FastAPI on Port 8001)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
*(On first launch, sample departmental data and demo accounts are automatically seeded into the database.)*

### 2. Start the Frontend (Vite on Port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🧪 Running Automated Tests

Run backend tests:
```bash
python -m pytest backend/tests/test_api.py -v
```

---

## 📂 Project Structure

```
mrsptu-cse-app/
├── backend/
│   ├── server.py              # FastAPI application, CORS, routers & startup lifecycle
│   ├── seed.py                # Departmental sample data & demo users auto-seeder
│   ├── requirements.txt       # Python dependencies
│   ├── pytest.ini             # Test configuration
│   ├── lib/
│   │   ├── auth.py            # PBKDF2 hashing, cookie sessions, require_user, require_admin
│   │   ├── db.py              # MongoDB + zero-config embedded SQLite dual database
│   │   └── dates.py           # Indian Standard Time (IST) calendar helpers
│   ├── models/                # Pydantic schemas (auth, academics, portal, support)
│   ├── routers/               # API routes (auth, academics, notices, events, resources, support, admin)
│   └── tests/                 # Pytest test suite (100% passing)
├── frontend/
│   ├── index.html             # Clean HTML shell
│   ├── vite.config.ts         # Vite configuration with /api proxy to :8001
│   ├── package.json           # Dependencies
│   └── src/
│       ├── App.tsx            # Protected client-side routing & AppShell
│       ├── main.tsx           # React entry point
│       ├── pages/             # All student & admin view screens
│       ├── components/        # UI component library & layout wrappers
│       └── lib/               # Typed fetch layer, session hooks, theme & utils
└── docs/
    ├── CampusConnect_Project_Details.pdf   # 16-page official technical project documentation
    └── CampusConnect_Project_Details.txt   # Extracted full text documentation
```
