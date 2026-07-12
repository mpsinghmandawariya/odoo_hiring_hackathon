# TransitOps – Smart Transport Operations Platform
### Enterprise-Grade Transport Operations ERP System

TransitOps is a comprehensive, production-ready enterprise solution for managing fleet operations, dispatcher workflows, driver scheduling, safety compliance, fuel tracking, maintenance lifecycles, and real-time financial ROI analysis.

Designed with a high-density, eye-safe **Kinetic Precision** dark theme (modern slate-indigo aesthetic with gold and emerald accents), it provides fleet command centers with a robust, performant interface to optimize logistical efficiencies.

---

## 1. Project Architecture
The platform is designed around a decoupled, full-stack architecture adhering to the **Repository Pattern** and **Clean Architecture Principles** to separate concerns and maximize stability, testability, and future extensibility.

```
       ┌────────────────────────────────────────────────────────┐
       │                 Vite Client (React 19)                 │
       │  - UI Components (Tailwind CSS, motion, Lucide Icons)   │
       │  - State Management & Data Fetching (TanStack Query)    │
       │  - Typed Form Validations (React Hook Form + Zod)      │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS REST (JSON)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                Express Gateway (Node.js)               │
       │  - JWT/Refresh Token Auth & RBAC Security Middleware    │
       │  - Zod Request DTO Validation Middleware               │
       │  - Controller Layer (Clean Handlers, Error Handling)   │
       └───────────────────────────┬────────────────────────────┘
                                   │ Dependency Injection
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                    Service Layer                       │
       │  - Complete Domain & Business Rules Validation         │
       │  - Active Asset Checking & Dispatch Rule Engine        │
       └───────────────────────────┬────────────────────────────┘
                                   │ Repository Interface
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │              Data Access Layer (Prisma ORM)            │
       │  - Normalized Schema Mapping                           │
       │  - Transaction Management                              │
       └───────────────────────────┬────────────────────────────┘
                                   │ SQL Queries
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                 PostgreSQL Database                    │
       │  - Scalable Indices & Foreign Key Relations            │
       └────────────────────────────────────────────────────────┘
```

### Key Architectural Tenets:
1. **SOLID Principles:** Interfaces decouple services from database-specific drivers. Controllers do not handle database connections directly.
2. **Repository Pattern:** All database queries are isolated inside repository classes, enabling seamless transitions from PostgreSQL to other database backends (e.g., Cloud Spanner) without altering business services.
3. **Lazy SDK Initialization & Security:** API keys, database credentials, and secrets are strictly stored server-side. Third-party interfaces fail gracefully with detailed logs if environment variables are not populated.
4. **Offline Resilience & Validation:** Client-side Zod schemas mirror backend validator models, offering zero-latency validation before server hits.

---

