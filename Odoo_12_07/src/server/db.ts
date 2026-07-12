import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { 
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Notification, AuditLog, User,
  VehicleStatus, VehicleType, DriverStatus, TripStatus, ExpenseCategory, MaintenanceStatus, Role
} from "../types.ts";

const DB_FILE = path.join(process.cwd(), "db-storage.json");

interface DatabaseSchema {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: Record<string, string>;
  users: User[];
}

const DEFAULT_DB: DatabaseSchema = {
  vehicles: [],
  drivers: [],
  trips: [],
  maintenanceLogs: [],
  fuelLogs: [],
  expenses: [],
  notifications: [],
  auditLogs: [],
  settings: {
    standardFuelRate: "1.52",
    targetMpg: "7.5",
    cargoWeightLimit: "30000",
    freightRevenuePerMile: "3.88"
  },
  users: [
    {
      id: "u-1",
      name: "Alex Reynolds",
      email: "manager@transitops.com",
      password: bcrypt.hashSync("Manager@123", 10),
      phone: "+1 (512) 555-0100",
      employeeId: "EMP-MGR-001",
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      role: Role.FLEET_MANAGER,
      status: "active",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
      lastLogin: "2026-07-11T21:00:00.000Z"
    },
    {
      id: "u-2",
      name: "Dennis Hopper",
      email: "dispatcher@transitops.com",
      password: bcrypt.hashSync("Dispatcher@123", 10),
      phone: "+1 (312) 555-0102",
      employeeId: "EMP-DSP-002",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      role: Role.DISPATCHER,
      status: "active",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
      lastLogin: "2026-07-11T20:30:00.000Z"
    },
    {
      id: "u-3",
      name: "Sarah Connor",
      email: "safety@transitops.com",
      password: bcrypt.hashSync("Safety@123", 10),
      phone: "+1 (415) 555-0103",
      employeeId: "EMP-SAF-003",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      role: Role.SAFETY_OFFICER,
      status: "active",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
      lastLogin: "2026-07-11T19:45:00.000Z"
    },
    {
      id: "u-4",
      name: "Edward Jones",
      email: "finance@transitops.com",
      password: bcrypt.hashSync("Finance@123", 10),
      phone: "+1 (212) 555-0104",
      employeeId: "EMP-FIN-004",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      role: Role.FINANCIAL_ANALYST,
      status: "active",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
      lastLogin: "2026-07-11T18:15:00.000Z"
    }
  ]
};

export class JSONDatabase {
  private static load(): DatabaseSchema {
    try {
      let mustReset = false;
      if (!fs.existsSync(DB_FILE)) {
        mustReset = true;
      } else {
        const raw = fs.readFileSync(DB_FILE, "utf-8").trim();
        if (!raw) {
          mustReset = true;
        } else {
          const parsed = JSON.parse(raw);
          // Force reset if users array is missing or empty to ensure authentication exists
          if (!parsed.users || parsed.users.length === 0) {
            mustReset = true;
          } else {
            // Ensure all required keys exist to prevent undefined properties
            const requiredKeys: (keyof DatabaseSchema)[] = [
              "vehicles", "drivers", "trips", "maintenanceLogs", "fuelLogs", 
              "expenses", "notifications", "auditLogs", "settings", "users"
            ];
            for (const key of requiredKeys) {
              if (parsed[key] === undefined) {
                parsed[key] = DEFAULT_DB[key];
                mustReset = true;
              }
            }
            if (mustReset) {
              fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
              return parsed;
            }
          }
        }
      }

      if (mustReset) {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
        return DEFAULT_DB;
      }

      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load JSON DB, reverting to default & healing file.", e);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
      } catch (writeErr) {
        console.error("Failed to write healed DB file:", writeErr);
      }
      return DEFAULT_DB;
    }
  }

  private static save(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Failed to write JSON DB file.", e);
    }
  }

  static get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    const db = this.load();
    return db[key];
  }

  static set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    const db = this.load();
    db[key] = value;
    this.save(db);
  }

  static reset() {
    this.save(DEFAULT_DB);
    return DEFAULT_DB;
  }
}
