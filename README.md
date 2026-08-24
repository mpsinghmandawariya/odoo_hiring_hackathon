# TransitOps – Smart Transport Operations Platform
### Enterprise-Grade Transport Operations ERP System
> Built in 8 hours at Odoo Hackathon

---

## Steps to Run

### Prerequisites
- Node.js v18 or higher
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The database (`db-storage.json`) is auto-created and seeded with demo data on first run. No database setup required.

### Demo Login Credentials

| Role | Email | Password |
|---|---|---|    
| Fleet Manager | manager@transitops.com | Manager@123 |
| Dispatcher | dispatcher@transitops.com | Dispatcher@123 |
| Safety Officer | safety@transitops.com | Safety@123 |
| Financial Analyst | finance@transitops.com | Finance@123 |

---

## Problem Statement

Many logistics companies still rely on spreadsheets and manual logbooks to manage their transport operations. This leads to:

- Scheduling conflicts from double-assigning vehicles or drivers
- Underutilized vehicles with no visibility into fleet status
- Missed maintenance causing breakdowns and safety risks
- Expired driver licenses going unnoticed until it's too late
- Inaccurate expense tracking with no per-vehicle cost breakdown
- Poor operational visibility with no real-time KPIs or analytics

**TransitOps** solves this by providing a centralized platform that manages the complete lifecycle of transport operations — from vehicle registration and driver management to dispatching, maintenance, fuel logging, and financial analytics — all with enforced business rules and automated status transitions.

---

## Target Users

| Role | Responsibilities |
|---|---|
| **Fleet Manager** | Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency |
| **Dispatcher** | Creates trips, assigns vehicles and drivers, monitors active deliveries |
| **Safety Officer** | Ensures driver compliance, tracks license validity, monitors safety scores |
| **Financial Analyst** | Reviews operational expenses, fuel consumption, maintenance costs, and profitability |

---

## Features

### Modules

| Module | Description |
|---|---|
| **Dashboard** | Live KPI cards — active vehicles, available vehicles, vehicles in maintenance, active trips, pending trips, drivers on duty, fleet utilization % |
| **Fleet Management** | Vehicle registry with CRUD, odometer tracking, insurance/fitness expiry alerts, status management |
| **Driver Management** | Driver profiles, license expiry warnings, safety scores, certification tracking |
| **Trip Dispatch Board** | Kanban-style board — create, dispatch, complete, and cancel trips with full guard validation |
| **Maintenance** | Log vehicles into workshop, track service type, cost, technician; closing ticket restores vehicle to Available |
| **Billing & Fuel** | Fuel log auditing, peripheral expense tracking (tolls, parking, misc), per-vehicle operational cost, Vehicle ROI analytics |
| **User Management** | Create/edit/deactivate users, reset passwords (Fleet Manager only) |
| **Notifications** | Real-time system alerts for trip events, maintenance, and fleet changes |
| **Audit Logs** | Full action history with user, role, and timestamp (Fleet Manager only) |
| **Settings** | Configure fuel rate, MPG targets, cargo weight limits, freight revenue per mile |

### Business Rules Enforced

- Vehicle registration number must be unique
- `Retired` or `In Shop` vehicles never appear in dispatch selection
- Drivers with expired licenses or `Suspended` status cannot be assigned to trips
- A driver or vehicle already `On Trip` cannot be assigned to another trip
- Cargo weight must not exceed the vehicle's maximum load capacity
- Dispatching a trip automatically sets both vehicle and driver to `On Trip`
- Completing a trip automatically sets both vehicle and driver back to `Available`
- Cancelling a dispatched trip restores vehicle and driver to `Available`
- Creating a maintenance record automatically sets vehicle status to `In Shop`
- Closing maintenance restores vehicle to `Available`

### Trip Lifecycle

```
DRAFT → DISPATCHED → COMPLETED
                  ↘ CANCELLED
```

### Analytics & Reports
- Fuel Efficiency (Distance / Fuel)
- Fleet Utilization %
- Operational Cost per vehicle (Fuel + Maintenance)
- Vehicle ROI: `(Revenue - (Maintenance + Fuel)) / Acquisition Cost`
- CSV export support

### Bonus Features Implemented
- Charts and visual analytics on dashboard
- Dark mode (Kinetic Precision theme — slate-indigo with gold and emerald accents)
- Search, filters, and sorting across all modules
- Notification system for fleet events

---

## Example Workflow

