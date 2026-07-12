import { useState } from "react";
import { Plus, Check, X, ShieldAlert, AlertTriangle, Star, ShieldCheck } from "lucide-react";
import { Driver, DriverStatus, Role } from "../types.ts";
import AccessDenied from "./AccessDenied.tsx";

interface DriversViewProps {
  drivers: Driver[];
  userRole: Role;
  onCreateDriver: (d: Partial<Driver>) => Promise<void>;
  onUpdateDriver: (id: string, d: Partial<Driver>) => Promise<void>;
}

export default function DriversView({
  drivers,
  userRole,
  onCreateDriver,
  onUpdateDriver
}: DriversViewProps) {
  // RBAC clearance: Fleet Manager and Safety Officer can view/manage, Dispatcher can view
  const hasAccess = userRole === Role.FLEET_MANAGER || userRole === Role.SAFETY_OFFICER || userRole === Role.DISPATCHER;
  const canManage = userRole === Role.FLEET_MANAGER || userRole === Role.SAFETY_OFFICER;

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Add form fields
  const [formName, setFormName] = useState("");
  const [formLicense, setFormLicense] = useState("");
  const [formCategory, setFormCategory] = useState("Class A CDL");
  const [formExpiry, setFormExpiry] = useState("2028-12-31");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formScore, setFormScore] = useState("95");
  const [formExp, setFormExp] = useState("5");

  if (!hasAccess) {
    return <AccessDenied requiredRoles={[Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.DISPATCHER]} userRole={userRole} />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName || !formLicense || !formPhone || !formEmail) {
      setFormError("Please populate all required fields.");
      return;
    }

    try {
      setSaving(true);
      await onCreateDriver({
        name: formName,
        licenseNumber: formLicense,
        category: formCategory,
        licenseExpiry: formExpiry,
        phone: formPhone,
        email: formEmail,
        safetyScore: Number(formScore),
        experience: Number(formExp),
        status: DriverStatus.AVAILABLE
      });
      setShowAddModal(false);

      // Reset
      setFormName("");
      setFormLicense("");
      setFormPhone("");
      setFormEmail("");
      setFormScore("95");
      setFormExp("5");
    } catch (err: any) {
      setFormError(err.message || "Failed to save driver profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] font-sans">Safety & Driver Registry Directory</h2>
          <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Manage operator CDL licenses, safety scoring indices, and operational status</p>
        </div>
        
        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Driver</span>
          </button>
        )}
      </div>

      {/* Grid containing Driver list */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#27272A]/40 text-[#A1A1AA] text-[10px] font-mono tracking-wider border-b border-[#27272A] uppercase">
                <th className="py-3.5 px-5 font-semibold">OPERATOR</th>
                <th className="py-3.5 px-5 font-semibold">LICENSE CDL</th>
                <th className="py-3.5 px-5 font-semibold">EXPIRATION</th>
                <th className="py-3.5 px-5 font-semibold">CONTACT DETAILS</th>
                <th className="py-3.5 px-5 font-semibold">EXPERIENCE</th>
                <th className="py-3.5 px-5 font-semibold">SAFETY INDICES</th>
                <th className="py-3.5 px-5 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-xs font-mono text-[#FAFAFA]">
              {drivers.map((d) => {
                let statusColor = "";
                switch (d.status) {
                  case DriverStatus.AVAILABLE:
                    statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    break;
                  case DriverStatus.ON_TRIP:
                    statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    break;
                  case DriverStatus.SUSPENDED:
                    statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
                    break;
                }

                // Check license expiry
                const expiry = new Date(d.licenseExpiry);
                const isExpiringSoon = expiry < new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 Days critical limit

                // Safety score levels
                const isScoreLow = d.safetyScore < 85;

                return (
                  <tr key={d.id} className="hover:bg-[#1C1C1F]/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#27272A] flex items-center justify-center font-bold text-[11px] text-[#60A5FA]">
                          {d.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#FAFAFA] font-sans">{d.name}</div>
                          <div className="text-[10px] text-[#A1A1AA] mt-0.5">ID: {d.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <div className="font-semibold text-[#FAFAFA]">{d.licenseNumber}</div>
                        <div className="text-[10px] text-[#A1A1AA]">{d.category}</div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className={isExpiringSoon ? "text-[#EF4444] font-bold" : "text-[#A1A1AA]"}>
                          {d.licenseExpiry}
                        </span>
                        {isExpiringSoon && (
                          <span title="CDL license expiring soon!">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] animate-bounce" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-zinc-300">
                      <div>{d.phone}</div>
                      <div className="text-[10px] text-[#A1A1AA] mt-0.5">{d.email}</div>
                    </td>
                    <td className="py-4 px-5">{d.experience} Years</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-8 text-center font-bold rounded p-0.5 text-[10px] ${
                          isScoreLow ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {d.safetyScore}
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => {
                            const active = d.safetyScore >= s * 20;
                            return (
                              <Star key={s} className={`w-2.5 h-2.5 ${active ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wider ${statusColor}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Registration Modal for Fleet Managers */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#27272A] flex justify-between items-center bg-[#09090B]">
              <h3 className="font-semibold text-sm text-[#FAFAFA] font-sans uppercase tracking-wider">Enroll New Commercial Driver</h3>
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
                  <label className="text-[#A1A1AA] block">FULL LEGAL NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe Jr."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">CDL LICENSE NUMBER *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CDL-TX-5412"
                    value={formLicense}
                    onChange={(e) => setFormLicense(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">LICENSE CLASS / PERMIT</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="Class A CDL">Class A CDL</option>
                    <option value="Class A CDL + HazMat">Class A CDL + HazMat</option>
                    <option value="Class B CDL">Class B CDL</option>
                    <option value="Class B CDL + Passenger">Class B CDL + Passenger</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">LICENSE EXPIRATION DATE *</label>
                  <input
                    type="date"
                    required
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">EXPERIENCE (YEARS)</label>
                  <input
                    type="number"
                    value={formExp}
                    onChange={(e) => setFormExp(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">PHONE NUMBER *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 (512) 555-0100"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. operator@transitops.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[#A1A1AA] block">STARTING SAFETY SCORE (0-100)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
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
                  {saving ? "Enrolling..." : "Commit Profile to DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
