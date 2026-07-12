import { useState } from "react";
import { Plus, Check, X, ShieldAlert, AlertTriangle, Wrench, Settings } from "lucide-react";
import { MaintenanceLog, MaintenanceStatus, Vehicle, Role } from "../types.ts";
import AccessDenied from "./AccessDenied.tsx";

interface MaintenanceViewProps {
  logs: MaintenanceLog[];
  vehicles: Vehicle[];
  userRole: Role;
  onCreateMaintenance: (log: { vehicleId: string; serviceType: string; workshop: string; cost: number; technician: string }) => Promise<void>;
  onCloseMaintenance: (id: string) => Promise<void>;
}

export default function MaintenanceView({
  logs,
  vehicles,
  userRole,
  onCreateMaintenance,
  onCloseMaintenance
}: MaintenanceViewProps) {
  // RBAC permissions check
  const hasAccess = userRole === Role.FLEET_MANAGER || userRole === Role.DISPATCHER || userRole === Role.SAFETY_OFFICER;

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [formVehicleId, setFormVehicleId] = useState("");
  const [formService, setFormService] = useState("");
  const [formWorkshop, setFormWorkshop] = useState("");
  const [formCost, setFormCost] = useState("350");
  const [formTech, setFormTech] = useState("");

  if (!hasAccess) {
    return <AccessDenied requiredRoles={[Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER]} userRole={userRole} />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formVehicleId || !formService || !formWorkshop || !formTech) {
      setFormError("Please populate all required workshop logging fields.");
      return;
    }

    try {
      setSaving(true);
      await onCreateMaintenance({
        vehicleId: formVehicleId,
        serviceType: formService,
        workshop: formWorkshop,
        cost: Number(formCost),
        technician: formTech
      });
      setShowAddModal(false);

      // Reset
      setFormVehicleId("");
      setFormService("");
      setFormWorkshop("");
      setFormTech("");
    } catch (err: any) {
      setFormError(err.message || "Failed to log maintenance work order.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseLog = async (id: string) => {
    try {
      setActionLoading(id);
      await onCloseMaintenance(id);
    } catch (err: any) {
      alert(err.message || "Failed to resolve maintenance order.");
    } finally {
      setActionLoading(null);
    }
  };

  const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.regNumber || "Unknown";
  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || "Unknown";

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] font-sans">Preventative & Emergency Maintenance Desk</h2>
          <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Approve shop repairs, log diagnostic tasks, and manage fleet technical status</p>
        </div>

        {userRole === Role.FLEET_MANAGER && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Open Workshop Order</span>
          </button>
        )}
      </div>

      {/* Main Table view */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#27272A]/40 text-[#A1A1AA] text-[10px] font-mono tracking-wider border-b border-[#27272A] uppercase">
                <th className="py-3.5 px-5 font-semibold">VEHICLE</th>
                <th className="py-3.5 px-5 font-semibold">WORKSHOP SERVICE BRIEF</th>
                <th className="py-3.5 px-5 font-semibold">WORKSHOP SERVICE CENTER</th>
                <th className="py-3.5 px-5 font-semibold">EST. EXPENSE</th>
                <th className="py-3.5 px-5 font-semibold">DATE REGISTERED</th>
                <th className="py-3.5 px-5 font-semibold">ASSIGNED TECH</th>
                <th className="py-3.5 px-5 font-semibold">STATUS</th>
                <th className="py-3.5 px-5 font-semibold text-right">SERVICE CONTROLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-xs font-mono text-[#FAFAFA]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#A1A1AA]">
                    No maintenance logs registered in the ledger.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let statusColor = "";
                  switch (log.status) {
                    case MaintenanceStatus.ACTIVE:
                      statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      break;
                    case MaintenanceStatus.COMPLETED:
                      statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      break;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-[#1C1C1F]/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#60A5FA]">{getVehicleReg(log.vehicleId)}</div>
                        <div className="text-[10px] text-[#A1A1AA] font-normal truncate max-w-[130px]" title={getVehicleName(log.vehicleId)}>
                          {getVehicleName(log.vehicleId)}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-sans font-semibold text-[#FAFAFA]">{log.serviceType}</td>
                      <td className="py-4 px-5 text-zinc-300">{log.workshop}</td>
                      <td className="py-4 px-5 text-red-400 font-bold">₹{log.cost.toLocaleString("en-IN")}</td>
                      <td className="py-4 px-5 text-zinc-400">{log.date}</td>
                      <td className="py-4 px-5 text-zinc-300">{log.technician}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wider ${statusColor}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {log.status === MaintenanceStatus.ACTIVE ? (
                          <button
                            onClick={() => handleCloseLog(log.id)}
                            disabled={actionLoading !== null}
                            className="px-2 py-1 rounded bg-[#10B981]/10 hover:bg-[#10B981] hover:text-white border border-[#10B981]/30 text-[#10B981] text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === log.id ? "Closing..." : "Close Repair Log"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-semibold uppercase">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workshop Order Registration Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#27272A] flex justify-between items-center bg-[#09090B]">
              <h3 className="font-semibold text-sm text-[#FAFAFA] font-sans uppercase tracking-wider">Initialize Workshop Order</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 font-mono text-xs">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[#EF4444] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[#A1A1AA] block">TARGET FLEET ASSET *</label>
                  <select
                    value={formVehicleId}
                    onChange={(e) => setFormVehicleId(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="">-- Choose Asset --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.regNumber} - {v.name} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[#A1A1AA] block">SERVICE DIAGNOSTICS BRIEF *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Steering hydraulic pump replacement & wheel alignment"
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">WORKSHOP CENTER *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fleet Service Bay 3"
                    value={formWorkshop}
                    onChange={(e) => setFormWorkshop(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ESTIMATED REPAIR COST (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[#A1A1AA] block">ASSIGNED CERTIFIED TECHNICIAN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dave Miller, ASE Master"
                    value={formTech}
                    onChange={(e) => setFormTech(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#27272A] flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Deploying..." : "Deploy Asset to Workshop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