## 2. Folder Structure (Monorepo Layout)
```
/
├── .env.example                # Unified Environment Variables blueprint
├── .gitignore                  # Production Git ignores (ignoring node_modules, dist, logs)
├── docker-compose.yml          # Multistage Orchestration configuration
├── package.json                # Project manifest and scripts
├── tsconfig.json               # Shared TypeScript base configuration
├── vite.config.ts              # Vite configurations
├── index.html                  # Client HTML entry point
│
├── database/
│   ├── ER_DIAGRAM.md           # Deep-dive Database Architecture documentation
│   └── seed.ts                 # Idempotent ERP Database Seeding Script
│
├── docker/
│   ├── backend.Dockerfile      # Optimized multi-stage Docker build for Backend
│   └── frontend.Dockerfile     # Multi-stage static server build for Frontend
│
├── docs/
│   ├── API_SPEC.md             # Standard REST OpenAPI-compliant Reference
│   └── BUSINESS_RULES.md       # High-fidelity ERP Business logic guidelines
│
├── src/                        # Combined Full-Stack Workspace Tree
│   ├── main.tsx                # Client-Side SPA Entry Point
│   ├── index.css               # Tailwind CSS & Typography system
│   ├── App.tsx                 # Core Route Switcher / Layout Shell
│   ├── types.ts                # Monolith ERP TypeScript interfaces & schemas
│   │
│   ├── components/             # Reusable UI Blocks (React)
│   │   ├── Sidebar.tsx         # Collapsible high-density navigation panel
│   │   ├── Navbar.tsx          # Utility-rich profile/search header
│   │   ├── DashboardCard.tsx   # Generic sparkline KPI card
│   │   ├── CustomTable.tsx     # Generic paginated data table component
│   │   └── Modal.tsx           # Framer-motion animated context dialog
│   │
│   ├── modules/                # Domain-Driven Functional Front-End Modules
│   │   ├── auth/               # Enterprise Sign-In with dynamic Role selectors
│   │   ├── dashboard/          # Fleet Command Center KPI graphs
│   │   ├── fleet/              # Vehicle Registry CRUD & Documents
│   │   ├── drivers/            # Driver Management & Certification warnings
│   │   ├── trips/              # Interactive Trip Dispatch Board (Kanban style)
│   │   ├── maintenance/        # Fleet Maintenance schedules & cost tracking
│   │   └── billing/            # Fuel log auditing & financial analytics
│   │
│   ├── server/                 # Decoupled Express Backend Architecture
│   │   ├── index.ts            # Bootstrapped Express entry point (port 3000)
│   │   ├── config/             # DB & App constants
│   │   ├── controllers/        # Express Request-Response handlers
│   │   ├── middleware/         # Auth, Role guards, Rate limiter & Error handlers
│   │   ├── repositories/       # Database Operations (Prisma DB access abstraction)
│   │   ├── services/           # Fleet Business Engine (Validation & Calculations)
│   │   └── routes/             # Unified Router definitions
│   │
│   └── prisma/                 # Prisma Configuration
│       └── schema.prisma       # Full PostgreSQL Normalized Schema Definition
```

---

## 3. Database ER Diagram

Below is the database structure. Tables are designed in 3rd Normal Form (3NF) to guarantee operational consistency and low disk-write latency:

```
                  ┌──────────────────────┐
                  │        Users         │
                  ├──────────────────────┤
                  │ PK  id (UUID)        ├──────┐
                  │     email (VARCHAR)  │      │ 1:Many
                  │     password (HASH)  │      │
                  │     role (ENUM)      │      ▼
                  └──────────────────────┘ ┌──────────────────────┐
                                           │      AuditLogs       │
                  ┌──────────────────────┐ ├──────────────────────┤
                  │       Settings       │ │ PK  id (UUID)        │
                  ├──────────────────────┤ │ FK  userId (UUID)    │
                  │ PK  id (UUID)        │ │     action (VARCHAR) │
                  │     key (VARCHAR)    │ │     details (TEXT)   │
                  │     value (VARCHAR)  │ │     timestamp (DATE) │
                  └──────────────────────┘ └──────────────────────┘

       ┌──────────────────────────────────────────────────────────────┐
       │                                                              │
       │          ┌──────────────────────┐  1:Many  ┌──────────────────────┐
       │          │       Vehicles       │◄─────────┤   MaintenanceLogs    │
       │          ├──────────────────────┤          ├──────────────────────┤
       │          │ PK  id (UUID)        │          │ PK  id (UUID)        │
       │          │  U  regNum (VARCHAR) │          │ FK  vehicleId (UUID) │
       │          │     name (VARCHAR)   │          │     service (VARCHAR)│
       │          │     type (ENUM)      │          │     cost (DECIMAL)   │
       │          │     capacity (INT)   │          │     status (ENUM)    │
       │          │     odometer (INT)   │          └──────────────────────┘
       │          │     status (ENUM)    │
       │          └──────────┬───────────┘
       │                     │ 1:Many
       │                     ▼
       │          ┌──────────────────────┐  1:Many  ┌──────────────────────┐
       │          │      FuelLogs        │◄─────────┤       Expenses       │
       │          ├──────────────────────┤          ├──────────────────────┤
       │          │ PK  id (UUID)        │          │ PK  id (UUID)        │
       │          │ FK  vehicleId (UUID) │          │ FK  vehicleId (UUID) │
       │          │ FK  tripId (UUID)    │          │ FK  tripId (UUID)    │
       │          │     liters (DECIMAL) │          │     amount (DECIMAL) │
       │          │     cost (DECIMAL)   │          │     category (ENUM)  │
       │          └──────────────────────┘          └──────────────────────┘
       │                     ▲
       │                     │ 1:Many
       │                     │
       │ 1:Many   ┌──────────┴───────────┐  1:Many  ┌──────────────────────┐
       └─────────┤        Trips         ├─────────►│    Notifications     │
                  ├──────────────────────┤          ├──────────────────────┤
                  │ PK  id (UUID)        │          │ PK  id (UUID)        │
                  │ FK  vehicleId (UUID) │          │     type (VARCHAR)   │
                  │ FK  driverId (UUID)  │          │     message (TEXT)   │
                  │     status (ENUM)    │          │     isRead (BOOL)    │
                  │     distance (DEC)   │          └──────────────────────┘
                  │     revenue (DEC)    │
                  └──────────▲───────────┘
                             │ 1:Many
                             │
                  ┌──────────┴───────────┐
                  │       Drivers        │
                  ├──────────────────────┤
                  │ PK  id (UUID)        │
                  │  U  license (VARCHAR)│
                  │     name (VARCHAR)   │
                  │     status (ENUM)    │
                  │     safetyScore (DEC)│
                  └──────────────────────┘
```

