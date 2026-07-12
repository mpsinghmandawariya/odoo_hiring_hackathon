import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, Truck, UserCheck, Milestone, Wrench, 
  Fuel, Wallet, ShieldAlert, FileText, Settings, UserCircle, LogOut,
  ChevronDown, ChevronUp, PanelLeftClose
} from "lucide-react";
import { Role, User } from "../types.ts";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userRole: Role;
  onLogout: () => void;
  currentUser?: User | null;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  userRole, 
  onLogout, 
  currentUser,
  isOpen,
  onToggle
}: SidebarProps) {
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  // Navigation structure linked with roles for RBAC display and warning
  const navGroups = [
    {
      label: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST] },
      ]
    },
    {
      label: "Operations",
      items: [
        { id: "vehicles", label: "Vehicle Registry", icon: Truck, roles: [Role.FLEET_MANAGER, Role.DISPATCHER] },
        { id: "drivers", label: "Driver Directory", icon: UserCheck, roles: [Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.DISPATCHER] },
        { id: "trips", label: "Trip Dispatch Board", icon: Milestone, roles: [Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST] },
        { id: "maintenance", label: "Maintenance Desk", icon: Wrench, roles: [Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER] },
      ]
    },
    {
      label: "Financials & Auditing",
      items: [
        { id: "fuel", label: "Fuel Log Book", icon: Fuel, roles: [Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST, Role.DISPATCHER] },
        { id: "expenses", label: "Expense Registry", icon: Wallet, roles: [Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST] },
      ]
    },
    {
      label: "System",
      items: [
        { id: "settings", label: "Settings Panel", icon: Settings, roles: [Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST] },
      ]
    }
  ];

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case Role.FLEET_MANAGER: return "Fleet Manager";
      case Role.DISPATCHER: return "Dispatcher";
      case Role.SAFETY_OFFICER: return "Safety Officer";
      case Role.FINANCIAL_ANALYST: return "Financial Analyst";
      default: return r;
    }
  };

  const displayName = currentUser?.name || "Alex Reynolds";
  const displayEmployeeId = currentUser?.employeeId || "EMP-8088";
  const displayImage = currentUser?.profileImage;

  return (
    <aside 
      id="sidebar" 
      className={`h-full border-r border-[#27272A] flex flex-col bg-[#000000] shrink-0 text-[#FAFAFA] transition-all duration-300 ease-in-out ${
        isOpen ? "w-68 opacity-100" : "w-0 opacity-0 overflow-hidden border-r-0"
      }`}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-[#27272A]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center font-extrabold italic text-sm text-white">
            TO
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none">TransitOps</h1>
            <span className="text-[10px] text-[#A1A1AA] font-mono tracking-wider">ENTERPRISE ERP</span>
          </div>
        </div>
        <button 
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Group items */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] px-3 block mb-2">
              {group.label}
            </span>
            <div className="space-y-[2px]">
              {group.items.map((item) => {
                const hasAccess = item.roles.includes(userRole);
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-all duration-150 text-left cursor-pointer group ${
                      isActive 
                        ? "bg-[#1E293B] text-[#60A5FA] font-medium" 
                        : "text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#60A5FA]" : "text-[#A1A1AA] group-hover:text-[#FAFAFA]"}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>

                    {/* RBAC Lock Visual indicator for unauthorized roles */}
                    {!hasAccess && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded font-mono uppercase tracking-wider scale-90">
                        Locked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Status Profile Bottom Bar */}
      <div className="p-4 border-t border-[#27272A] bg-[#09090B]">
        <button 
          onClick={() => onViewChange("profile")}
          className={`w-full flex items-center justify-between gap-3 text-left p-2 rounded-lg transition-all duration-150 cursor-pointer group ${
            currentView === "profile" 
              ? "bg-[#1E293B] border border-[#22335C] text-[#60A5FA]" 
              : "hover:bg-[#111113] border border-transparent"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt="Operator Avatar" 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-[#27272A] object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#27272A] border border-[#27272A] flex items-center justify-center text-xs font-semibold text-[#60A5FA]">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-semibold truncate ${currentView === "profile" ? "text-[#60A5FA]" : "text-[#FAFAFA] group-hover:text-[#60A5FA] transition-colors"}`}>{displayName}</div>
              <div className="text-[10px] text-[#A1A1AA] font-mono truncate">{getRoleLabel(userRole)}</div>
            </div>
          </div>
        </button>

        <div className="text-[10px] text-[#A1A1AA] font-mono text-center pt-3 mt-3 border-t border-[#27272A]/30">
          v2.4.0 Stable Build
        </div>
      </div>
    </aside>
  );
}
