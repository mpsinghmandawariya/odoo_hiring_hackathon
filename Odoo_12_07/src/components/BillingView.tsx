import { useState, useEffect } from "react";
import { Plus, Check, X, ShieldAlert, Wallet, Fuel, Search, TrendingUp, Calendar } from "lucide-react";
import { FuelLog, Expense, Vehicle, Trip, ExpenseCategory, Role } from "../types.ts";
import AccessDenied from "./AccessDenied.tsx";

interface BillingViewProps {
  fuelLogs: FuelLog[];
  expenses: Expense[];
  vehicles: Vehicle[];
  trips: Trip[];
  userRole: Role;
  onCreateFuelLog: (log: Partial<FuelLog>) => Promise<void>;
  onCreateExpense: (exp: Partial<Expense>) => Promise<void>;
  initialTab?: "expenses" | "fuel";
}

export default function BillingView({
  fuelLogs,
  expenses,
  vehicles,
  trips,
  userRole,
  onCreateFuelLog,
  onCreateExpense,
  initialTab = "expenses"
}: BillingViewProps) {
  // RBAC permissions check: Fleet Manager or Financial Analyst
  const hasAccess = userRole === Role.FLEET_MANAGER || userRole === Role.FINANCIAL_ANALYST;

  const [activeTab, setActiveTab] = useState<"expenses" | "fuel">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Expense form states
  const [expVehicle, setExpVehicle] = useState("");
  const [expTrip, setExpTrip] = useState("");
  const [expAmount, setExpAmount] = useState("45");
  const [expCategory, setExpCategory] = useState<ExpenseCategory>(ExpenseCategory.TOLL);
  const [expDesc, setExpDesc] = useState("");

  // Fuel form states
  const [fuelVehicle, setFuelVehicle] = useState("");
  const [fuelTrip, setFuelTrip] = useState("");
  const [fuelLiters, setFuelLiters] = useState("100");
  const [fuelCost, setFuelCost] = useState("150");
  const [fuelStation, setFuelStation] = useState("");

  if (!hasAccess) {
    return <AccessDenied requiredRoles={[Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST]} userRole={userRole} />;
  }

  // KPI calculations
  const totalExpAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const fuelExpensesSum = expenses.filter(e => e.category === ExpenseCategory.FUEL).reduce((sum, e) => sum + e.amount, 0);
  const maintenanceExpensesSum = expenses.filter(e => e.category === ExpenseCategory.MAINTENANCE).reduce((sum, e) => sum + e.amount, 0);
  const tollsExpensesSum = expenses.filter(e => e.category === ExpenseCategory.TOLL).reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!expVehicle || !expAmount || !expDesc) {
      setFormError("Please populate all required fields.");
      return;
    }

    try {
      setSaving(true);
      await onCreateExpense({
        vehicleId: expVehicle,
        tripId: expTrip || undefined,
        amount: Number(expAmount),
        category: expCategory,
        description: expDesc,
        date: new Date().toISOString().split("T")[0]
      });
      setShowExpenseModal(false);
      setExpVehicle("");
      setExpTrip("");
      setExpDesc("");
    } catch (err: any) {
      setFormError(err.message || "Failed to commit expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fuelVehicle || !fuelLiters || !fuelCost || !fuelStation) {
      setFormError("Please populate all required fill-up fields.");
      return;
    }

    try {
      setSaving(true);
      await onCreateFuelLog({
        vehicleId: fuelVehicle,
        tripId: fuelTrip || undefined,
        liters: Number(fuelLiters),
        cost: Number(fuelCost),
        date: new Date().toISOString().split("T")[0],
        fuelStation: fuelStation
      });
      setShowFuelModal(false);
      setFuelVehicle("");
      setFuelTrip("");
      setFuelStation("");
    } catch (err: any) {
      setFormError(err.message || "Failed to commit fuel log.");
    } finally {
      setSaving(false);
    }
  };

  const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.regNumber || "Unknown";
  const getTripNum = (id?: string) => {
    if (!id) return "N/A";
    return trips.find(t => t.id === id)?.tripNumber || "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] font-sans">Financial Accounts & Fuel Loggers</h2>
          <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Enforce operational cash auditing, register toll expenditures, and log commercial fuel fillups</p>
        </div>

        <div className="flex gap-2">
          {activeTab === "expenses" ? (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-1.5 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
          ) : (
            <button
              onClick={() => setShowFuelModal(true)}
              className="px-3.5 py-1.5 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Fill-Up</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#27272A] flex items-center gap-6">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 text-xs font-mono tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === "expenses" ? "border-[#3B82F6] text-[#FAFAFA] font-bold" : "border-transparent text-[#A1A1AA]"
          }`}
        >
          <span className="flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Expense Registry
          </span>
        </button>
        <button
          onClick={() => setActiveTab("fuel")}
          className={`pb-3 text-xs font-mono tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === "fuel" ? "border-[#3B82F6] text-[#FAFAFA] font-bold" : "border-transparent text-[#A1A1AA]"
          }`}
        >
          <span className="flex items-center gap-2">
            <Fuel className="w-4 h-4" /> Fuel Log Book
          </span>
        </button>
      </div>

      {/* 4 financial KPI cards */}
      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 font-mono text-xs">
            <div className="text-[#A1A1AA] mb-1 uppercase text-[10px]">Total Outflow</div>
            <div className="text-xl font-bold text-red-400">₹{totalExpAmount.toLocaleString("en-IN")}</div>
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 font-mono text-xs">
            <div className="text-[#A1A1AA] mb-1 uppercase text-[10px]">Fuel Charges</div>
            <div className="text-xl font-bold text-[#60A5FA]">₹{fuelExpensesSum.toLocaleString("en-IN")}</div>
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 font-mono text-xs">
            <div className="text-[#A1A1AA] mb-1 uppercase text-[10px]">Maintenance Repairs</div>
            <div className="text-xl font-bold text-amber-500">₹{maintenanceExpensesSum.toLocaleString("en-IN")}</div>
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 font-mono text-xs">
            <div className="text-[#A1A1AA] mb-1 uppercase text-[10px]">Tolls & Gateways</div>
            <div className="text-xl font-bold text-zinc-300">₹{tollsExpensesSum.toLocaleString("en-IN")}</div>
          </div>
        </div>
      )}

      {/* Table grid render */}
      {activeTab === "expenses" ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#27272A]/40 text-[#A1A1AA] text-[10px] font-mono tracking-wider border-b border-[#27272A] uppercase">
                  <th className="py-3.5 px-5 font-semibold">EXPENSE ID</th>
                  <th className="py-3.5 px-5 font-semibold">VEHICLE ASSIGNED</th>
                  <th className="py-3.5 px-5 font-semibold">TRIP REF</th>
                  <th className="py-3.5 px-5 font-semibold">CATEGORY</th>
                  <th className="py-3.5 px-5 font-semibold">DESCRIPTION</th>
                  <th className="py-3.5 px-5 font-semibold">DATE RECORDED</th>
                  <th className="py-3.5 px-5 font-semibold text-right">AMOUNT OUTFLOW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] text-xs font-mono text-[#FAFAFA]">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#A1A1AA]">
                      No expenses logged in this calendar month.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#1C1C1F]/40 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#A1A1AA]">#{exp.id}</td>
                      <td className="py-3.5 px-5 text-[#60A5FA] font-bold">{getVehicleReg(exp.vehicleId)}</td>
                      <td className="py-3.5 px-5">
                        {exp.tripId ? (
                          <span className="text-zinc-200">TR-{getTripNum(exp.tripId)}</span>
                        ) : (
                          <span className="text-zinc-600">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-[#FAFAFA]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-300 font-sans">{exp.description}</td>
                      <td className="py-3.5 px-5 text-zinc-400">{exp.date}</td>
                      <td className="py-3.5 px-5 text-right text-red-400 font-bold">
                        -₹{exp.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#27272A]/40 text-[#A1A1AA] text-[10px] font-mono tracking-wider border-b border-[#27272A] uppercase">
                  <th className="py-3.5 px-5 font-semibold">LOG ID</th>
                  <th className="py-3.5 px-5 font-semibold">VEHICLE</th>
                  <th className="py-3.5 px-5 font-semibold">TRIP BOARD REF</th>
                  <th className="py-3.5 px-5 font-semibold">LITERS FUELED</th>
                  <th className="py-3.5 px-5 font-semibold">FUEL SERVICE STATION</th>
                  <th className="py-3.5 px-5 font-semibold">DATE RECORDED</th>
                  <th className="py-3.5 px-5 font-semibold text-right">TRANSACTION COST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] text-xs font-mono text-[#FAFAFA]">
                {fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#A1A1AA]">
                      No fuel logging sheets recorded.
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1C1C1F]/40 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#A1A1AA]">#{log.id}</td>
                      <td className="py-3.5 px-5 text-[#60A5FA] font-bold">{getVehicleReg(log.vehicleId)}</td>
                      <td className="py-3.5 px-5">
                        {log.tripId ? (
                          <span className="text-zinc-200">TR-{getTripNum(log.tripId)}</span>
                        ) : (
                          <span className="text-zinc-600">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-[#FAFAFA] font-bold">{log.liters} L</td>
                      <td className="py-3.5 px-5 text-zinc-300 font-sans">{log.fuelStation}</td>
                      <td className="py-3.5 px-5 text-zinc-400">{log.date}</td>
                      <td className="py-3.5 px-5 text-right text-red-400 font-bold">
                        -₹{log.cost.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Logging Modal dialog */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#27272A] flex justify-between items-center bg-[#09090B]">
              <h3 className="font-semibold text-sm text-[#FAFAFA] font-sans uppercase tracking-wider">Log Corporate Outflow</h3>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 font-mono text-xs">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[#EF4444] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">TARGET FLEET ASSET *</label>
                <select
                  required
                  value={expVehicle}
                  onChange={(e) => setExpVehicle(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                >
                  <option value="">-- Choose Asset --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.regNumber} - {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">ASSOCIATED TRIP (OPTIONAL)</label>
                <select
                  value={expTrip}
                  onChange={(e) => setExpTrip(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                >
                  <option value="">-- None --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.tripNumber} ({t.source} {"->"} {t.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">OUTFLOW AMOUNT (₹) *</label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">CATEGORY *</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value={ExpenseCategory.TOLL}>TOLL</option>
                    <option value={ExpenseCategory.PARKING}>PARKING</option>
                    <option value={ExpenseCategory.MISCELLANEOUS}>MISCELLANEOUS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">EXPENSE DESCRIPTION DETAILED *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Secured overnight rig parking - Arizona exit 14"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="pt-4 border-t border-[#27272A] flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Commit Expense to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fuel fillup logger Modal dialog */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#27272A] flex justify-between items-center bg-[#09090B]">
              <h3 className="font-semibold text-sm text-[#FAFAFA] font-sans uppercase tracking-wider">Register Fuel Fill-Up</h3>
              <button 
                onClick={() => setShowFuelModal(false)}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFuelLog} className="p-5 space-y-4 font-mono text-xs">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[#EF4444] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">TARGET FLEET ASSET *</label>
                <select
                  required
                  value={fuelVehicle}
                  onChange={(e) => setFuelVehicle(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                >
                  <option value="">-- Choose Asset --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.regNumber} - {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">ASSOCIATED TRIP (OPTIONAL)</label>
                <select
                  value={fuelTrip}
                  onChange={(e) => setFuelTrip(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6] cursor-pointer"
                >
                  <option value="">-- None --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.tripNumber} ({t.source} {"->"} {t.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">VOLUME (LITERS) *</label>
                  <input
                    type="number"
                    required
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#A1A1AA] block">TOTAL COST (₹) *</label>
                  <input
                    type="number"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A1A1AA] block">FUEL STATION & BRAND *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Love's Travel Stop #124"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded p-2 text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="pt-4 border-t border-[#27272A] flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Commit Fill-up Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
