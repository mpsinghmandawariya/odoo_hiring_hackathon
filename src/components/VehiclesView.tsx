import { useState } from "react";
import { Plus, Download, Edit2, Check, X, ShieldAlert, AlertTriangle } from "lucide-react";
import { Vehicle, VehicleType, VehicleStatus, Role } from "../types.ts";
import AccessDenied from "./AccessDenied.tsx";

interface VehiclesViewProps {
  vehicles: Vehicle[];
  userRole: Role;
  onCreateVehicle: (v: Partial<Vehicle>) => Promise<void>;
  onUpdateVehicle: (id: string, v: Partial<Vehicle>) => Promise<void>;
  onUpdateOdometer: (id: string, odo: number) => Promise<void>;
}

export default function VehiclesView({
  vehicles,
  userRole,
  onCreateVehicle,
  onUpdateVehicle,
  onUpdateOdometer
}: VehiclesViewProps) {
  // RBAC Access Control Checklist
  // Fleet Managers and Dispatchers can access. Others cannot.
  const hasAccess = userRole === Role.FLEET_MANAGER || userRole === Role.DISPATCHER;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOdoId, setEditingOdoId] = useState<string | null>(null);
  const [newOdoVal, setNewOdoVal] = useState<string>("");

  // Add vehicle form state
  const [formName, setFormName] = useState("");
  const [formReg, setFormReg] = useState("");
  const [formType, setFormType] = useState<VehicleType>(VehicleType.TRUCK);
  const [formCap, setFormCap] = useState("24000");
  const [formCost, setFormCost] = useState("120000");
  const [formPDate, setFormPDate] = useState("2025-01-01");
  const [formInsExp, setFormInsExp] = useState("2026-12-31");
  const [formFitExp, setFormFitExp] = useState("2026-12-31");
  const [formOdo, setFormOdo] = useState("100000");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  if (!hasAccess) {
    return <AccessDenied requiredRoles={[Role.FLEET_MANAGER, Role.DISPATCHER]} userRole={userRole} />;
  }

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Name", "Reg Number", "Type", "Capacity (kg/seats)", "Odometer (mi)", "Status", "Acquisition Cost (₹)", "Purchase Date", "Insurance Expiry", "Fitness Expiry"];
      const rows = vehicles.map(v => [
        v.id,
        `"${v.name.replace(/"/g, '""')}"`,
        v.regNumber,
        v.type,
        v.capacity,
        v.odometer,
        v.status,
        v.acquisitionCost,
        v.purchaseDate,
        v.insuranceExpiry,
        v.fitnessExpiry
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `TransitOps_Vehicles_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Failed to export CSV: " + e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formName || !formReg || !formPDate || !formInsExp || !formFitExp) {
      setFormError("All required fields must be populated.");
      return;
    }

    try {
      setSaving(true);
      await onCreateVehicle({
        name: formName,
        regNumber: formReg,
        type: formType,
        capacity: Number(formCap),
        acquisitionCost: Number(formCost),
        purchaseDate: formPDate,
        insuranceExpiry: formInsExp,
        fitnessExpiry: formFitExp,
        odometer: Number(formOdo),
        status: VehicleStatus.AVAILABLE
      });
      setShowAddModal(false);
      // Reset form
      setFormName("");
      setFormReg("");
      setFormCap("24000");
      setFormCost("120000");
    } catch (err: any) {
      setFormError(err.message || "Failed to add asset to database.");
    } finally {
      setSaving(false);
    }
  };

  const handleOdoSave = async (id: string, currentVal: number) => {
    const valNum = Number(newOdoVal);
    if (isNaN(valNum) || valNum < currentVal) {
      alert(`New odometer reading must be higher than current (${currentVal.toLocaleString()}).`);
      return;
    }

    try {
      await onUpdateOdometer(id, valNum);
      setEditingOdoId(null);
    } catch (err: any) {
      alert(err.message || "Failed to update mileage.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] font-sans">Active Fleet Asset Registry</h2>
          <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">CRUD ledger for vehicle certifications, capacities, and active odometers</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded border border-[#27272A] bg-[#18181B] hover:bg-[#27272A] text-xs font-mono text-[#FAFAFA] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#A1A1AA]" />
            <span>Export CSV</span>
          </button>
          
          {userRole === Role.FLEET_MANAGER && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#27272A]/40 text-[#A1A1AA] text-[10px] font-mono tracking-wider border-b border-[#27272A] uppercase">
                <th className="py-3.5 px-5 font-semibold">REG NUMBER</th>
                <th className="py-3.5 px-5 font-semibold">VEHICLE SPECS</th>
                <th className="py-3.5 px-5 font-semibold">CLASSIFICATION</th>
                <th className="py-3.5 px-5 font-semibold">CAPACITY</th>
                <th className="py-3.5 px-5 font-semibold">ODOMETER</th>
                <th className="py-3.5 px-5 font-semibold">EXPIRATION VERBAL</th>
                <th className="py-3.5 px-5 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-xs font-mono text-[#FAFAFA]">
              {vehicles.map((v) => {
                let statusColor = "";
                switch (v.status) {
                  case VehicleStatus.AVAILABLE:
                    statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    break;
                  case VehicleStatus.ON_TRIP:
                    statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    break;
                  case VehicleStatus.IN_SHOP:
                    statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    break;
                  case VehicleStatus.RETIRED:
                    statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
                    break;
                }

                // Compliance Warnings
                const fitnessExp = new Date(v.fitnessExpiry);
                const isFitnessExpiring = fitnessExp < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days alert limit

                return (
                  <tr key={v.id} className="hover:bg-[#1C1C1F]/40 transition-colors">
                    <td className="py-4 px-5 font-bold text-[#60A5FA]">{v.regNumber}</td>
                    <td className="py-4 px-5">
                      <div>
                        <div className="font-semibold text-sm text-[#FAFAFA] font-sans">{v.name}</div>
                        <div className="text-[10px] text-[#A1A1AA] mt-0.5">Purchased: {v.purchaseDate}</div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-[11px] px-1.5 py-0.5 bg-zinc-800 rounded text-[#FAFAFA]">
                        {v.type}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {v.type === VehicleType.BUS ? `${v.capacity} Seats` : `${v.capacity.toLocaleString()} kg`}
                    </td>
                    <td className="py-4 px-5">
                      {editingOdoId === v.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={newOdoVal}
                            onChange={(e) => setNewOdoVal(e.target.value)}
                            className="w-24 bg-[#09090B] border border-[#27272A] rounded px-1.5 py-0.5 text-xs text-[#FAFAFA] outline-none font-mono"
                          />
                          <button
                            onClick={() => handleOdoSave(v.id, v.odometer)}
                            className="p-1 rounded bg-[#10B981] text-white hover:bg-[#10B981]/80 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingOdoId(null)}
                            className="p-1 rounded bg-zinc-800 text-[#A1A1AA] hover:bg-zinc-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span>{v.odometer.toLocaleString()} mi</span>
                          {userRole === Role.FLEET_MANAGER && (
                            <button
                              onClick={() => {
                                setEditingOdoId(v.id);
                                setNewOdoVal(v.odometer.toString());
                              }}
                              className="p-1 rounded bg-zinc-800 text-[#A1A1AA] opacity-0 group-hover:opacity-100 hover:text-[#FAFAFA] transition-opacity cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px]">Ins: <span className="text-[#A1A1AA]">{v.insuranceExpiry}</span></div>
                        <div className="text-[11px] flex items-center gap-1">
                          <span>Fit: </span>
                          <span className={isFitnessExpiring ? "text-[#EF4444] font-semibold" : "text-[#A1A1AA]"}>
                            {v.fitnessExpiry}
                          </span>
                          {isFitnessExpiring && (
                            <span title="PM safety fitness cert expiring within 30 days!">
                              <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wider ${statusColor}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal Dialog for Admin */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#27272A] flex justify-between items-center bg-[#09090B]">
              <h3 className="font-semibold text-sm text-[#FAFAFA] font-sans uppercase tracking-wider">Register New Fleet Asset</h3>
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
                  <label className="text-[#A1A1AA] block">VEHICLE BRAND & MODEL *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenworth T680 Super Rig"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">REGISTRATION PLATE *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TX-9402"
                    value={formReg}
                    onChange={(e) => setFormReg(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">CLASSIFICATION TYPE</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as VehicleType)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value={VehicleType.TRUCK}>TRUCK</option>
                    <option value={VehicleType.VAN}>VAN</option>
                    <option value={VehicleType.BUS}>BUS</option>
                    <option value={VehicleType.SPECIALIZED}>SPECIALIZED</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">CAPACITY (KG OR SEATS) *</label>
                  <input
                    type="number"
                    required
                    value={formCap}
                    onChange={(e) => setFormCap(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ODOMETER START (MI) *</label>
                  <input
                    type="number"
                    required
                    value={formOdo}
                    onChange={(e) => setFormOdo(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ACQUISITION COST (₹)</label>
                  <input
                    type="number"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ACQUISITION DATE *</label>
                  <input
                    type="date"
                    required
                    value={formPDate}
                    onChange={(e) => setFormPDate(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">INSURANCE EXPIRY *</label>
                  <input
                    type="date"
                    required
                    value={formInsExp}
                    onChange={(e) => setFormInsExp(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">PM SAFETY FITNESS CERT EXPIRY *</label>
                  <input
                    type="date"
                    required
                    value={formFitExp}
                    onChange={(e) => setFormFitExp(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
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
                  {saving ? "Registering..." : "Commit Asset to DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
