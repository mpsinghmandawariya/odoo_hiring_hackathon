import { 
  User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Notification, Setting, AuditLog, Role 
} from "../types.ts";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const STORAGE_KEY_AUTH = "transitops_auth_session";

export const getSavedSession = (): AuthState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    return saved ? JSON.parse(saved) : { user: null, accessToken: null, refreshToken: null };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
};

export const saveSession = (session: AuthState) => {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY_AUTH);
};

// --- AUTHENTICATED FETCH WRAPPER WITH AUTOMATIC SILENT REFRESH INTERCEPTOR ---

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const session = getSavedSession();
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  } as Record<string, string>;

  if (session && session.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Handle TokenExpired with silent automatic refresh
  if (res.status === 401) {
    try {
      // Avoid infinite loops by cloning response
      const errClone = res.clone();
      const errData = await errClone.json();
      
      if (errData.error === "TokenExpired" && session && session.refreshToken) {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: session.refreshToken })
        });

        if (refreshRes.ok) {
          const { accessToken } = await refreshRes.json();
          session.accessToken = accessToken;
          saveSession(session);

          // Retry the original request
          headers["Authorization"] = `Bearer ${accessToken}`;
          res = await fetch(url, { ...options, headers });
        } else {
          // Token refresh failed or revoked, redirect to login by clearing session
          clearSession();
          window.dispatchEvent(new Event("auth_session_expired"));
        }
      }
    } catch (e) {
      console.error("Token refresh interceptor failed", e);
    }
  }

  return res;
}

// --- SECURE AUTHENTICATION API CALLS ---

export async function loginReal(email: string, password: string, role: Role): Promise<AuthState> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function registerReal(userData: Partial<User> & { password?: string }): Promise<any> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Registration failed");
  }
  return res.json();
}

export async function forgotPasswordReal(email: string): Promise<any> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export async function resetPasswordReal(token: string, password: string): Promise<any> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Password reset failed");
  }
  return res.json();
}

export async function logoutReal(refreshToken: string | null): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
  } catch (e) {
    console.error("Logout request failed silently", e);
  }
  clearSession();
}

// Legacy helper support
export async function loginSimulated(email: string, name: string, role: Role): Promise<AuthState> {
  return loginReal(email, "Manager@123", role);
}

// --- SECURE USER MANAGEMENT (FLEET MANAGER ONLY) ---

export async function getUsers(params?: { search?: string; role?: string; status?: string }): Promise<User[]> {
  const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
  const res = await fetchWithAuth(`/api/users${query}`);
  if (!res.ok) throw new Error("Failed to fetch users catalog");
  return res.json();
}

export async function createUser(user: Partial<User> & { password?: string }): Promise<User> {
  const res = await fetchWithAuth("/api/users", {
    method: "POST",
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create user profile");
  }
  return res.json();
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  const res = await fetchWithAuth(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update user profile");
  }
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete user profile");
  }
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  const res = await fetchWithAuth(`/api/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to reset password");
  }
}

export async function toggleUserStatus(id: string, status: "active" | "deactivated"): Promise<void> {
  const res = await fetchWithAuth(`/api/users/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to switch user status");
  }
}

// --- SECURE MODEL-BASED REST ENDPOINTS WITH AUTHENTICATION ---

export async function resetDatabase(): Promise<void> {
  const res = await fetchWithAuth("/api/admin/reset", { method: "POST" });
  if (!res.ok) throw new Error("Reset failed");
}

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await fetchWithAuth("/api/vehicles");
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
}

export async function createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetchWithAuth("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(vehicle)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create vehicle");
  }
  return res.json();
}

