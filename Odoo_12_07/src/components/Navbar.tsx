import { useState, useRef, useEffect } from "react";
import { Search, Bell, RotateCcw, AlertTriangle, ShieldCheck, Check, Sun, Moon, Truck, User as UserIcon, Milestone, CornerDownRight, X, Menu } from "lucide-react";
import { Role, Notification, User, Vehicle, Driver, Trip } from "../types.ts";

interface NavbarProps {
  userRole: Role;
  onRoleChange: (role: Role) => void;
  onResetDB: () => Promise<void>;
  notifications: Notification[];
  onMarkNotificationAsRead: (id: string) => Promise<void>;
  currentUser?: User | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  vehicles?: Vehicle[];
  drivers?: Driver[];
  trips?: Trip[];
  onViewChange?: (view: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ 
  userRole, 
  onRoleChange, 
  onResetDB, 
  notifications, 
  onMarkNotificationAsRead,
  currentUser,
  theme,
  onToggleTheme,
  vehicles = [],
  drivers = [],
  trips = [],
  onViewChange,
  isSidebarOpen,
  onToggleSidebar
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Only the Fleet Manager (Administrator) can trigger database seed resets or switch simulated roles
  const isFleetManager = currentUser?.role === Role.FLEET_MANAGER;

  const handleReset = async () => {
    if (!isFleetManager) {
      alert("Unauthorized: Only the Fleet Manager can reset the system ledger database.");
      return;
    }
    const confirmReset = window.confirm("Are you sure you want to restore the original system seed database? All unsaved active changes will be reset.");
    if (!confirmReset) return;

    try {
      setResetting(true);
      await onResetDB();
      alert("ERP Database restored successfully with original seed data.");
    } catch {
      alert("Failed to reset database.");
    } finally {
      setResetting(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic
  const query = searchQuery.toLowerCase().trim();
  const matchedVehicles = query
    ? vehicles.filter(v => v.regNumber.toLowerCase().includes(query) || v.name.toLowerCase().includes(query) || v.type.toLowerCase().includes(query)).slice(0, 3)
    : [];

  const matchedDrivers = query
    ? drivers.filter(d => d.name.toLowerCase().includes(query) || d.licenseNumber.toLowerCase().includes(query) || d.status.toLowerCase().includes(query)).slice(0, 3)
    : [];

  const matchedTrips = query
    ? trips.filter(t => t.tripNumber.toLowerCase().includes(query) || t.source.toLowerCase().includes(query) || t.destination.toLowerCase().includes(query) || t.status.toLowerCase().includes(query)).slice(0, 3)
    : [];

  const hasResults = matchedVehicles.length > 0 || matchedDrivers.length > 0 || matchedTrips.length > 0;

  const handleResultClick = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const getRoleBadgeColor = (r: Role) => {
    switch (r) {
      case Role.FLEET_MANAGER: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case Role.DISPATCHER: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case Role.SAFETY_OFFICER: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case Role.FINANCIAL_ANALYST: return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <header className="h-16 border-b border-[#27272A] flex items-center justify-between px-6 bg-[#09090B]/80 backdrop-blur-md shrink-0 text-white relative z-50">
      {/* Left Area: Sidebar toggle button + Dynamic Search Box */}
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-[#27272A] bg-[#111113] hover:bg-[#1C1C1F] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all cursor-pointer"
            title="Expand Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 relative" ref={searchContainerRef}>
        <div className="bg-[#111113] border border-[#27272A] rounded-md px-3 py-1.5 flex items-center gap-2.5 w-80 text-sm group focus-within:border-[#3B82F6] transition-all relative">
          <Search className="w-4 h-4 text-[#A1A1AA] group-focus-within:text-[#60A5FA]" />
          <input 
            type="text" 
            placeholder="Search assets, trips, drivers..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="bg-transparent border-none outline-none text-[#FAFAFA] placeholder-[#A1A1AA] w-full text-xs font-mono"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="p-0.5 rounded-full hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown Popover */}
        {showSearchResults && searchQuery && (
          <div className="absolute top-12 left-0 w-96 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl p-2 z-50 overflow-hidden text-left max-h-[380px] overflow-y-auto">
            {/* Header info */}
            <div className="p-1.5 border-b border-[#27272A] flex items-center justify-between text-[10px] font-mono text-[#A1A1AA]">
              <span>SEARCH RESULTS</span>
              <button 
                onClick={() => setShowSearchResults(false)}
                className="text-[9px] hover:text-[#FAFAFA] font-bold"
              >
                CLOSE
              </button>
            </div>

            {!hasResults ? (
              <div className="p-4 text-center text-xs text-[#A1A1AA] font-mono">
                No matching assets, drivers, or trips found.
              </div>
            ) : (
              <div className="space-y-3 p-1 mt-1">
                {/* 1. Vehicles */}
                {matchedVehicles.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2 block mb-1">
                      Vehicles Registry ({matchedVehicles.length})
                    </span>
                    <div className="space-y-0.5">
                      {matchedVehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => handleResultClick("vehicles")}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-[#1E293B]/60 transition-colors text-left text-xs font-mono group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-[#3B82F6]" />
                            <div>
                              <div className="text-white font-sans font-semibold group-hover:text-[#60A5FA] transition-colors">{v.name}</div>
                              <div className="text-[10px] text-[#A1A1AA]">{v.regNumber} • {v.type}</div>
                            </div>
                          </div>
                          <CornerDownRight className="w-3.5 h-3.5 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Drivers */}
                {matchedDrivers.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2 block mb-1">
                      Drivers Directory ({matchedDrivers.length})
                    </span>
                    <div className="space-y-0.5">
                      {matchedDrivers.map(d => (
                        <button
                          key={d.id}
                          onClick={() => handleResultClick("drivers")}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-[#1E293B]/60 transition-colors text-left text-xs font-mono group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-[#10B981]" />
                            <div>
                              <div className="text-white font-sans font-semibold group-hover:text-[#60A5FA] transition-colors">{d.name}</div>
                              <div className="text-[10px] text-[#A1A1AA]">{d.licenseNumber} • {d.status}</div>
                            </div>
                          </div>
                          <CornerDownRight className="w-3.5 h-3.5 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Trips */}
                {matchedTrips.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2 block mb-1">
                      Trips Board ({matchedTrips.length})
                    </span>
                    <div className="space-y-0.5">
                      {matchedTrips.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleResultClick("trips")}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-[#1E293B]/60 transition-colors text-left text-xs font-mono group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Milestone className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <div>
                              <div className="text-white font-sans font-semibold group-hover:text-[#60A5FA] transition-colors">#{t.tripNumber} - {t.destination}</div>
                              <div className="text-[10px] text-[#A1A1AA]">{t.source} ➔ {t.destination} • {t.status}</div>
                            </div>
                          </div>
                          <CornerDownRight className="w-3.5 h-3.5 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Profile & Controls Controls */}
      <div className="flex items-center gap-5">
        {/* Current Active Role Badge */}
        <div className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-semibold uppercase tracking-wider ${getRoleBadgeColor(userRole)}`}>
          {userRole.replace("_", " ")}
        </div>

        {/* Dynamic Light/Dark Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-full border border-[#27272A] bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Notifications Alert Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-full border border-[#27272A] bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full text-[9px] text-white flex items-center justify-center font-bold font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-96 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl p-1 text-left">
              <div className="p-3 border-b border-[#27272A] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FAFAFA] font-mono">System Notifications</span>
                <span className="text-[10px] font-mono bg-[#3B82F6]/10 text-[#60A5FA] px-2 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#27272A]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#A1A1AA] font-mono">
                    No system alerts registered.
                  </div>
                ) : (
                  notifications.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-3 transition-colors ${note.isRead ? "opacity-60 bg-transparent" : "bg-[#1E293B]/30"}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {note.type === "LICENSE_EXPIRING" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                          ) : note.type === "MAINTENANCE_DUE" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#FAFAFA] leading-normal">{note.message}</p>
                          <span className="text-[9px] text-[#A1A1AA] font-mono mt-1 block">
                            {new Date(note.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {!note.isRead && (
                          <button
                            onClick={() => onMarkNotificationAsRead(note.id)}
                            title="Mark as read"
                            className="p-1 rounded bg-[#27272A] hover:bg-[#3B82F6] hover:text-white transition-colors text-[#A1A1AA]"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
