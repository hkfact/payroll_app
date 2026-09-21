# Payroll App

A multi-tenant web app for managing employee salaries across multiple organizations. Built with the PERN stack (PostgreSQL, Express, React, Node.js).

## Overview

Each organization operates independently within the same app instance — data is isolated by `org_id` throughout. Every person in the system (from top-level admins down to employees) is a single account with a role, rather than separate account types per role.

## Roles

| Role | Scope |
|---|---|
| `super_admin` | Creates organizations, not tied to any single org |
| `admin` | Exactly one per organization; creates managers and observers |
| `manager` | Manages only their own assigned employees |
| `employee` | Sees only their own pay information |
| `observer` | Read-only access across the whole organization (accountant-style role) |

## Tech stack

- **Database**: PostgreSQL
- **Backend**: Node.js + Express
- **Frontend**: React + React Router
- **Auth**: JWT stored in an httpOnly cookie, bcrypt-hashed passwords

## Project structure

```
backend/
├── index.js              # entry point, mounts middleware + routes
├── db.js                 # PostgreSQL connection
├── middleware/
│   ├── auth.js            # requireAuth, requireRole
│   └── scope.js           # personScope, orgScope — role-based query scoping
├── routes/                # URL → controller mapping
├── controllers/           # query logic per resource
└── utils/
    └── payCalculator.js    # net pay calculation

frontend/
└── src/
    ├── api/               # fetch wrapper for the backend
    ├── context/           # AuthContext (session state)
    ├── components/        # route guards + dashboard panels
    ├── css/
    └── pages/             # Login, Dashboard
```

## Setup

**Backend**
```
npm install
```
Create a `.env` file with:
```
JWT_SECRET=your_secret_here
```
Run the server:
```
node index.js
```
Server listens on port `5000`.

**Frontend**
```
npm install
npm run dev
```
Expected to run on port `5173` (CORS is configured for this origin).

**Database**

A PostgreSQL database is required with the schema described in the project's database documentation. Update `db.js` with your connection details.

## Core features

- Login / logout with persistent sessions (JWT + httpOnly cookie)
- Role-based dashboard: each role sees a different view of the same data, enforced server-side
- Reusable, org-defined pay criteria (bonuses, deductions) applied per employee
- Live net pay calculation per employee, per month
- Itemized pay breakdown showing exactly which criteria affected a given month's pay

## Status

Actively in development.
