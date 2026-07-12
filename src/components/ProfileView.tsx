import { useState } from "react";
import { 
  User as UserIcon, ShieldCheck, Mail, Phone, Calendar, 
  Key, BadgeCheck, Network, Terminal, LogOut, Clock, Activity, Lock
} from "lucide-react";
import { Role, User } from "../types.ts";

interface ProfileViewProps {
  currentUser: User;
  userRole: Role;
  onLogout: () => void;
}

export default function ProfileView({ currentUser, userRole, onLogout }: ProfileViewProps) {
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const sessionId = "SES-NODE-" + currentUser.id.substring(0, 8).toUpperCase();

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case Role.FLEET_MANAGER: return "Fleet Manager";
      case Role.DISPATCHER: return "Dispatcher";
      case Role.SAFETY_OFFICER: return "Safety Officer";
      case Role.FINANCIAL_ANALYST: return "Financial Analyst";
      default: return r;
    }
  };

  const getClearanceLevel = (r: Role) => {
    switch (r) {
      case Role.FLEET_MANAGER: return { level: "Level 4 (Full Access)", color: "text-[#F97316] bg-[#F97316]/10 border-[#F97316]/25" };
      case Role.DISPATCHER: return { level: "Level 3 (Operations Clear)", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case Role.SAFETY_OFFICER: return { level: "Level 2 (Compliance Clear)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case Role.FINANCIAL_ANALYST: return { level: "Level 1 (Auditing Clear)", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      default: return { level: "Level 1 (Standard Access)", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" };
    }
  };

  const clearance = getClearanceLevel(userRole);

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopiedSessionId(true);
    setTimeout(() => setCopiedSessionId(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] font-sans">User Profile Console</h2>
        <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Manage active credentials, security tokens, and authorized ERP scopes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Summary Card */}
        <div className="lg:col-span-1 bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-[#27272A] bg-[#09090B] flex items-center gap-2.5">
            <UserIcon className="w-4 h-4 text-[#F97316]" />
            <div>
              <h4 className="font-semibold text-sm text-[#FAFAFA] font-sans">Operator Ledger Card</h4>
              <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Static credentials compiled in core corporate database</p>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-5 border-b border-[#27272A]">
            {/* Avatar block */}
            <div className="relative">
              {currentUser.profileImage ? (
                <img 
                  src={currentUser.profileImage} 
                  alt={currentUser.name} 
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full border-2 border-[#F97316] object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#1D2845] border-2 border-[#F97316] flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#18181B] shadow-inner" title="Session Active" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-[#FAFAFA] font-sans leading-tight">{currentUser.name}</h3>
              <p className="text-xs font-mono text-[#F97316] mt-1">{getRoleLabel(userRole)}</p>
              <div className="mt-2.5 inline-flex text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE OPERATOR
              </div>
            </div>

            {/* Basic detail lines */}
            <div className="w-full space-y-3 font-mono text-xs text-left pt-2 border-t border-[#27272A]/50">
              <div className="flex items-center gap-2.5 text-[#A1A1AA]">
                <Key className="w-4 h-4 shrink-0 text-[#A1A1AA]" />
                <div className="truncate">
                  <span className="text-[10px] block text-[#71717A] font-sans">EMPLOYEE SERIAL ID</span>
                  <span className="text-[#FAFAFA] font-bold">{currentUser.employeeId || "EMP-8088"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#A1A1AA]">
                <Mail className="w-4 h-4 shrink-0 text-[#A1A1AA]" />
                <div className="truncate">
                  <span className="text-[10px] block text-[#71717A] font-sans">SECURE SYSTEM EMAIL</span>
                  <span className="text-[#FAFAFA] truncate font-medium">{currentUser.email}</span>
                </div>
              </div>

              {currentUser.phone && (
                <div className="flex items-center gap-2.5 text-[#A1A1AA]">
                  <Phone className="w-4 h-4 shrink-0 text-[#A1A1AA]" />
                  <div className="truncate">
                    <span className="text-[10px] block text-[#71717A] font-sans">AUTHORIZED TELEPHONY</span>
                    <span className="text-[#FAFAFA]">{currentUser.phone}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-[#A1A1AA]">
                <Calendar className="w-4 h-4 shrink-0 text-[#A1A1AA]" />
                <div className="truncate">
                  <span className="text-[10px] block text-[#71717A] font-sans">ENLISTMENT DATE</span>
                  <span className="text-[#FAFAFA]">{formatDate(currentUser.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#09090B]">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-[#EF4444] text-xs font-semibold hover:text-[#FF6B6B] transition-all cursor-pointer shadow-sm group"
            >
              <LogOut className="w-4 h-4 text-[#EF4444] group-hover:translate-x-0.5 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Right Columns: Permissions Scope & Diagnostics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Authorization Clearance Board */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#27272A] bg-[#09090B] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <h4 className="font-semibold text-sm text-[#FAFAFA] font-sans">Security Clearance & Permitted Actions</h4>
                <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Rule-Based Access Control (RBAC) parameters for the active user</p>
              </div>
            </div>

            <div className="p-6 space-y-5 font-mono text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#09090B] border border-[#27272A]">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">CURRENT ACCESS SEGMENT</span>
                  <span className="text-[#FAFAFA] text-sm font-bold font-sans">{getRoleLabel(userRole)} console</span>
                </div>
                <div className={`px-3 py-1.5 rounded-md text-xs font-bold border ${clearance.color}`}>
                  {clearance.level}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase text-[#71717A] tracking-wider block">MODULE COMPLIANCE CHECKLIST</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Dashboard */}
                  <div className="flex items-start gap-3 p-3 bg-[#111113] border border-[#27272A]/50 rounded-lg">
                    <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-white font-semibold block font-sans">Logistics Cockpit (Dashboard)</span>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5 leading-normal">Permitted to read core KPI meters, ongoing dispatch runs, and live alerts.</p>
                    </div>
                  </div>

                  {/* Vehicles */}
                  <div className="flex items-start gap-3 p-3 bg-[#111113] border border-[#27272A]/50 rounded-lg">
                    {userRole === Role.FLEET_MANAGER || userRole === Role.DISPATCHER || userRole === Role.SAFETY_OFFICER ? (
                      <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#A1A1AA]/50 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="text-white font-semibold block font-sans">Asset Ledger (Vehicles)</span>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5 leading-normal">
                        {userRole === Role.FLEET_MANAGER ? "Full Read & Write authority to insert, decommission or alter vehicles." : 
                         userRole === Role.DISPATCHER || userRole === Role.SAFETY_OFFICER ? "Authorized to review asset health specs and log updates." : 
                         "Read-only access restricted. Financial Analysts can monitor asset depreciation indices."}
                      </p>
                    </div>
                  </div>

                  {/* Drivers */}
                  <div className="flex items-start gap-3 p-3 bg-[#111113] border border-[#27272A]/50 rounded-lg">
                    {userRole === Role.FLEET_MANAGER || userRole === Role.DISPATCHER || userRole === Role.SAFETY_OFFICER ? (
                      <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#A1A1AA]/50 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="text-white font-semibold block font-sans">Staff Registry (Drivers)</span>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5 leading-normal">
                        {userRole === Role.FLEET_MANAGER ? "Full staff record modifications permitted, including safety parameters." : 
                         userRole === Role.DISPATCHER || userRole === Role.SAFETY_OFFICER ? "Authorized to allocate drivers to scheduled dispatches." : 
                         "Deactivated. Personal driver documentation requires Level 2+ credentials."}
                      </p>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="flex items-start gap-3 p-3 bg-[#111113] border border-[#27272A]/50 rounded-lg">
                    {userRole === Role.FLEET_MANAGER ? (
                      <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#A1A1AA]/50 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="text-white font-semibold block font-sans">Global Parameters (Settings)</span>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5 leading-normal">
                        {userRole === Role.FLEET_MANAGER ? "Authorized to save, commit, and overwrite operational coefficients." : 
                         "Strictly Read-only. Modifications to system targets are locked."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Diagnostics Terminal */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#27272A] bg-[#09090B] flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-blue-400" />
              <div>
                <h4 className="font-semibold text-sm text-[#FAFAFA] font-sans">Secure Session Telemetry</h4>
                <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Diagnostic metadata describing the active browser terminal connection</p>
              </div>
            </div>

            <div className="p-5 font-mono text-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 bg-[#09090B] p-3 rounded border border-[#27272A]">
                  <span className="text-[#71717A] text-[9px] block">SECURITY CODENAME</span>
                  <span className="text-white font-semibold">CIPHER-RSA-2048</span>
                </div>

                <div className="space-y-1 bg-[#09090B] p-3 rounded border border-[#27272A] relative group">
                  <span className="text-[#71717A] text-[9px] block">SECURE SESSION TOKEN</span>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold truncate">{sessionId}</span>
                    <button 
                      onClick={copySessionId}
                      className="text-[10px] text-[#60A5FA] hover:text-[#FAFAFA] px-1.5 py-0.5 rounded bg-[#1C1C1F] border border-[#27272A] transition-colors cursor-pointer"
                    >
                      {copiedSessionId ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 bg-[#09090B] p-3 rounded border border-[#27272A]">
                  <span className="text-[#71717A] text-[9px] block">NETWORK NODE LATENCY</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    4 ms (Secure Intranet Gateway)
                  </span>
                </div>

                <div className="space-y-1 bg-[#09090B] p-3 rounded border border-[#27272A]">
                  <span className="text-[#71717A] text-[9px] block">LAST AUTH TIME</span>
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    {currentUser.lastLogin ? formatDate(currentUser.lastLogin) : "Recently Authorized"}
                  </span>
                </div>
              </div>

              <div className="bg-[#111113] p-3 rounded border border-[#27272A]/60 flex items-center gap-2.5">
                <Network className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
                <div className="text-[11px] text-[#A1A1AA] leading-snug">
                  Connection registered via Cloud Run container network behind an <span className="text-[#F97316]">Nginx Reverse Proxy</span> routing traffic exclusively on <span className="text-[#60A5FA]">Port 3000</span>.
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
