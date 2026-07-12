import { useState, useEffect } from "react";
import { 
  getVehicles, createVehicle, updateVehicle, updateOdometer,
  getDrivers, createDriver, updateDriver,
  getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip,
  getMaintenance, createMaintenance, closeMaintenance,
  getFuelLogs, createFuelLog,
  getExpenses, createExpense,
  getNotifications, markNotificationAsRead,
  getSettings, saveSettings,
  resetDatabase,
  getSavedSession, saveSession, logoutReal
} from "./lib/state.ts";

import { 
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Notification, Role, User 
} from "./types.ts";

import Sidebar from "./components/Sidebar.tsx";
import Navbar from "./components/Navbar.tsx";
import LoginView from "./components/LoginView.tsx";
import DashboardView from "./components/DashboardView.tsx";
import VehiclesView from "./components/VehiclesView.tsx";
import DriversView from "./components/DriversView.tsx";
import TripsView from "./components/TripsView.tsx";
import MaintenanceView from "./components/MaintenanceView.tsx";
import BillingView from "./components/BillingView.tsx";
import SettingsView from "./components/SettingsView.tsx";
import ProfileView from "./components/ProfileView.tsx";

import { BrainCircuit } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [userRole, setUserRole] = useState<Role>(Role.FLEET_MANAGER);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("transitops_theme");
      return (saved as "dark" | "light") || "dark";
    } catch {
      return "dark";
    }
  });

  // Track theme changes on root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("transitops_theme", nextTheme);
    } catch (e) {
      console.error("Failed to save theme in storage", e);
    }
  };

  // Entities state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Restore session on mount
  useEffect(() => {
    const session = getSavedSession();
    if (session.user) {
      setCurrentUser(session.user);
      setUserRole(session.user.role);
    } else {
      setCurrentUser(null);
    }
  }, []);

  // Load everything when the refresh trigger or current user changes
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      try {
        setLoading(true);
        const [
          vData, dData, tData, mData, fData, eData, nData, sData
        ] = await Promise.all([
          getVehicles(),
          getDrivers(),
          getTrips(),
          getMaintenance(),
          getFuelLogs(),
          getExpenses(),
          getNotifications(),
          getSettings()
        ]);

        setVehicles(vData);
        setDrivers(dData);
        setTrips(tData);
        setMaintenanceLogs(mData);
        setFuelLogs(fData);
        setExpenses(eData);
        setNotifications(nData);
        setSettings(sData);
      } catch (err: any) {
        console.error("Error loading TransitOps ERP databases:", err);
        // If we get a 401/403 or general unauthorized, clear state
        if (err.message && err.message.includes("Expired")) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [refreshTrigger, currentUser]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleResetDB = async () => {
    await resetDatabase();
    triggerRefresh();
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setUserRole(user.role);
    triggerRefresh();
  };

  const handleLogout = async () => {
    const session = getSavedSession();
    await logoutReal(session.refreshToken);
    setCurrentUser(null);
    setUserRole(Role.FLEET_MANAGER);
    setCurrentView("dashboard");
  };

  // --- Handlers wrapping our program logic ---
  const handleCreateVehicle = async (v: Partial<Vehicle>) => {
    await createVehicle(v);
    triggerRefresh();
  };

  const handleUpdateVehicle = async (id: string, v: Partial<Vehicle>) => {
    await updateVehicle(id, v);
    triggerRefresh();
  };

  const handleUpdateOdometer = async (id: string, odo: number) => {
    await updateOdometer(id, odo);
    triggerRefresh();
  };

  const handleCreateDriver = async (d: Partial<Driver>) => {
    await createDriver(d);
    triggerRefresh();
  };

  const handleUpdateDriver = async (id: string, d: Partial<Driver>) => {
    await updateDriver(id, d);
    triggerRefresh();
  };

  const handleCreateTrip = async (t: Partial<Trip>) => {
    await createTrip(t);
    triggerRefresh();
  };

  const handleDispatchTrip = async (id: string) => {
    await dispatchTrip(id);
    triggerRefresh();
  };

  const handleCompleteTrip = async (id: string) => {
    await completeTrip(id);
    triggerRefresh();
  };

  const handleCancelTrip = async (id: string, reason: string) => {
    await cancelTrip(id, reason);
    triggerRefresh();
  };

  const handleCreateMaintenance = async (log: { vehicleId: string; serviceType: string; workshop: string; cost: number; technician: string }) => {
    await createMaintenance(log);
    triggerRefresh();
  };

  const handleCloseMaintenance = async (id: string) => {
    await closeMaintenance(id);
    triggerRefresh();
  };

  const handleCreateFuelLog = async (log: Partial<FuelLog>) => {
    await createFuelLog(log);
    triggerRefresh();
  };

  const handleCreateExpense = async (exp: Partial<Expense>) => {
    await createExpense(exp);
    triggerRefresh();
  };

  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationAsRead(id);
    triggerRefresh();
  };

  const handleSaveSettings = async (sets: Record<string, string>) => {
    await saveSettings(sets);
    triggerRefresh();
  };

  // View Switcher Router
  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            vehicles={vehicles}
            drivers={drivers}
            trips={trips}
            maintenanceLogs={maintenanceLogs}
            expenses={expenses}
            notifications={notifications}
            fuelLogs={fuelLogs}
            onViewChange={setCurrentView}
          />
        );
      case "vehicles":
        return (
          <VehiclesView
            vehicles={vehicles}
            userRole={userRole}
            onCreateVehicle={handleCreateVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onUpdateOdometer={handleUpdateOdometer}
          />
        );
      case "drivers":
        return (
          <DriversView
            drivers={drivers}
            userRole={userRole}
            onCreateDriver={handleCreateDriver}
            onUpdateDriver={handleUpdateDriver}
          />
        );
      case "trips":
        return (
          <TripsView
            trips={trips}
            vehicles={vehicles}
            drivers={drivers}
            userRole={userRole}
            onCreateTrip={handleCreateTrip}
            onDispatchTrip={handleDispatchTrip}
            onCompleteTrip={handleCompleteTrip}
            onCancelTrip={handleCancelTrip}
          />
        );
      case "maintenance":
        return (
          <MaintenanceView
            logs={maintenanceLogs}
            vehicles={vehicles}
            userRole={userRole}
            onCreateMaintenance={handleCreateMaintenance}
            onCloseMaintenance={handleCloseMaintenance}
          />
        );
      case "fuel":
      case "expenses":
        return (
          <BillingView
            fuelLogs={fuelLogs}
            expenses={expenses}
            vehicles={vehicles}
            trips={trips}
            userRole={userRole}
            onCreateFuelLog={handleCreateFuelLog}
            onCreateExpense={handleCreateExpense}
            initialTab={currentView === "fuel" ? "fuel" : "expenses"}
          />
        );
      case "settings":
        return (
          <SettingsView
            settings={settings}
            userRole={userRole}
            onSaveSettings={handleSaveSettings}
            onResetDB={handleResetDB}
            currentUser={currentUser}
          />
        );
      case "profile":
        return (
          <ProfileView
            currentUser={currentUser!}
            userRole={userRole}
            onLogout={handleLogout}
          />
        );
      default:
        return <div className="text-sm font-mono text-[#A1A1AA] p-8">Unknown view epoch registered.</div>;
    }
  };

  // Authentication check guard
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={handleToggleTheme} />;
  }

  return (
    <div id="app-root" className={`flex h-screen w-screen overflow-hidden bg-[#09090B] text-[#FAFAFA] font-sans antialiased ${theme}`}>
      {/* 1. Sidebar Nav */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        userRole={userRole} 
        onLogout={handleLogout}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Right Column: Navbar + Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 2. Top Navbar */}
        <Navbar 
          userRole={userRole}
          onRoleChange={setUserRole}
          onResetDB={handleResetDB}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationRead}
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          vehicles={vehicles}
          drivers={drivers}
          trips={trips}
          onViewChange={setCurrentView}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* 3. Main content body */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#09090B]">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-3">
              <BrainCircuit className="w-10 h-10 text-[#3B82F6] animate-pulse" />
              <p className="text-xs font-mono text-[#A1A1AA]">Acquiring encrypted ledger sequences...</p>
            </div>
          ) : (
            renderCurrentView()
          )}
        </main>
      </div>
    </div>
  );
}
