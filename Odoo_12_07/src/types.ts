export enum Role {
  FLEET_MANAGER = "FLEET_MANAGER",
  DISPATCHER = "DISPATCHER",
  SAFETY_OFFICER = "SAFETY_OFFICER",
  FINANCIAL_ANALYST = "FINANCIAL_ANALYST"
}

export enum VehicleStatus {
  AVAILABLE = "AVAILABLE",
  ON_TRIP = "ON_TRIP",
  IN_SHOP = "IN_SHOP",
  RETIRED = "RETIRED"
}

export enum VehicleType {
  TRUCK = "TRUCK",
  VAN = "VAN",
  BUS = "BUS",
  SPECIALIZED = "SPECIALIZED"
}

export enum DriverStatus {
  AVAILABLE = "AVAILABLE",
  ON_TRIP = "ON_TRIP",
  OFF_DUTY = "OFF_DUTY",
  SUSPENDED = "SUSPENDED"
}

export enum TripStatus {
  DRAFT = "DRAFT",
  DISPATCHED = "DISPATCHED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum ExpenseCategory {
  MAINTENANCE = "MAINTENANCE",
  PARKING = "PARKING",
  TOLL = "TOLL",
  FUEL = "FUEL",
  MISCELLANEOUS = "MISCELLANEOUS"
}

export enum MaintenanceStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED"
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Encrypted using bcrypt
  phone?: string;
  employeeId?: string;
  profileImage?: string; // Base64 or standard URL
  role: Role;
  status: "active" | "deactivated" | "inactive";
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: VehicleType;
  capacity: number; // Cargo capacity in kg, or seats
  acquisitionCost: number;
  purchaseDate: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  odometer: number;
  status: VehicleStatus;
}

export interface Driver {
  id: string;
  name: string;
  photoUrl?: string;
  licenseNumber: string;
  category: string; // e.g. Class A CDL
  licenseExpiry: string;
  phone: string;
  email: string;
  safetyScore: number;
  experience: number; // years
  status: DriverStatus;
}

export interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  revenue: number;
  distance: number; // in miles/km
  eta: string;
  status: TripStatus;
  startedAt?: string;
  completedAt?: string;
  cancelledReason?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  workshop: string;
  cost: number;
  date: string;
  technician: string;
  status: MaintenanceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  date: string;
  fuelStation: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  tripId?: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
}

export interface Notification {
  id: string;
  type: string; // "TRIP_COMPLETED", "MAINTENANCE_DUE", "LICENSE_EXPIRING", "SYSTEM_ALERT"
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  details: string;
  timestamp: string;
}
