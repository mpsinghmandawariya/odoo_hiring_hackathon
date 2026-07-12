import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JSONDatabase } from "./src/server/db.ts";
import { 
  Role, VehicleStatus, DriverStatus, TripStatus, ExpenseCategory, MaintenanceStatus, 
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Notification, AuditLog 
} from "./src/types.ts";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Helper to log user audits
  const createAudit = (userId: string, userName: string, role: Role, action: string, details: string) => {
    const logs = JSONDatabase.get("auditLogs");
    const newLog: AuditLog = {
      id: "a-" + Date.now(),
      userId,
      userName,
      userRole: role,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    JSONDatabase.set("auditLogs", [newLog, ...logs]);
  };

  // Helper to push system notifications
  const pushNotification = (type: string, message: string) => {
    const notes = JSONDatabase.get("notifications");
    const newNote: Notification = {
      id: "n-" + Date.now(),
      type,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    JSONDatabase.set("notifications", [newNote, ...notes]);
  };

  // --- API ROUTES ---

  const JWT_SECRET = process.env.JWT_SECRET || "transitops-access-secret-token-key-2026";
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "transitops-refresh-secret-token-key-2026";

  const refreshTokensDb: { token: string; userId: string; expiry: number }[] = [];
  const passwordResetsDb: { email: string; token: string; expiry: number }[] = [];

  // Authentication middleware
  const authenticateJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access token required" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ error: "TokenExpired", message: "Access token has expired." });
        }
        return res.status(401).json({ error: "InvalidToken", message: "Invalid access token." });
      }
      req.user = decoded;
      
      // Safety check: is user active?
      const users = JSONDatabase.get("users") || [];
      const userObj = users.find((u: any) => u.id === decoded.id);
      if (userObj && userObj.status === "deactivated") {
        return res.status(403).json({ error: "Your account has been disabled. Contact administrator." });
      }
      
      next();
    });
  };

  // Authorization middleware
  const authorizeRoles = (...roles: Role[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "403 Forbidden: Insufficient role permissions" });
      }
      next();
    };
  };

  // --- AUTH ROUTES ---

  // Auth: Real JWT password-encrypted database login
  app.post("/api/auth/login", (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Please populate all login fields." });
    }

    const users = JSONDatabase.get("users") || [];
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password || "");
    if (!passwordMatch) {
      return res.status(400).json({ error: "Incorrect password." });
    }

    if (user.role !== role) {
      return res.status(400).json({ error: "Selected role does not match your account." });
    }

    if (user.status === "deactivated") {
      return res.status(403).json({ error: "Your account has been disabled. Contact administrator." });
    }

    const accessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    refreshTokensDb.push({
      token: refreshToken,
      userId: user.id,
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    user.lastLogin = new Date().toISOString();
    JSONDatabase.set("users", users);

    createAudit(user.id, user.name, user.role, "LOGIN", `Logged in successfully as ${user.role}`);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        employeeId: user.employeeId,
        profileImage: user.profileImage,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
      },
      accessToken,
      refreshToken
    });
  });

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone, employeeId, role, profileImage } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Please populate all required registration fields." });
    }

    const users = JSONDatabase.get("users") || [];
    const emailExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: "Email already exists in database." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser: any = {
      id: "u-" + Date.now(),
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      employeeId: employeeId || ("EMP-" + Math.floor(1000 + Math.random() * 9000)),
      profileImage: profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      role: role as Role,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    JSONDatabase.set("users", [...users, newUser]);
    
    createAudit(newUser.id, newUser.name, newUser.role, "REGISTER", `Self-registered as ${newUser.role}`);
    
    return res.status(201).json({
      status: "success",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  });

  // Auth: Token Refresh
  app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const tokenRecordIdx = refreshTokensDb.findIndex(r => r.token === refreshToken);
    if (tokenRecordIdx === -1) {
      return res.status(403).json({ error: "Refresh token is invalid or revoked" });
    }

    const record = refreshTokensDb[tokenRecordIdx];
    if (Date.now() > record.expiry) {
      refreshTokensDb.splice(tokenRecordIdx, 1);
      return res.status(403).json({ error: "Refresh token has expired. Please login again." });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: "Refresh token validation failed" });
      }

      const users = JSONDatabase.get("users") || [];
      const user = users.find((u: any) => u.id === decoded.id);
      if (!user) {
        return res.status(404).json({ error: "Associated user not found" });
      }

      if (user.status === "deactivated") {
        return res.status(403).json({ error: "User account deactivated" });
      }

      const accessToken = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      return res.json({ accessToken });
    });
  });

  // Auth: Forgot Password Token Generation
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const users = JSONDatabase.get("users") || [];
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: "No account registered with this email." });
    }

    const token = "reset-" + Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    passwordResetsDb.push({
      email: user.email,
      token,
      expiry
    });

    return res.json({
      status: "success",
      message: "Reset token generated successfully.",
      token // Exposed for UI convenience in the mock flow
    });
  });

  // Auth: Reset Password with Token
  app.post("/api/auth/reset-password", (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    const resetIdx = passwordResetsDb.findIndex(r => r.token === token);
    if (resetIdx === -1) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const record = passwordResetsDb[resetIdx];
    if (Date.now() > record.expiry) {
      passwordResetsDb.splice(resetIdx, 1);
      return res.status(400).json({ error: "Reset token has expired." });
    }

    const users = JSONDatabase.get("users") || [];
    const userIdx = users.findIndex((u: any) => u.email.toLowerCase() === record.email.toLowerCase());

    if (userIdx === -1) {
      return res.status(404).json({ error: "Associated user not found." });
    }

    users[userIdx].password = bcrypt.hashSync(password, 10);
    users[userIdx].updatedAt = new Date().toISOString();
    JSONDatabase.set("users", users);

    passwordResetsDb.splice(resetIdx, 1);

    createAudit(users[userIdx].id, users[userIdx].name, users[userIdx].role, "PASSWORD_RESET", "Password updated via recovery token");

    return res.json({ status: "success", message: "Password updated successfully." });
  });

  // Auth: Logout
  app.post("/api/auth/logout", (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const idx = refreshTokensDb.findIndex(r => r.token === refreshToken);
      if (idx !== -1) {
        refreshTokensDb.splice(idx, 1);
      }
    }
    return res.json({ status: "success", message: "Logged out successfully" });
  });

  // --- USER MANAGEMENT (FLEET MANAGER ONLY) ---

  app.get("/api/users", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    let users = JSONDatabase.get("users") || [];
    const { search, role, status } = req.query;

    if (search) {
      const q = (search as string).toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        (u.employeeId && u.employeeId.toLowerCase().includes(q))
      );
    }

    if (role) {
      users = users.filter(u => u.role === role);
    }

    if (status) {
      users = users.filter(u => u.status === status);
    }

    // Return users list without raw hashes for safety
    const safeUsers = users.map(({ password, ...u }) => u);
    return res.json(safeUsers);
  });

  app.post("/api/users", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const { name, email, password, role, phone, employeeId, profileImage } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const users = JSONDatabase.get("users") || [];
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const newUser: any = {
      id: "u-" + Date.now(),
      name,
      email,
      password: bcrypt.hashSync(password, 10),
      phone: phone || "",
      employeeId: employeeId || "EMP-" + Math.floor(1000 + Math.random() * 9000),
      profileImage: profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      role: role as Role,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    JSONDatabase.set("users", [...users, newUser]);

    createAudit((req as any).user.id, (req as any).user.name, (req as any).user.role, "CREATE_USER", `Created user ${newUser.name} with role ${newUser.role}`);

    const { password: _, ...safeUser } = newUser;
    return res.status(201).json(safeUser);
  });

  app.put("/api/users/:id", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const { id } = req.params;
    const { name, email, role, phone, employeeId, profileImage, status } = req.body;

    const users = JSONDatabase.get("users") || [];
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields
    const updated = {
      ...users[idx],
      name: name || users[idx].name,
      email: email || users[idx].email,
      role: role || users[idx].role,
      phone: phone !== undefined ? phone : users[idx].phone,
      employeeId: employeeId !== undefined ? employeeId : users[idx].employeeId,
      profileImage: profileImage !== undefined ? profileImage : users[idx].profileImage,
      status: status || users[idx].status,
      updatedAt: new Date().toISOString()
    };

    users[idx] = updated;
    JSONDatabase.set("users", users);

    createAudit((req as any).user.id, (req as any).user.name, (req as any).user.role, "UPDATE_USER", `Updated user details for ${updated.name}`);

    const { password: _, ...safeUser } = updated;
    return res.json(safeUser);
  });

  app.delete("/api/users/:id", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const { id } = req.params;
    if (id === (req as any).user.id) {
      return res.status(400).json({ error: "You cannot self-delete your own active account" });
    }

    const users = JSONDatabase.get("users") || [];
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    const deletedUser = users[idx];
    users.splice(idx, 1);
    JSONDatabase.set("users", users);

    createAudit((req as any).user.id, (req as any).user.name, (req as any).user.role, "DELETE_USER", `Deleted user account for ${deletedUser.name}`);

    return res.json({ status: "success", message: `Deleted user ${deletedUser.name}` });
  });

  app.post("/api/users/:id/reset-password", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "New password is required" });
    }

    const users = JSONDatabase.get("users") || [];
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    users[idx].password = bcrypt.hashSync(password, 10);
    users[idx].updatedAt = new Date().toISOString();
    JSONDatabase.set("users", users);

    createAudit((req as any).user.id, (req as any).user.name, (req as any).user.role, "RESET_USER_PASSWORD", `Manually reset password for user ${users[idx].name}`);

    return res.json({ status: "success", message: `Reset password for user ${users[idx].name}` });
  });

  app.post("/api/users/:id/status", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // "active" or "deactivated"
    if (id === (req as any).user.id) {
      return res.status(400).json({ error: "You cannot self-deactivate your own account" });
    }

    const users = JSONDatabase.get("users") || [];
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    users[idx].status = status;
    users[idx].updatedAt = new Date().toISOString();
    JSONDatabase.set("users", users);

    createAudit((req as any).user.id, (req as any).user.name, (req as any).user.role, "TOGGLE_USER_STATUS", `Set status of user ${users[idx].name} to ${status}`);

    return res.json({ status: "success", user: { id: users[idx].id, name: users[idx].name, status: users[idx].status } });
  });

  // DB Reset
  app.post("/api/admin/reset", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const data = JSONDatabase.reset();
    createAudit((req as any).user.id, (req as any).user.name, (req as any).user.role, "DB_RESET", "Re-seeded and wiped database back to stable original state");
    return res.json({ status: "success", data });
  });

  // Vehicles CRUD
  app.get("/api/vehicles", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER), (req, res) => {
    return res.json(JSONDatabase.get("vehicles"));
  });

  app.post("/api/vehicles", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const vehicles = JSONDatabase.get("vehicles");
    const newVehicle: Vehicle = {
      id: "v-" + Date.now(),
      ...req.body,
      odometer: Number(req.body.odometer || 0),
      capacity: Number(req.body.capacity || 0),
      acquisitionCost: Number(req.body.acquisitionCost || 0)
    };

    // Check unique reg
    if (vehicles.some(v => v.regNumber === newVehicle.regNumber)) {
      return res.status(400).json({ error: "Registration number already exists." });
    }

    JSONDatabase.set("vehicles", [...vehicles, newVehicle]);
    pushNotification("SYSTEM_ALERT", `New vehicle added: ${newVehicle.name} (${newVehicle.regNumber})`);
    return res.status(201).json(newVehicle);
  });

  app.put("/api/vehicles/:id", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const vehicles = JSONDatabase.get("vehicles");
    const idx = vehicles.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Vehicle not found" });

    const updated = { 
      ...vehicles[idx], 
      ...req.body,
      odometer: Number(req.body.odometer ?? vehicles[idx].odometer),
      capacity: Number(req.body.capacity ?? vehicles[idx].capacity),
      acquisitionCost: Number(req.body.acquisitionCost ?? vehicles[idx].acquisitionCost)
    };
    vehicles[idx] = updated;
    JSONDatabase.set("vehicles", vehicles);
    return res.json(updated);
  });

  app.patch("/api/vehicles/:id/odometer", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER), (req, res) => {
    const vehicles = JSONDatabase.get("vehicles");
    const idx = vehicles.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Vehicle not found" });

    const newOdo = Number(req.body.odometer);
    if (isNaN(newOdo) || newOdo < vehicles[idx].odometer) {
      return res.status(400).json({ error: "Odometer reading must be higher than current." });
    }

    vehicles[idx].odometer = newOdo;
    JSONDatabase.set("vehicles", vehicles);
    return res.json(vehicles[idx]);
  });

  app.delete("/api/vehicles/:id", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const vehicles = JSONDatabase.get("vehicles");
    const filtered = vehicles.filter(v => v.id !== req.params.id);
    if (vehicles.length === filtered.length) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    JSONDatabase.set("vehicles", filtered);
    return res.json({ status: "success" });
  });

  // Drivers CRUD
  app.get("/api/drivers", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.DISPATCHER), (req, res) => {
    return res.json(JSONDatabase.get("drivers"));
  });

  app.post("/api/drivers", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.SAFETY_OFFICER), (req, res) => {
    const drivers = JSONDatabase.get("drivers");
    const newDriver: Driver = {
      id: "d-" + Date.now(),
      ...req.body,
      safetyScore: Number(req.body.safetyScore ?? 100),
      experience: Number(req.body.experience ?? 1)
    };

    if (drivers.some(d => d.licenseNumber === newDriver.licenseNumber)) {
      return res.status(400).json({ error: "License number already exists." });
    }

    JSONDatabase.set("drivers", [...drivers, newDriver]);
    pushNotification("SYSTEM_ALERT", `New driver registered: ${newDriver.name}`);
    return res.status(201).json(newDriver);
  });

  app.put("/api/drivers/:id", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.SAFETY_OFFICER), (req, res) => {
    const drivers = JSONDatabase.get("drivers");
    const idx = drivers.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Driver not found" });

    const updated = {
      ...drivers[idx],
      ...req.body,
      safetyScore: Number(req.body.safetyScore ?? drivers[idx].safetyScore),
      experience: Number(req.body.experience ?? drivers[idx].experience)
    };
    drivers[idx] = updated;
    JSONDatabase.set("drivers", drivers);
    return res.json(updated);
  });

  app.delete("/api/drivers/:id", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    const drivers = JSONDatabase.get("drivers");
    const filtered = drivers.filter(d => d.id !== req.params.id);
    JSONDatabase.set("drivers", filtered);
    return res.json({ status: "success" });
  });

  // Trips CRUD & Operations
  app.get("/api/trips", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST), (req, res) => {
    return res.json(JSONDatabase.get("trips"));
  });

  app.post("/api/trips", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER), (req, res) => {
    const trips = JSONDatabase.get("trips");
    const newTrip: Trip = {
      id: "t-" + Date.now(),
      tripNumber: "TR-" + Math.floor(1000 + Math.random() * 9000),
      ...req.body,
      cargoWeight: Number(req.body.cargoWeight || 0),
      revenue: Number(req.body.revenue || 0),
      distance: Number(req.body.distance || 0),
      status: TripStatus.DRAFT
    };

    JSONDatabase.set("trips", [...trips, newTrip]);
    return res.status(201).json(newTrip);
  });

  // Dispatch Trip (Guards, validations and atomic update)
  app.post("/api/trips/:id/dispatch", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER), (req, res) => {
    const trips = JSONDatabase.get("trips");
    const vehicles = JSONDatabase.get("vehicles");
    const drivers = JSONDatabase.get("drivers");

    const tIdx = trips.findIndex(t => t.id === req.params.id);
    if (tIdx === -1) return res.status(404).json({ error: "Trip not found" });
    const trip = trips[tIdx];

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver = drivers.find(d => d.id === trip.driverId);

    if (!vehicle) return res.status(400).json({ error: "Assigned vehicle no longer exists" });
    if (!driver) return res.status(400).json({ error: "Assigned driver no longer exists" });

    // Guards
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      return res.status(400).json({ error: `Vehicle is currently ${vehicle.status}. Must be AVAILABLE.` });
    }
    if (driver.status !== DriverStatus.AVAILABLE) {
      return res.status(400).json({ error: `Driver is currently ${driver.status}. Must be AVAILABLE.` });
    }
    if (trip.cargoWeight > vehicle.capacity) {
      return res.status(400).json({ error: `Cargo weight (${trip.cargoWeight} kg) exceeds vehicle capacity (${vehicle.capacity} kg).` });
    }

    // Dynamic warning checking license
    const licenseExpiry = new Date(driver.licenseExpiry);
    const today = new Date();
    if (licenseExpiry <= today) {
      return res.status(400).json({ error: `Driver license expired on ${driver.licenseExpiry}. Cannot dispatch.` });
    }

    // Atomic Updates
    trip.status = TripStatus.DISPATCHED;
    trip.startedAt = new Date().toISOString();
    vehicle.status = VehicleStatus.ON_TRIP;
    driver.status = DriverStatus.ON_TRIP;

    JSONDatabase.set("trips", trips);
    JSONDatabase.set("vehicles", vehicles);
    JSONDatabase.set("drivers", drivers);

    pushNotification("SYSTEM_ALERT", `Trip #${trip.tripNumber} Dispatched. Vehicle and Driver are marked ON_TRIP.`);
    return res.json({ trip, vehicle, driver });
  });

  // Complete Trip
  app.post("/api/trips/:id/complete", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER), (req, res) => {
    const trips = JSONDatabase.get("trips");
    const vehicles = JSONDatabase.get("vehicles");
    const drivers = JSONDatabase.get("drivers");

    const tIdx = trips.findIndex(t => t.id === req.params.id);
    if (tIdx === -1) return res.status(404).json({ error: "Trip not found" });
    const trip = trips[tIdx];

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver = drivers.find(d => d.id === trip.driverId);

    trip.status = TripStatus.COMPLETED;
    trip.completedAt = new Date().toISOString();

    if (vehicle) {
      vehicle.status = VehicleStatus.AVAILABLE;
      // Increment odometer by trip distance
      vehicle.odometer += Math.round(Number(trip.distance));
    }
    if (driver) {
      driver.status = DriverStatus.AVAILABLE;
    }

    JSONDatabase.set("trips", trips);
    JSONDatabase.set("vehicles", vehicles);
    JSONDatabase.set("drivers", drivers);

    pushNotification("TRIP_COMPLETED", `Trip #${trip.tripNumber} completed. Revenue: ₹${trip.revenue}. Odometer updated.`);
    return res.json({ trip, vehicle, driver });
  });

  // Cancel Trip
  app.post("/api/trips/:id/cancel", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER), (req, res) => {
    const trips = JSONDatabase.get("trips");
    const vehicles = JSONDatabase.get("vehicles");
    const drivers = JSONDatabase.get("drivers");
    const { reason } = req.body;

    const tIdx = trips.findIndex(t => t.id === req.params.id);
    if (tIdx === -1) return res.status(404).json({ error: "Trip not found" });
    const trip = trips[tIdx];

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver = drivers.find(d => d.id === trip.driverId);

    trip.status = TripStatus.CANCELLED;
    trip.cancelledReason = reason || "Unspecified dispatcher cancellation";

    if (vehicle && vehicle.status === VehicleStatus.ON_TRIP) {
      vehicle.status = VehicleStatus.AVAILABLE;
    }
    if (driver && driver.status === DriverStatus.ON_TRIP) {
      driver.status = DriverStatus.AVAILABLE;
    }

    JSONDatabase.set("trips", trips);
    JSONDatabase.set("vehicles", vehicles);
    JSONDatabase.set("drivers", drivers);

    pushNotification("SYSTEM_ALERT", `Trip #${trip.tripNumber} CANCELLED. Reason: ${trip.cancelledReason}`);
    return res.json({ trip, vehicle, driver });
  });

  // Maintenance CRUD
  app.get("/api/maintenance", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER), (req, res) => {
    return res.json(JSONDatabase.get("maintenanceLogs"));
  });

  app.post("/api/maintenance", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER), (req, res) => {
    const logs = JSONDatabase.get("maintenanceLogs");
    const vehicles = JSONDatabase.get("vehicles");

    const { vehicleId, serviceType, workshop, cost, technician } = req.body;

    const vIdx = vehicles.findIndex(v => v.id === vehicleId);
    if (vIdx === -1) return res.status(404).json({ error: "Vehicle not found" });

    // Mark in shop
    vehicles[vIdx].status = VehicleStatus.IN_SHOP;

    const newLog: MaintenanceLog = {
      id: "m-" + Date.now(),
      vehicleId,
      serviceType,
      workshop,
      cost: Number(cost || 0),
      date: new Date().toISOString().split("T")[0],
      technician,
      status: MaintenanceStatus.ACTIVE
    };

    JSONDatabase.set("maintenanceLogs", [...logs, newLog]);
    JSONDatabase.set("vehicles", vehicles);

    pushNotification("MAINTENANCE_DUE", `${vehicles[vIdx].name} logged in workshop for: ${serviceType}`);
    return res.status(201).json(newLog);
  });

  app.post("/api/maintenance/:id/close", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER), (req, res) => {
    const logs = JSONDatabase.get("maintenanceLogs");
    const vehicles = JSONDatabase.get("vehicles");
    const expenses = JSONDatabase.get("expenses");

    const mIdx = logs.findIndex(m => m.id === req.params.id);
    if (mIdx === -1) return res.status(404).json({ error: "Maintenance log not found" });
    const log = logs[mIdx];

    log.status = MaintenanceStatus.COMPLETED;

    const vIdx = vehicles.findIndex(v => v.id === log.vehicleId);
    if (vIdx !== -1) {
      vehicles[vIdx].status = VehicleStatus.AVAILABLE;
    }

    // Register related maintenance expense
    const newExpense: Expense = {
      id: "e-m-" + Date.now(),
      vehicleId: log.vehicleId,
      amount: log.cost,
      category: ExpenseCategory.MAINTENANCE,
      description: `Maintenance complete: ${log.serviceType} at ${log.workshop}`,
      date: new Date().toISOString().split("T")[0]
    };

    JSONDatabase.set("maintenanceLogs", logs);
    JSONDatabase.set("vehicles", vehicles);
    JSONDatabase.set("expenses", [...expenses, newExpense]);

    pushNotification("SYSTEM_ALERT", `Maintenance resolved for vehicle. Registered ₹${log.cost} maintenance cost.`);
    return res.json({ log, expense: newExpense });
  });

  // Fuel Logs CRUD
  app.get("/api/fuel", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST, Role.DISPATCHER), (req, res) => {
    return res.json(JSONDatabase.get("fuelLogs"));
  });

  app.post("/api/fuel", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST, Role.DISPATCHER), (req, res) => {
    const logs = JSONDatabase.get("fuelLogs");
    const expenses = JSONDatabase.get("expenses");

    const newLog: FuelLog = {
      id: "f-" + Date.now(),
      ...req.body,
      liters: Number(req.body.liters || 0),
      cost: Number(req.body.cost || 0),
      date: req.body.date || new Date().toISOString().split("T")[0]
    };

    // Register related fuel expense
    const newExpense: Expense = {
      id: "e-f-" + Date.now(),
      vehicleId: newLog.vehicleId,
      tripId: newLog.tripId,
      amount: newLog.cost,
      category: ExpenseCategory.FUEL,
      description: `Fuel fill-up: ${newLog.liters}L at ${newLog.fuelStation}`,
      date: newLog.date
    };

    JSONDatabase.set("fuelLogs", [...logs, newLog]);
    JSONDatabase.set("expenses", [...expenses, newExpense]);

    return res.status(201).json(newLog);
  });

  // Peripheral Expenses CRUD
  app.get("/api/expenses", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST), (req, res) => {
    return res.json(JSONDatabase.get("expenses"));
  });

  app.post("/api/expenses", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST), (req, res) => {
    const expenses = JSONDatabase.get("expenses");
    const newExpense: Expense = {
      id: "e-" + Date.now(),
      ...req.body,
      amount: Number(req.body.amount || 0),
      date: req.body.date || new Date().toISOString().split("T")[0]
    };

    JSONDatabase.set("expenses", [...expenses, newExpense]);
    return res.status(201).json(newExpense);
  });

  // Notifications
  app.get("/api/notifications", authenticateJWT, (req, res) => {
    return res.json(JSONDatabase.get("notifications"));
  });

  app.post("/api/notifications/:id/read", authenticateJWT, (req, res) => {
    const notes = JSONDatabase.get("notifications");
    const idx = notes.findIndex(n => n.id === req.params.id);
    if (idx !== -1) {
      notes[idx].isRead = true;
      JSONDatabase.set("notifications", notes);
    }
    return res.json({ status: "success" });
  });

  // Settings
  app.get("/api/settings", authenticateJWT, (req, res) => {
    return res.json(JSONDatabase.get("settings"));
  });

  app.post("/api/settings", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    JSONDatabase.set("settings", req.body);
    return res.json(req.body);
  });

  // Audit Logs
  app.get("/api/audit", authenticateJWT, authorizeRoles(Role.FLEET_MANAGER), (req, res) => {
    return res.json(JSONDatabase.get("auditLogs"));
  });

  // --- VITE MIDDLEWARE ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TransitOps ERP running at http://localhost:${PORT}`);
  });
}

startServer();