export async function updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetchWithAuth(`/api/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(vehicle)
  });
  if (!res.ok) throw new Error("Failed to update vehicle");
  return res.json();
}

export async function updateOdometer(id: string, odometer: number): Promise<Vehicle> {
  const res = await fetchWithAuth(`/api/vehicles/${id}/odometer`, {
    method: "PATCH",
    body: JSON.stringify({ odometer })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update odometer");
  }
  return res.json();
}

export async function deleteVehicle(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/vehicles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete vehicle");
}

// Drivers
export async function getDrivers(): Promise<Driver[]> {
  const res = await fetchWithAuth("/api/drivers");
  if (!res.ok) throw new Error("Failed to fetch drivers");
  return res.json();
}

export async function createDriver(driver: Partial<Driver>): Promise<Driver> {
  const res = await fetchWithAuth("/api/drivers", {
    method: "POST",
    body: JSON.stringify(driver)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create driver");
  }
  return res.json();
}

export async function updateDriver(id: string, driver: Partial<Driver>): Promise<Driver> {
  const res = await fetchWithAuth(`/api/drivers/${id}`, {
    method: "PUT",
    body: JSON.stringify(driver)
  });
  if (!res.ok) throw new Error("Failed to update driver");
  return res.json();
}

export async function deleteDriver(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/drivers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete driver");
}

// Trips
export async function getTrips(): Promise<Trip[]> {
  const res = await fetchWithAuth("/api/trips");
  if (!res.ok) throw new Error("Failed to fetch trips");
  return res.json();
}

export async function createTrip(trip: Partial<Trip>): Promise<Trip> {
  const res = await fetchWithAuth("/api/trips", {
    method: "POST",
    body: JSON.stringify(trip)
  });
  if (!res.ok) throw new Error("Failed to create trip");
  return res.json();
}

export async function dispatchTrip(id: string): Promise<any> {
  const res = await fetchWithAuth(`/api/trips/${id}/dispatch`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to dispatch trip");
  }
  return res.json();
}

export async function completeTrip(id: string): Promise<any> {
  const res = await fetchWithAuth(`/api/trips/${id}/complete`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to complete trip");
  return res.json();
}

export async function cancelTrip(id: string, reason: string): Promise<any> {
  const res = await fetchWithAuth(`/api/trips/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error("Failed to cancel trip");
  return res.json();
}

// Maintenance
export async function getMaintenance(): Promise<MaintenanceLog[]> {
  const res = await fetchWithAuth("/api/maintenance");
  if (!res.ok) throw new Error("Failed to fetch maintenance");
  return res.json();
}

export async function createMaintenance(log: { vehicleId: string; serviceType: string; workshop: string; cost: number; technician: string }): Promise<MaintenanceLog> {
  const res = await fetchWithAuth("/api/maintenance", {
    method: "POST",
    body: JSON.stringify(log)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create maintenance log");
  }
  return res.json();
}

export async function closeMaintenance(id: string): Promise<any> {
  const res = await fetchWithAuth(`/api/maintenance/${id}/close`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to close maintenance");
  return res.json();
}

// Fuel logs
export async function getFuelLogs(): Promise<FuelLog[]> {
  const res = await fetchWithAuth("/api/fuel");
  if (!res.ok) throw new Error("Failed to fetch fuel logs");
  return res.json();
}

export async function createFuelLog(log: Partial<FuelLog>): Promise<FuelLog> {
  const res = await fetchWithAuth("/api/fuel", {
    method: "POST",
    body: JSON.stringify(log)
  });
  if (!res.ok) throw new Error("Failed to create fuel log");
  return res.json();
}

// Expenses
export async function getExpenses(): Promise<Expense[]> {
  const res = await fetchWithAuth("/api/expenses");
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(expense: Partial<Expense>): Promise<Expense> {
  const res = await fetchWithAuth("/api/expenses", {
    method: "POST",
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

// Notifications
export async function getNotifications(): Promise<Notification[]> {
  const res = await fetchWithAuth("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark notification as read");
}

// Settings
export async function getSettings(): Promise<Record<string, string>> {
  const res = await fetchWithAuth("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function saveSettings(settings: Record<string, string>): Promise<Record<string, string>> {
  const res = await fetchWithAuth("/api/settings", {
    method: "POST",
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error("Failed to save settings");
  return res.json();
}

// Audit logs
export async function getAuditLogs(): Promise<AuditLog[]> {
  const res = await fetchWithAuth("/api/audit");
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}
