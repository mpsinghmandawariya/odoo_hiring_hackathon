import { useState } from "react";
import { Plus, Milestone, ShieldCheck, Check, Ban, X, Navigation, AlertCircle, Sparkles } from "lucide-react";
import { Trip, TripStatus, Vehicle, Driver, Role } from "../types.ts";
import AccessDenied from "./AccessDenied.tsx";

interface TripsViewProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  userRole: Role;
  onCreateTrip: (t: Partial<Trip>) => Promise<void>;
  onDispatchTrip: (id: string) => Promise<void>;
  onCompleteTrip: (id: string) => Promise<void>;
  onCancelTrip: (id: string, reason: string) => Promise<void>;
}

export default function TripsView({
  trips,
  vehicles,
  drivers,
  userRole,
  onCreateTrip,
  onDispatchTrip,
  onCompleteTrip,
  onCancelTrip
}: TripsViewProps) {
  // RBAC permissions checks
  const canManage = userRole === Role.FLEET_MANAGER || userRole === Role.DISPATCHER;
  const canCancel = userRole === Role.FLEET_MANAGER || userRole === Role.DISPATCHER || userRole === Role.SAFETY_OFFICER;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  
  const [formSource, setFormSource] = useState("");
  const [formDest, setFormDest] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formDriver, setFormDriver] = useState("");
  const [formWeight, setFormWeight] = useState("15000");
  const [formRevenue, setFormRevenue] = useState("2500");
  const [formDistance, setFormDistance] = useState("450");
  const [formEta, setFormEta] = useState("2026-07-20T12:00");

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setGeneralError("");

    if (!formSource || !formDest || !formVehicle || !formDriver) {
      setFormError("All dispatch routing attributes must be configured.");
      return;
    }

    try {
      setSaving(true);
      await onCreateTrip({
        source: formSource,
        destination: formDest,
        vehicleId: formVehicle,
        driverId: formDriver,
        cargoWeight: Number(formWeight),
        revenue: Number(formRevenue),
        distance: Number(formDistance),
        eta: new Date(formEta).toISOString()
      });
      setShowAddModal(false);

      // Reset
      setFormSource("");
      setFormDest("");
      setFormVehicle("");
      setFormDriver("");
    } catch (err: any) {
      setFormError(err.message || "Failed to log trip dispatch ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (id: string) => {
    setGeneralError("");
    try {
      setActionLoading(id);
      await onDispatchTrip(id);
    } catch (err: any) {
      setGeneralError(err.message || "Guard block: validation error occurred during dispatch.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    setGeneralError("");
    try {
      setActionLoading(id);
      await onCompleteTrip(id);
    } catch (err: any) {
      setGeneralError(err.message || "Failed to complete trip.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubmit = async () => {
    if (!showCancelModal) return;
    setGeneralError("");
    try {
      setActionLoading(showCancelModal);
      await onCancelTrip(showCancelModal, cancelReason || "Dispatcher administrative cancellation.");
      setShowCancelModal(null);
      setCancelReason("");
    } catch (err: any) {
      setGeneralError(err.message || "Failed to cancel trip.");
    } finally {
      setActionLoading(null);
    }
  };

  const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.regNumber || "Unknown";
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || "Unknown";

  return (
    <div className="space-y-6">
      {/* Header element */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] font-sans">Trip Dispatch Control Center</h2>
          <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Authorize cargo dispatches, enforce weight capacities, and track active route statuses</p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Draft Trip Schedule</span>
          </button>
        )}
      </div>

      {generalError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-[#EF4444] font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold uppercase tracking-wider block mb-1">SAFETY/COMPLIANCE GUARD BLOCK:</span>
            <span>{generalError}</span>
          </div>
          <button onClick={() => setGeneralError("")} className="text-[#A1A1AA] hover:text-[#FAFAFA]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid listing Trips */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#27272A]/40 text-[#A1A1AA] text-[10px] font-mono tracking-wider border-b border-[#27272A] uppercase">
                <th className="py-3.5 px-5 font-semibold">TRIP NUMBER</th>
                <th className="py-3.5 px-5 font-semibold">FREIGHT ROUTING</th>
                <th className="py-3.5 px-5 font-semibold">VEHICLE ATTACHMENT</th>
                <th className="py-3.5 px-5 font-semibold">ASSIGNED OPERATOR</th>
                <th className="py-3.5 px-5 font-semibold">SPECS & REVENUE</th>
                <th className="py-3.5 px-5 font-semibold">DISPATCH STATUS</th>
                <th className="py-3.5 px-5 font-semibold text-right">DISPATCH BOARD ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-xs font-mono text-[#FAFAFA]">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A1A1AA]">
                    No trips currently registered in the system.
                  </td>
                </tr>
              ) : (
                trips.map((t) => {
                  let statusColor = "";
                  switch (t.status) {
                    case TripStatus.DRAFT:
                      statusColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
                      break;
                    case TripStatus.DISPATCHED:
                      statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      break;
                    case TripStatus.COMPLETED:
                      statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      break;
                    case TripStatus.CANCELLED:
                      statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
                      break;
                  }

                  return (
                    <tr key={t.id} className="hover:bg-[#1C1C1F]/40 transition-colors">
                      <td className="py-4 px-5 font-bold text-[#FAFAFA]">
                        <div>
                          <span className="text-[#60A5FA]">#{t.tripNumber}</span>
                          {t.startedAt && (
                            <span className="text-[9px] text-[#A1A1AA] font-normal block mt-1">
                              Dep: {new Date(t.startedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#A1A1AA]">{t.source}</span>
                          <span className="text-[#3B82F6]">➜</span>
                          <span className="text-[#FAFAFA]">{t.destination}</span>
                        </div>
                        <div className="text-[10px] text-[#A1A1AA] font-normal mt-1 flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-[#A1A1AA]" />
                          <span>ETA: {new Date(t.eta).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#FAFAFA]">{getVehicleReg(t.vehicleId)}</div>
                        <div className="text-[9px] text-[#A1A1AA] mt-0.5">Asset Ref: {t.vehicleId}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-zinc-200">{getDriverName(t.driverId)}</div>
                        <div className="text-[9px] text-[#A1A1AA] mt-0.5">Operator Ref: {t.driverId}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div>{t.cargoWeight.toLocaleString()} kg • {t.distance} mi</div>
                        <div className="text-[#10B981] font-semibold mt-1">₹{Number(t.revenue).toLocaleString("en-IN")} Rev</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wider ${statusColor}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === TripStatus.DRAFT && (
                            canManage ? (
                              <button
                                onClick={() => handleDispatch(t.id)}
                                disabled={actionLoading !== null}
                                className="px-2 py-1 rounded bg-[#3B82F6]/10 hover:bg-[#3B82F6] hover:text-white border border-[#3B82F6]/30 text-[#60A5FA] text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50"
                              >
                                {actionLoading === t.id ? "Working..." : "Authorize Dispatch"}
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#A1A1AA] font-semibold uppercase">Pending Dispatch</span>
                            )
                          )}

                          {t.status === TripStatus.DISPATCHED && (
                            canManage || canCancel ? (
                              <>
                                {canManage && (
                                  <button
                                    onClick={() => handleComplete(t.id)}
                                    disabled={actionLoading !== null}
                                    className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Complete</span>
                                  </button>
                                )}
                                
                                {canCancel && (
                                  <button
                                    onClick={() => setShowCancelModal(t.id)}
                                    disabled={actionLoading !== null}
                                    className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <Ban className="w-3 h-3" />
                                    <span>Cancel</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-blue-400 font-semibold uppercase">In Transit</span>
                            )
                          )}

                          {t.status === TripStatus.COMPLETED && (
                            <span className="text-[10px] font-mono text-[#10B981] font-semibold">Ledger Closed</span>
                          )}

                          {t.status === TripStatus.CANCELLED && (
                            <div className="text-right">
                              <span className="text-[10px] font-mono text-[#EF4444] font-semibold block">Aborted Route</span>
                              <span className="text-[9px] text-[#A1A1AA] italic block font-sans truncate max-w-[140px]" title={t.cancelledReason}>
                                {t.cancelledReason}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trip Modal dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#27272A] flex justify-between items-center bg-[#09090B]">
              <h3 className="font-semibold text-sm text-[#FAFAFA] font-sans uppercase tracking-wider">Initialize Dispatch Routing Ticket</h3>
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
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ORIGIN LOAD CITY *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Austin, TX"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">DESTINATION UNLOAD CITY *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phoenix, AZ"
                    value={formDest}
                    onChange={(e) => setFormDest(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ASSIGN FLEET ASSET *</label>
                  <select
                    value={formVehicle}
                    onChange={(e) => setFormVehicle(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.regNumber} - {v.name} ({v.status}) - Max {v.capacity.toLocaleString()}kg
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ASSIGN COMMERCIAL OPERATOR *</label>
                  <select
                    value={formDriver}
                    onChange={(e) => setFormDriver(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="">-- Choose Operator --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.category}) - Safety: {d.safetyScore} - ({d.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">CARGO WEIGHT LOAD (KG) *</label>
                  <input
                    type="number"
                    required
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">ROUTE DISTANCE (MILES) *</label>
                  <input
                    type="number"
                    required
                    value={formDistance}
                    onChange={(e) => setFormDistance(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">CONTRACT REVENUE (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formRevenue}
                    onChange={(e) => setFormRevenue(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">SCHEDULED ARRIVAL DATE / ETA *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formEta}
                    onChange={(e) => setFormEta(e.target.value)}
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
                  {saving ? "Drafting..." : "Generate Dispatch Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Reason Prompt Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#27272A] bg-[#09090B]">
              <h3 className="font-semibold text-sm text-[#EF4444] font-sans uppercase tracking-wider">Abrupt Route Cancellation</h3>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="space-y-2">
                <label className="text-[#A1A1AA] block">STATE CANCELLATION MOTIVE / REASON:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Client cancelled contract load / Vehicle radiator leak detected"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2.5 text-[#FAFAFA] outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(null);
                    setCancelReason("");
                  }}
                  className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-[#FAFAFA] cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleCancelSubmit}
                  className="px-4 py-2 rounded bg-[#EF4444] hover:bg-[#EF4444]/90 text-white cursor-pointer"
                >
                  Abort Route Dispatches
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
