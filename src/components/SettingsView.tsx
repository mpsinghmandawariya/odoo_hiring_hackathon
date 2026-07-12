import { useState } from "react";
import { 
  Sliders, Save, AlertCircle, User as UserIcon, Database, 
  ShieldAlert, RefreshCw, Layers, CheckCircle2
} from "lucide-react";
import { Role, User } from "../types.ts";

interface SettingsViewProps {
  settings: Record<string, string>;
  userRole: Role;
  onSaveSettings: (settings: Record<string, string>) => Promise<void>;
  onResetDB?: () => Promise<void>;
  currentUser?: User | null;
}

export default function SettingsView({
  settings,
  userRole,
  onSaveSettings,
  onResetDB,
  currentUser
}: SettingsViewProps) {
  const isManager = userRole === Role.FLEET_MANAGER;

  // Local settings fields
  const [standardFuel, setStandardFuel] = useState(settings.standardFuelRate || "1.52");
  const [targetMpg, setTargetMpg] = useState(settings.targetMpg || "7.5");
  const [cargoLimit, setCargoLimit] = useState(settings.cargoWeightLimit || "30000");
  const [freightRev, setFreightRev] = useState(settings.freightRevenuePerMile || "3.88");

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) {
      alert("Unauthorized action. Fleet Manager clearance required.");
      return;
    }

    try {
      setSaving(true);
      await onSaveSettings({
        standardFuelRate: standardFuel,
        targetMpg: targetMpg,
        cargoWeightLimit: cargoLimit,
        freightRevenuePerMile: freightRev
      });
      alert("Logistics targets and system configuration parameters updated successfully.");
    } catch {
      alert("Failed to save system settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!onResetDB) return;
    if (!isManager) {
      alert("Unauthorized action. Fleet Manager clearance required to reset ERP records.");
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

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case Role.FLEET_MANAGER: return "Fleet Manager";
      case Role.DISPATCHER: return "Dispatcher";
      case Role.SAFETY_OFFICER: return "Safety Officer";
      case Role.FINANCIAL_ANALYST: return "Financial Analyst";
      default: return r;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] font-sans">Settings Panel</h2>
        <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Manage global parameters, user profile settings, and system environment variables</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logistics parameters config card */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-[#27272A] bg-[#09090B] flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#3B82F6]" />
            <div>
              <h4 className="font-semibold text-sm text-[#FAFAFA] font-sans">Logistics Targets & Coefficients</h4>
              <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Configurable variables used in trip margins and compliance computations</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4 font-mono text-xs flex-1">
            {!isManager && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-[#F59E0B] flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Locked: Read-only mode. Configuration modification is limited strictly to FLEET_MANAGER clearance.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">STANDARD FUEL RATE (₹/L)</label>
                <input
                  type="text"
                  disabled={!isManager}
                  value={standardFuel}
                  onChange={(e) => setStandardFuel(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">TARGET FUEL ECONOMY (MPG)</label>
                <input
                  type="text"
                  disabled={!isManager}
                  value={targetMpg}
                  onChange={(e) => setTargetMpg(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">MAX CARGO CAPACITY LIMIT (KG)</label>
                <input
                  type="text"
                  disabled={!isManager}
                  value={cargoLimit}
                  onChange={(e) => setCargoLimit(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">REVENUE RATE PER MILE (₹)</label>
                <input
                  type="text"
                  disabled={!isManager}
                  value={freightRev}
                  onChange={(e) => setFreightRev(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>
            </div>

            {isManager && (
              <div className="pt-4 border-t border-[#27272A] flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 rounded text-xs font-mono font-semibold text-white flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Updating..." : "Commit Targets"}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right side: Session, Preferences & Database Controls */}
        <div className="space-y-6">
          {/* Operator Profile Card */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#27272A] bg-[#09090B] flex items-center gap-2.5">
              <UserIcon className="w-4 h-4 text-emerald-500" />
              <div>
                <h4 className="font-semibold text-sm text-[#FAFAFA] font-sans">Active Operator Session</h4>
                <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Currently active user credential logs and active ERP permissions</p>
              </div>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center gap-4 bg-[#09090B] p-4 rounded-lg border border-[#27272A]">
                {currentUser?.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt="User profile"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border border-[#27272A] object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#27272A] border border-[#27272A] flex items-center justify-center text-sm font-semibold text-[#60A5FA]">
                    {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "OP"}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-[#FAFAFA] font-sans">{currentUser?.name || "Alex Reynolds"}</div>
                  <div className="text-[11px] text-[#A1A1AA]">{getRoleLabel(userRole)} • {currentUser?.employeeId || "EMP-8088"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="bg-[#09090B] p-2.5 rounded border border-[#27272A]">
                  <span className="text-[#A1A1AA] block mb-1">SECURITY CLEARANCE</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Level 4 Authorized
                  </span>
                </div>
                <div className="bg-[#09090B] p-2.5 rounded border border-[#27272A]">
                  <span className="text-[#A1A1AA] block mb-1">SESSION STABILITY</span>
                  <span className="text-[#60A5FA] font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 shrink-0" />
                    SSL Encrypted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