---

## 4. Prisma Schema Definition (`schema.prisma`)
This schema models constraints, foreign keys, cascade deletes, standard default generation, and optimization indexes:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-node"
}

enum Role {
  FLEET_MANAGER
  DISPATCHER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum VehicleType {
  TRUCK
  VAN
  BUS
  SPECIALIZED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

enum ExpenseCategory {
  MAINTENANCE
  PARKING
  TOLL
  FUEL
  MISCELLANEOUS
}

enum MaintenanceStatus {
  ACTIVE
  COMPLETED
}

model User {
  id         String      @id @default(uuid())
  email      String      @unique
  password   String
  name       String
  role       Role
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  auditLogs  AuditLog[]
}

model Vehicle {
  id              String             @id @default(uuid())
  regNumber       String             @unique
  name            String
  type            VehicleType
  capacity        Int // cargo weight limit in kg, or seat count for bus
  acquisitionCost Decimal            @db.Decimal(12, 2)
  purchaseDate    DateTime
  insuranceExpiry DateTime
  fitnessExpiry   DateTime
  odometer        Int                @default(0)
  status          VehicleStatus      @default(AVAILABLE)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  trips           Trip[]
  maintenanceLogs MaintenanceLog[]
  fuelLogs        FuelLog[]
  expenses        Expense[]

  @@index([status])
  @@index([regNumber])
}

model Driver {
  id            String       @id @default(uuid())
  name          String
  photoUrl      String?
  licenseNumber String       @unique
  category      String // e.g. Class A CDL, HazMat Cert
  licenseExpiry DateTime
  phone         String
  email         String       @unique
  safetyScore   Decimal      @default(100.00) @db.Decimal(5, 2)
  experience    Int // years of professional driving
  status        DriverStatus @default(AVAILABLE)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  trips         Trip[]

  @@index([status])
  @@index([licenseNumber])
}

model Trip {
  id            String         @id @default(uuid())
  tripNumber    String         @unique
  source        String
  destination   String
  vehicleId     String
  vehicle       Vehicle        @relation(fields: [vehicleId], references: [id])
  driverId      String
  driver        Driver         @relation(fields: [driverId], references: [id])
  cargoWeight   Int
  revenue       Decimal        @db.Decimal(10, 2)
  distance      Decimal        @db.Decimal(8, 2)
  eta           DateTime
  status        TripStatus     @default(DRAFT)
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  fuelLogs      FuelLog[]
  expenses      Expense[]

  @@index([status])
  @@index([tripNumber])
}

model MaintenanceLog {
  id         String            @id @default(uuid())
  vehicleId  String
  vehicle    Vehicle           @relation(fields: [vehicleId], references: [id])
  serviceType String // Oil Change, Brake Repair, etc.
  workshop   String
  cost       Decimal           @db.Decimal(10, 2)
  date       DateTime
  technician String
  status     MaintenanceStatus @default(ACTIVE)
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
}

model FuelLog {
  id          String   @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  tripId      String?
  trip        Trip?    @relation(fields: [tripId], references: [id])
  liters      Decimal  @db.Decimal(8, 2)
  cost        Decimal  @db.Decimal(8, 2)
  date        DateTime
  fuelStation String
  createdAt   DateTime @default(now())
}

model Expense {
  id          String          @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle         @relation(fields: [vehicleId], references: [id])
  tripId      String?
  trip        Trip?           @relation(fields: [tripId], references: [id])
  amount      Decimal         @db.Decimal(10, 2)
  category    ExpenseCategory
  description String?
  date        DateTime
  createdAt   DateTime        @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  type      String // TRIP_COMPLETED, MAINTENANCE_DUE, etc.
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Setting {
  id    String @id @default(uuid())
  key   String @unique
  value String
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  details   String?
  timestamp DateTime @default(now())
}
```

---

## 5. API Design Reference

All endpoints request and return standard JSON payloads. HTTP status codes (200, 201, 400, 401, 403, 404, 500) represent success and granular failure modes.

### Authentication Module
- `POST /api/auth/login` - Verify password, return JWT + Refresh Token in HTTP-Only cookies.
- `POST /api/auth/refresh` - Swap valid Refresh Token for fresh short-lived JWT.
- `POST /api/auth/logout` - Clear state & revoke active tokens.
- `POST /api/auth/reset-password` - Request verification pin / save updated password.

### Vehicles Registry (CRUD + Query)
- `GET /api/vehicles` - Paginated registry fetch with filters (`type`, `status`, `search`).
- `GET /api/vehicles/:id` - Detailed specs, insurance, and historical trip cards.
- `POST /api/vehicles` - Validate registration number uniqueness and insert.
- `PUT /api/vehicles/:id` - Full update.
- `PATCH /api/vehicles/:id/odometer` - Increment asset mileage.
- `DELETE /api/vehicles/:id` - Mark as retired or remove safely if not referencing trips.
- `GET /api/vehicles/export/csv` - Streams sanitized stream for spreadsheet compatibility.

### Driver Management
- `GET /api/drivers` - List personnel with filter tags (`status`, `safetyScore`, `category`).
- `GET /api/drivers/:id` - View full dossier, phone, email, and expirations.
- `POST /api/drivers` - Register new operator. Validates licensing fields.
- `PUT /api/drivers/:id` - Update driver record.
- `DELETE /api/drivers/:id` - De-allocate or suspend active profile.

### Trip Dispatcher
- `GET /api/trips` - Query active, drafts, or completed trips by timeline.
- `POST /api/trips` - Create trip in `DRAFT` state.
- `POST /api/trips/:id/dispatch` - **Atomic Transaction Dispatch:**
  - *Guard 1:* Confirm Vehicle is `AVAILABLE` (reject if `IN_SHOP` or `ON_TRIP`).
  - *Guard 2:* Confirm Driver is `AVAILABLE` (reject if `SUSPENDED` or `ON_TRIP`).
  - *Guard 3:* Assert licensing criteria (driver license must be active).
  - *Guard 4:* Assert cargo capacity constraints (`cargoWeight` <= `vehicle.capacity`).
  - *Execution:* Swap Vehicle to `ON_TRIP`, swap Driver to `ON_TRIP`, swap Trip to `DISPATCHED`.
- `POST /api/trips/:id/complete` - Re-allocate vehicle & driver to `AVAILABLE`, set status to `COMPLETED`.
- `POST /api/trips/:id/cancel` - Cancel active route, restore assets to `AVAILABLE`, record reason.

### Fleet Maintenance
- `POST /api/maintenance` - Flag Vehicle as `IN_SHOP` and create ticket logs.
- `POST /api/maintenance/:id/close` - Resolve repair task, charge cost centers, set Vehicle to `AVAILABLE`.

### Fuel and Expenses
- `POST /api/expenses/fuel` - Record fuel intake, link with active trip coordinates.
- `POST /api/expenses` - Register peripheral expenses (tolls, parking, miscellaneous).

### Command Analytics & Reporting
- `GET /api/analytics/summary` - Multi-metric calculation engine (Operational Costs, Fuel Efficiency, Vehicle ROI, Monthly revenue).
- `GET /api/reports/financial/pdf` - Generates highly precise print layout of operational overhead.

---

## 6. Authentication & RBAC Flow

TransitOps guarantees multi-tenant security and structural Role Based Access Control:

```
 [ Client Request ] ──► ( Bearer JWT present? )
                                │
                      ┌─────────┴─────────┐
                      ▼ Yes               ▼ No
              ( Verify Signature )   [ 401 Unauthorized ]
                      │
            ┌─────────┴─────────┐
            ▼ Valid             ▼ Expired / Invalid
     ( Fetch User Role )     ( Check Refresh Token in Cookie? )
            │                           │
            │                 ┌─────────┴─────────┐
            │                 ▼ Valid             ▼ Expired / None
            │          [ Issue New JWT ]   [ Redirect to /login ]
            │                 │
            ├◄────────────────┘
            ▼
    ( Check Route Guard ) ──► Is User Role allowed (e.g. FLEET_MANAGER only for Settings)?
            │
            ├───────────────────┐
            ▼ Yes               ▼ No
     [ Route Handler ]   [ 403 Forbidden ]
```

---

## 7. Installation and Development Bootstrapping

Follow these simple, robust instructions to run the absolute full-stack application on port `3000`:

```bash
# 1. Install Node modules from workspace roots
npm install

# 2. Run Database Migrations (using Prisma Client mapping)
npx prisma db push

# 3. Seed the Database with Admin Roles and Assets
npm run seed

# 4. Spin up high-performance full-stack Hot-reload execution (integrated Express + Vite server)
npm run dev
```

---

## 8. Docker Deployment Blueprint

Deploy with 100% production consistency anywhere using standard Docker multi-stage virtualization:

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: transitops-db
    environment:
      POSTGRES_USER: transitops_admin
      POSTGRES_PASSWORD: transitops_secure_password
      POSTGRES_DB: transitops_erp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - transitops-net

  app:
    build:
      context: .
      dockerfile: ./docker/backend.Dockerfile
    container_name: transitops-app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://transitops_admin:transitops_secure_password@db:5432/transitops_erp?schema=public
      - JWT_SECRET=transitops_hyper_secure_hmac_sha256_jwt_secret_token
      - JWT_REFRESH_SECRET=transitops_hyper_secure_refresh_secret_token
      - NODE_ENV=production
    depends_on:
      - db
    networks:
      - transitops-net

volumes:
  postgres_data:

networks:
  transitops-net:
    driver: bridge
```

---

## 9. Unified Environment Variables Blueprint (`.env.example`)
Define all backend configuration keys safely without exposing live production data:

```env
# SERVER SETTINGS
PORT=3000
NODE_ENV=development

# DATABASE DIRECTORY
DATABASE_URL="postgresql://transitops_admin:transitops_secure_password@localhost:5432/transitops_erp?schema=public"

# CRYPTOGRAPHY / AUTHENTICATION SECRETS
JWT_SECRET="transitops_hyper_secure_hmac_sha256_jwt_secret_token"
JWT_REFRESH_SECRET="transitops_hyper_secure_refresh_secret_token"

# GEMINI COGNITIVE LAYER (For Auto-report correlations & AI generation)
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# SELF LINKS
APP_URL="http://localhost:3000"
```

---

### End of Phase 1 Document. Ready for execution.
*Wait for command: "Continue Phase 2"*
