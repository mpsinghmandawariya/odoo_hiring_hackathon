TransitOps – Smart Transport Operations Platform
Enterprise-Grade Transport Operations ERP System
TransitOps is a full-stack ERP solution for managing fleet operations, dispatcher workflows, driver scheduling, safety compliance, fuel tracking, maintenance lifecycles, and financial analytics — all in one platform.

Built with a Kinetic Precision dark theme (slate-indigo with gold and emerald accents), it provides fleet command centers with a high-density, performant interface.

Features
Role-Based Access Control (RBAC)
Four distinct roles with scoped permissions:

Fleet Manager — Full access: users, vehicles, drivers, trips, maintenance, billing, settings, audit logs
Dispatcher — Manage and dispatch trips, view vehicles and drivers
Safety Officer — Monitor drivers, manage maintenance, cancel trips
Financial Analyst — View trips, fuel logs, and expense analytics
Modules
Module	Description
Dashboard	Live KPI cards — active trips, available vehicles, drivers on duty, monthly revenue
Fleet Management	Vehicle registry with CRUD, odometer tracking, insurance/fitness expiry alerts
Driver Management	Driver profiles, license expiry warnings, safety scores, certification tracking
Trip Dispatch Board	Kanban-style board — create, dispatch, complete, and cancel trips with full guard validation
Maintenance	Log vehicles into workshop, track service type, cost, technician, and close tickets
Billing & Fuel	Fuel log auditing, peripheral expense tracking (tolls, parking, misc), financial analytics
User Management	Create/edit/deactivate users, reset passwords (Fleet Manager only)
Notifications	Real-time system alerts for trip events, maintenance, and fleet changes
Audit Logs	Full action history with user, role, and timestamp (Fleet Manager only)
Settings	Configure fuel rate, MPG targets, cargo weight limits, freight revenue per mile
Trip Dispatch Guards
When dispatching a trip, the system enforces:

Vehicle must be AVAILABLE (not ON_TRIP or IN_SHOP)
Driver must be AVAILABLE (not ON_TRIP or SUSPENDED)
Driver license must not be expired
Cargo weight must not exceed vehicle capacity
On dispatch, vehicle and driver are atomically set to ON_TRIP. On completion, odometer is auto-incremented by trip distance.

Tech Stack
Layer	Technology
Frontend	React 19, Tailwind CSS v4, Framer Motion, Lucide Icons
Backend	Node.js, Express
Auth	JWT (15min access token) + Refresh Token (7 days), bcrypt password hashing
Database	JSON file-based storage (db-storage.json) — no external DB required
Runtime	tsx (TypeScript execution), Vite (HMR dev server)
AI Layer	Google Gemini API (optional, for report generation)
Project Structure
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
Steps to Run
Prerequisites
Node.js v18 or higher
npm
1. Clone and install dependencies
git clone <repo-url>
cd Odoo_12_07
npm install
2. Set up environment variables (optional)
cp .env.example .env
Edit .env and add your Gemini API key if you want AI features:

GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
The app runs fine without a .env file. JWT secrets fall back to built-in defaults for local development.

3. Start the development server
npm run dev
Open http://localhost:3000 in your browser.

The database (db-storage.json) is auto-created and seeded with demo data on first run. No database setup required.

Demo Login Credentials
Role	Email	Password
Fleet Manager	manager@transitops.com	Manager@123
Dispatcher	dispatcher@transitops.com	Dispatcher@123
Safety Officer	safety@transitops.com	Safety@123
Financial Analyst	finance@transitops.com	Finance@123
Available Scripts
Command	Description
npm run dev	Start full-stack dev server with hot reload on port 3000
npm run build	Build frontend + bundle backend for production
npm run start	Run production build
npm run lint	TypeScript type check
API Endpoints
Auth
POST /api/auth/login — Login with email, password, role
POST /api/auth/register — Self-register a new account
POST /api/auth/refresh — Refresh access token
POST /api/auth/logout — Revoke refresh token
POST /api/auth/forgot-password — Generate reset token
POST /api/auth/reset-password — Reset password with token
Vehicles
GET /api/vehicles — List all vehicles
POST /api/vehicles — Add vehicle
PUT /api/vehicles/:id — Update vehicle
PATCH /api/vehicles/:id/odometer — Update odometer
DELETE /api/vehicles/:id — Remove vehicle
Drivers
GET /api/drivers — List all drivers
POST /api/drivers — Register driver
PUT /api/drivers/:id — Update driver
DELETE /api/drivers/:id — Remove driver
Trips
GET /api/trips — List all trips
POST /api/trips — Create trip (DRAFT)
POST /api/trips/:id/dispatch — Dispatch trip (with guards)
POST /api/trips/:id/complete — Complete trip
POST /api/trips/:id/cancel — Cancel trip
Maintenance
GET /api/maintenance — List maintenance logs
POST /api/maintenance — Open maintenance ticket (sets vehicle to IN_SHOP)
POST /api/maintenance/:id/close — Close ticket (sets vehicle to AVAILABLE, logs expense)
Fuel & Expenses
GET /api/fuel — List fuel logs
POST /api/fuel — Add fuel log (auto-creates expense)
GET /api/expenses — List all expenses
POST /api/expenses — Add expense
Users (Fleet Manager only)
GET /api/users — List users
POST /api/users — Create user
PUT /api/users/:id — Update user
DELETE /api/users/:id — Delete user
POST /api/users/:id/reset-password — Reset user password
POST /api/users/:id/status — Activate/deactivate user
Other
GET /api/notifications — Get notifications
POST /api/notifications/:id/read — Mark notification as read
GET /api/settings — Get settings
POST /api/settings — Update settings
GET /api/audit — Get audit logs (Fleet Manager only)
POST /api/admin/reset — Reset database to seed state (Fleet Manager only)
Authentication Flow
Login → JWT (15min) + Refresh Token (7 days)
     → On expiry: POST /api/auth/refresh → new JWT
     → On logout: refresh token revoked
All protected routes require Authorization: Bearer <token> header. Role violations return 403 Forbidden.
