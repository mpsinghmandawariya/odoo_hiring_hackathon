TransitOps – Smart Transport Operations Platform
Enterprise-Grade Transport Operations ERP System
Built in 8 hours at Odoo Hackathon

Steps to Run
Prerequisites
Node.js v18 or higher
npm
1. Install dependencies
npm install
2. Start the development server
npm run dev
Open http://localhost:3000 in your browser.

The database (db-storage.json) is auto-created and seeded with demo data on first run. No database setup required.

Demo Login Credentials
Role	Email	Password
Fleet Manager	manager@transitops.com	Manager@123
Dispatcher	dispatcher@transitops.com	Dispatcher@123
Safety Officer	safety@transitops.com	Safety@123
Financial Analyst	finance@transitops.com	Finance@123
Problem Statement
Many logistics companies still rely on spreadsheets and manual logbooks to manage their transport operations. This leads to:

Scheduling conflicts from double-assigning vehicles or drivers
Underutilized vehicles with no visibility into fleet status
Missed maintenance causing breakdowns and safety risks
Expired driver licenses going unnoticed until it's too late
Inaccurate expense tracking with no per-vehicle cost breakdown
Poor operational visibility with no real-time KPIs or analytics
TransitOps solves this by providing a centralized platform that manages the complete lifecycle of transport operations — from vehicle registration and driver management to dispatching, maintenance, fuel logging, and financial analytics — all with enforced business rules and automated status transitions.

Target Users
Role	Responsibilities
Fleet Manager	Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency
Dispatcher	Creates trips, assigns vehicles and drivers, monitors active deliveries
Safety Officer	Ensures driver compliance, tracks license validity, monitors safety scores
Financial Analyst	Reviews operational expenses, fuel consumption, maintenance costs, and profitability
Features
Modules
Module	Description
Dashboard	Live KPI cards — active vehicles, available vehicles, vehicles in maintenance, active trips, pending trips, drivers on duty, fleet utilization %
Fleet Management	Vehicle registry with CRUD, odometer tracking, insurance/fitness expiry alerts, status management
Driver Management	Driver profiles, license expiry warnings, safety scores, certification tracking
Trip Dispatch Board	Kanban-style board — create, dispatch, complete, and cancel trips with full guard validation
Maintenance	Log vehicles into workshop, track service type, cost, technician; closing ticket restores vehicle to Available
Billing & Fuel	Fuel log auditing, peripheral expense tracking (tolls, parking, misc), per-vehicle operational cost, Vehicle ROI analytics
User Management	Create/edit/deactivate users, reset passwords (Fleet Manager only)
Notifications	Real-time system alerts for trip events, maintenance, and fleet changes
Audit Logs	Full action history with user, role, and timestamp (Fleet Manager only)
Settings	Configure fuel rate, MPG targets, cargo weight limits, freight revenue per mile
Business Rules Enforced
Vehicle registration number must be unique
Retired or In Shop vehicles never appear in dispatch selection
Drivers with expired licenses or Suspended status cannot be assigned to trips
A driver or vehicle already On Trip cannot be assigned to another trip
Cargo weight must not exceed the vehicle's maximum load capacity
Dispatching a trip automatically sets both vehicle and driver to On Trip
Completing a trip automatically sets both vehicle and driver back to Available
Cancelling a dispatched trip restores vehicle and driver to Available
Creating a maintenance record automatically sets vehicle status to In Shop
Closing maintenance restores vehicle to Available
Trip Lifecycle
DRAFT → DISPATCHED → COMPLETED
                  ↘ CANCELLED