1. Register vehicle `Van-05` with max capacity 500 kg → Status: `Available`
2. Register driver `Alex` with a valid license → Status: `Available`
3. Create a trip with Cargo Weight = 450 kg → Status: `Draft`
4. System validates 450 kg ≤ 500 kg and allows dispatch
5. Dispatch trip → Vehicle and Driver status become `On Trip`
6. Complete the trip → System marks both as `Available`, odometer auto-updated
7. Create a maintenance record (e.g., Oil Change) → Vehicle status becomes `In Shop`, hidden from dispatch
8. Close maintenance → Vehicle restored to `Available`
9. Reports update operational cost and fuel efficiency based on latest trip and fuel log

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS v4, Framer Motion, Lucide Icons |
| Backend | Node.js, Express |
| Auth | JWT (15min access token) + Refresh Token (7 days), bcrypt password hashing |
| Database | JSON file-based storage (`db-storage.json`) — no external DB required |
| Runtime | tsx (TypeScript execution), Vite (HMR dev server) |

---

## Project Structure

```
/
├── server.ts               # Express backend entry point (port 3000)
├── index.html              # SPA HTML entry
├── vite.config.ts          # Vite config
├── package.json
├── .env.example            # Environment variable template
│
└── src/
    ├── App.tsx             # Route switcher / layout shell
    ├── main.tsx            # React SPA entry
    ├── index.css           # Tailwind CSS
    ├── types.ts            # Shared TypeScript interfaces & enums
    │
    ├── components/         # Page-level views
    │   ├── LoginView.tsx
    │   ├── DashboardView.tsx
    │   ├── VehiclesView.tsx
    │   ├── DriversView.tsx
    │   ├── TripsView.tsx
    │   ├── MaintenanceView.tsx
    │   ├── BillingView.tsx
    │   ├── ProfileView.tsx
    │   ├── SettingsView.tsx
    │   ├── Sidebar.tsx
    │   ├── Navbar.tsx
    │   └── AccessDenied.tsx
    │
    ├── lib/
    │   └── state.ts        # Global app state management
    │
    └── server/
        └── db.ts           # JSON file database engine with auto-seeding
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start full-stack dev server with hot reload on port 3000 |
| `npm run build` | Build frontend + bundle backend for production |
| `npm run start` | Run production build |
| `npm run lint` | TypeScript type check |

---

## API Endpoints

### Auth
- `POST /api/auth/login` — Login with email, password, role
- `POST /api/auth/register` — Self-register a new account
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Revoke refresh token
- `POST /api/auth/forgot-password` — Generate reset token
- `POST /api/auth/reset-password` — Reset password with token

### Vehicles
- `GET /api/vehicles` — List all vehicles
- `POST /api/vehicles` — Add vehicle
- `PUT /api/vehicles/:id` — Update vehicle
- `PATCH /api/vehicles/:id/odometer` — Update odometer
- `DELETE /api/vehicles/:id` — Remove vehicle

### Drivers
- `GET /api/drivers` — List all drivers
- `POST /api/drivers` — Register driver
- `PUT /api/drivers/:id` — Update driver
- `DELETE /api/drivers/:id` — Remove driver

### Trips
- `GET /api/trips` — List all trips
- `POST /api/trips` — Create trip (DRAFT)
- `POST /api/trips/:id/dispatch` — Dispatch trip (with guards)
- `POST /api/trips/:id/complete` — Complete trip
- `POST /api/trips/:id/cancel` — Cancel trip

### Maintenance
- `GET /api/maintenance` — List maintenance logs
- `POST /api/maintenance` — Open maintenance ticket (sets vehicle to IN_SHOP)
- `POST /api/maintenance/:id/close` — Close ticket (sets vehicle to AVAILABLE, logs expense)

### Fuel & Expenses
- `GET /api/fuel` — List fuel logs
- `POST /api/fuel` — Add fuel log (auto-creates expense)
- `GET /api/expenses` — List all expenses
- `POST /api/expenses` — Add expense

### Users (Fleet Manager only)
- `GET /api/users` — List users
- `POST /api/users` — Create user
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user
- `POST /api/users/:id/reset-password` — Reset user password
- `POST /api/users/:id/status` — Activate/deactivate user

### Other
- `GET /api/notifications` — Get notifications
- `POST /api/notifications/:id/read` — Mark notification as read
- `GET /api/settings` — Get settings
- `POST /api/settings` — Update settings
- `GET /api/audit` — Get audit logs (Fleet Manager only)
- `POST /api/admin/reset` — Reset database to seed state (Fleet Manager only)

---

## Authentication Flow

```
Login → JWT (15min) + Refresh Token (7 days)
     → On expiry: POST /api/auth/refresh → new JWT
     → On logout: refresh token revoked
```

All protected routes require `Authorization: Bearer <token>` header. Role violations return `403 Forbidden`.
