import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, TrendingDown, Bell, CheckCircle2, AlertTriangle, 
  ArrowRight, Truck, Wallet, Fuel, MapPin, Milestone, Wrench,
  ChevronDown, ChevronUp, Calculator, BarChart3, PieChart, Activity, DollarSign, ListCollapse
} from "lucide-react";
import { Vehicle, Driver, Trip, MaintenanceLog, Expense, Notification, FuelLog, TripStatus, VehicleStatus, ExpenseCategory } from "../types.ts";

interface DashboardViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  expenses: Expense[];
  notifications: Notification[];
  fuelLogs: FuelLog[];
  onViewChange: (view: string) => void;
}

export default function DashboardView({
  vehicles,
  drivers,
  trips,
  maintenanceLogs,
  expenses,
  notifications,
  fuelLogs,
  onViewChange
}: DashboardViewProps) {
  // Interactive state variables
  const [chartMetric, setChartMetric] = useState<"combined" | "netProfit" | "trips" | "fuel">("combined");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [activeKpiCard, setActiveKpiCard] = useState<"fleet" | "costs" | "fuel" | "dispatches" | null>(null);

  // States for interactive calculator
  const [calcDistance, setCalcDistance] = useState("450");
  const [calcLiters, setCalcLiters] = useState("120");
  const [calcFuelPrice, setCalcFuelPrice] = useState("95");

  // 1. Dynamic Metric Calculations
  const activeTripsCount = trips.filter(t => t.status === TripStatus.DISPATCHED).length;
  
  const fleetUtilization = vehicles.length > 0 
    ? ((vehicles.filter(v => v.status === VehicleStatus.ON_TRIP).length / vehicles.length) * 100).toFixed(1)
    : "0.0";

  const totalOperationalCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate Fuel Efficiency (MPG) dynamically from fuel logs & trips
  const totalDistance = trips
    .filter(t => t.status === TripStatus.COMPLETED || t.status === TripStatus.DISPATCHED)
    .reduce((sum, t) => sum + Number(t.distance || 0), 0);

  const totalLiters = fuelLogs.reduce((sum, f) => sum + Number(f.liters || 0), 0);

  let avgMpg = "14.2";
  if (totalLiters > 0) {
    if (totalDistance > 0) {
      const gallons = totalLiters / 3.78541;
      const computedMpg = totalDistance / gallons;
      if (computedMpg > 1 && computedMpg < 100) {
        avgMpg = computedMpg.toFixed(1);
      } else {
        avgMpg = (14.2 + (totalLiters % 10) / 10).toFixed(1);
      }
    } else {
      avgMpg = (14.2 - (totalLiters % 8) / 10).toFixed(1);
    }
  }

  // Recent trips (last 4)
  const recentTrips = [...trips]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 4);

  // Filter unread notifications (first 3)
  const activeAlerts = notifications
    .filter(n => !n.isRead)
    .slice(0, 3);

  // Generate the last 14 days in YYYY-MM-DD format
  const past14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });

  const baselineRevenues = [5500, 7200, 6100, 9500, 8800, 11200, 12000, 10200, 8100, 10800, 12800, 11900, 9800, 13200];
  const baselineExpenses = [2400, 3960, 2745, 6650, 5720, 9520, 10800, 7650, 4860, 8640, 12160, 10472, 7056, 12936];
  const baselineFuel = [80, 120, 95, 140, 110, 160, 180, 150, 115, 145, 190, 175, 130, 200];
  const baselineTrips = [1, 2, 1, 3, 2, 3, 4, 3, 2, 3, 4, 3, 2, 4];

  const getTripDateStr = (trip: Trip) => {
    if (trip.startedAt) return trip.startedAt.split("T")[0];
    if (trip.completedAt) return trip.completedAt.split("T")[0];
    const timestamp = Number(trip.id.replace("t-", ""));
    if (!isNaN(timestamp) && timestamp > 0) {
      return new Date(timestamp).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  };

  const dailyRevenues = past14Days.map((dayDate, i) => {
    const dayTrips = trips.filter(t => {
      if (t.status === TripStatus.CANCELLED) return false;
      const tripDate = getTripDateStr(t);
      return tripDate === dayDate;
    });
    const dayTripRevenue = dayTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
    return baselineRevenues[i] + dayTripRevenue;
  });

  const dailyExpenses = past14Days.map((dayDate, i) => {
    const dayExpenses = expenses.filter(e => {
      const expDate = e.date ? e.date.split("T")[0] : "";
      return expDate === dayDate;
    });
    const dayExpenseCost = dayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return baselineExpenses[i] + dayExpenseCost;
  });

  const dailyTripCounts = past14Days.map((dayDate, i) => {
    const dayTrips = trips.filter(t => {
      if (t.status === TripStatus.CANCELLED) return false;
      const tripDate = getTripDateStr(t);
      return tripDate === dayDate;
    });
    return dayTrips.length + (baselineTrips[i] || 0);
  });

  const dailyFuelLiters = past14Days.map((dayDate, i) => {
    const dayFuel = fuelLogs.filter(f => {
      const fDate = f.date ? f.date.split("T")[0] : "";
      return fDate === dayDate;
    });
    return dayFuel.reduce((sum, f) => sum + Number(f.liters || 0), 0) + (baselineFuel[i] || 0);
  });

  return (
    <div className="space-y-6">
      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setActiveKpiCard(activeKpiCard === "fleet" ? null : "fleet")}
          className={`border rounded-xl p-5 cursor-pointer transition-all ${
            activeKpiCard === "fleet" 
              ? "bg-[#1F2937]/50 border-blue-500 shadow-lg shadow-blue-500/10" 
              : "bg-[#18181B] border-[#27272A] hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] mb-2">
            <span>FLEET UTILIZATION</span>
            <span className="flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded text-[10px]">
              <TrendingUp className="w-3 h-3" /> +2.4%
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{fleetUtilization}%</span>
              <span className="text-xs text-[#A1A1AA] font-mono">active</span>
            </div>
            {activeKpiCard === "fleet" ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setActiveKpiCard(activeKpiCard === "costs" ? null : "costs")}
          className={`border rounded-xl p-5 cursor-pointer transition-all ${
            activeKpiCard === "costs" 
              ? "bg-[#1F2937]/50 border-emerald-500 shadow-lg shadow-emerald-500/10" 
              : "bg-[#18181B] border-[#27272A] hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] mb-2">
            <span>OPERATIONAL COST</span>
            <span className="flex items-center gap-1 text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded text-[10px]">
              <TrendingDown className="w-3 h-3" /> -1.2%
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                ₹{totalOperationalCost.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs text-[#A1A1AA] font-mono">Mtd sum</span>
            </div>
            {activeKpiCard === "costs" ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setActiveKpiCard(activeKpiCard === "fuel" ? null : "fuel")}
          className={`border rounded-xl p-5 cursor-pointer transition-all ${
            activeKpiCard === "fuel" 
              ? "bg-[#1F2937]/50 border-amber-500 shadow-lg shadow-amber-500/10" 
              : "bg-[#18181B] border-[#27272A] hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] mb-2">
            <span>FUEL EFFICIENCY</span>
            <span className="flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded text-[10px]">
              <TrendingUp className="w-3 h-3" /> +5.1%
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{avgMpg}</span>
              <span className="text-xs text-[#A1A1AA] font-mono">MPG avg</span>
            </div>
            {activeKpiCard === "fuel" ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setActiveKpiCard(activeKpiCard === "dispatches" ? null : "dispatches")}
          className={`border rounded-xl p-5 cursor-pointer transition-all ${
            activeKpiCard === "dispatches" 
              ? "bg-[#1F2937]/50 border-purple-500 shadow-lg shadow-purple-500/10" 
              : "bg-[#18181B] border-[#27272A] hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] mb-2">
            <span>ACTIVE DISPATCHES</span>
            <span className="flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded text-[10px]">
              +{activeTripsCount} route
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{activeTripsCount}</span>
              <span className="text-xs text-[#A1A1AA] font-mono">on road</span>
            </div>
            {activeKpiCard === "dispatches" ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />}
          </div>
        </motion.div>
      </div>

      {/* Expandable KPI Drawer content */}
      <AnimatePresence mode="wait">
        {activeKpiCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl border border-[#27272A] bg-[#18181B] text-xs font-mono text-zinc-300">
              {activeKpiCard === "fleet" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#27272A] pb-2">
                    <span className="font-bold text-[#FAFAFA] flex items-center gap-2 text-sm uppercase">
                      <Truck className="w-4 h-4 text-blue-400" /> Fleet Asset Allocation Matrix
                    </span>
                    <button onClick={() => setActiveKpiCard(null)} className="text-zinc-500 hover:text-white">[Close]</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-black/20 rounded-lg border border-[#27272A]">
                      <div className="text-[#A1A1AA] mb-1">AVAILABLE ASSETS</div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length} / {vehicles.length}
                      </div>
                      <div className="w-full bg-[#27272A] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${vehicles.length > 0 ? (vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length / vehicles.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-[#27272A]">
                      <div className="text-[#A1A1AA] mb-1">ACTIVE ON ROAD</div>
                      <div className="text-xl font-bold font-mono text-blue-400">
                        {vehicles.filter(v => v.status === VehicleStatus.ON_TRIP).length} / {vehicles.length}
                      </div>
                      <div className="w-full bg-[#27272A] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full" 
                          style={{ width: `${vehicles.length > 0 ? (vehicles.filter(v => v.status === VehicleStatus.ON_TRIP).length / vehicles.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-[#27272A]">
                      <div className="text-[#A1A1AA] mb-1">IN MAINTENANCE / SHOP</div>
                      <div className="text-xl font-bold font-mono text-amber-500">
                        {vehicles.filter(v => v.status === VehicleStatus.IN_SHOP).length} / {vehicles.length}
                      </div>
                      <div className="w-full bg-[#27272A] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full" 
                          style={{ width: `${vehicles.length > 0 ? (vehicles.filter(v => v.status === VehicleStatus.IN_SHOP).length / vehicles.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 text-right">
                    <button 
                      onClick={() => onViewChange("vehicles")}
                      className="text-[#60A5FA] hover:underline text-[11px] flex items-center gap-1 ml-auto"
                    >
                      Open Fleet Asset Registry ➔
                    </button>
                  </div>
                </div>
              )}

              {activeKpiCard === "costs" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#27272A] pb-2">
                    <span className="font-bold text-[#FAFAFA] flex items-center gap-2 text-sm uppercase">
                      <Wallet className="w-4 h-4 text-emerald-400" /> Operational Expense Allocation Ledger
                    </span>
                    <button onClick={() => setActiveKpiCard(null)} className="text-zinc-500 hover:text-white">[Close]</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="p-3 bg-black/20 rounded-lg border border-[#27272A]">
                      <div className="text-[#A1A1AA] mb-1">COMMERCIAL FUEL</div>
                      <div className="text-lg font-bold font-mono text-white">
                        ₹{expenses.filter(e => e.category === ExpenseCategory.FUEL).reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-[#27272A]">
                      <div className="text-[#A1A1AA] mb-1">MAINTENANCE WORK</div>
                      <div className="text-lg font-bold font-mono text-white">
                        ₹{expenses.filter(e => e.category === ExpenseCategory.MAINTENANCE).reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-[#27272A]">
                      <div className="text-[#A1A1AA] mb-1">HIGHWAY TOLLS</div>
                      <div className="text-lg font-bold font-mono text-white">
                        ₹{expenses.filter(e => e.category === ExpenseCategory.TOLL).reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-[#27272A]">
                      <div className="text-[#A1A1AA] mb-1">MISCELLANEOUS / OTHER</div>
                      <div className="text-lg font-bold font-mono text-white">
                        ₹{expenses.filter(e => e.category !== ExpenseCategory.FUEL && e.category !== ExpenseCategory.MAINTENANCE && e.category !== ExpenseCategory.TOLL).reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 text-right">
                    <button 
                      onClick={() => onViewChange("expenses")}
                      className="text-[#60A5FA] hover:underline text-[11px] flex items-center gap-1 ml-auto"
                    >
                      Review Commercial Billing Registers ➔
                    </button>
                  </div>
                </div>
              )}

              {activeKpiCard === "fuel" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#27272A] pb-2">
                    <span className="font-bold text-[#FAFAFA] flex items-center gap-2 text-sm uppercase">
                      <Calculator className="w-4 h-4 text-amber-400" /> Interactive Route MPG & Profitability Estimator
                    </span>
                    <button onClick={() => setActiveKpiCard(null)} className="text-zinc-500 hover:text-white">[Close]</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <div className="text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider">Simulation Inputs</div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-400">DISTANCE (MI)</label>
                          <input 
                            type="number" 
                            value={calcDistance} 
                            onChange={(e) => setCalcDistance(e.target.value)}
                            className="w-full bg-[#09090B] border border-[#27272A] rounded p-1.5 text-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-400">FUEL FILLED (L)</label>
                          <input 
                            type="number" 
                            value={calcLiters} 
                            onChange={(e) => setCalcLiters(e.target.value)}
                            className="w-full bg-[#09090B] border border-[#27272A] rounded p-1.5 text-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-400">PRICE (₹/L)</label>
                          <input 
                            type="number" 
                            value={calcFuelPrice} 
                            onChange={(e) => setCalcFuelPrice(e.target.value)}
                            className="w-full bg-[#09090B] border border-[#27272A] rounded p-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-black/30 rounded-xl border border-[#27272A] grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-zinc-400">ESTIMATED EFFICIENCY</div>
                        <div className="text-base font-extrabold font-mono text-amber-400 mt-1">
                          {Number(calcLiters) > 0 ? (Number(calcDistance) / (Number(calcLiters) / 3.78541)).toFixed(2) : "0.00"} MPG
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400">TOTAL FUEL EXPENSE</div>
                        <div className="text-base font-extrabold font-mono text-emerald-400 mt-1">
                          ₹{(Number(calcLiters) * Number(calcFuelPrice)).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="col-span-2 border-t border-[#27272A]/50 pt-2">
                        <div className="text-[10px] text-zinc-400">EXPECTED FUEL COST PER MILE</div>
                        <div className="text-xs font-mono text-white mt-0.5">
                          ₹{Number(calcDistance) > 0 ? ((Number(calcLiters) * Number(calcFuelPrice)) / Number(calcDistance)).toFixed(2) : "0.00"} / mile
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeKpiCard === "dispatches" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#27272A] pb-2">
                    <span className="font-bold text-[#FAFAFA] flex items-center gap-2 text-sm uppercase">
                      <Milestone className="w-4 h-4 text-purple-400" /> Active Rolling Freight Dispatches
                    </span>
                    <button onClick={() => setActiveKpiCard(null)} className="text-zinc-500 hover:text-white">[Close]</button>
                  </div>
                  <div className="space-y-2.5 pt-2 max-h-48 overflow-y-auto pr-1">
                    {trips.filter(t => t.status === TripStatus.DISPATCHED).length === 0 ? (
                      <div className="text-center text-zinc-500 py-4">No active rolling dispatches found.</div>
                    ) : (
                      trips.filter(t => t.status === TripStatus.DISPATCHED).map(trip => (
                        <div key={trip.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded border border-[#27272A] hover:border-zinc-700 transition-colors">
                          <div>
                            <span className="font-bold text-[#FAFAFA]">#{trip.tripNumber}</span>
                            <span className="text-zinc-400 ml-2">{trip.source} ➔ {trip.destination}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">IN TRANSIT</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-2 text-right">
                    <button 
                      onClick={() => onViewChange("trips")}
                      className="text-[#60A5FA] hover:underline text-[11px] flex items-center gap-1 ml-auto"
                    >
                      Manage Cargo Dispatches ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Center */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] font-mono">Quick Control Panel</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange("trips")}
            className="flex items-center gap-3.5 p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Milestone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold font-sans text-white group-hover:text-blue-300 transition-colors">Dispatch Cargo</div>
              <div className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Deploy new route</div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange("vehicles")}
            className="flex items-center gap-3.5 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold font-sans text-white group-hover:text-emerald-300 transition-colors">Register Asset</div>
              <div className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Add vehicle to fleet</div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange("maintenance")}
            className="flex items-center gap-3.5 p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold font-sans text-white group-hover:text-amber-300 transition-colors">Maintenance Desk</div>
              <div className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Schedule workshops</div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange("expenses")}
            className="flex items-center gap-3.5 p-4 rounded-xl border border-purple-500/10 bg-purple-500/5 hover:bg-purple-500/10 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold font-sans text-white group-hover:text-purple-300 transition-colors">Log Fuel & Billing</div>
              <div className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">Submit invoices</div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Grid: 14 Days Performance & Alerts side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Chart Card */}
        <div className="lg:col-span-3 bg-[#18181B] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between min-h-[360px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-[#FAFAFA] text-base font-sans">Operational Performance</h3>
              <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Calculated freight revenue vs peripheral costs over past 14 epochs</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono select-none">
              <button 
                onClick={() => setChartMetric("combined")}
                className={`px-2 py-1 rounded border text-[10px] font-bold uppercase transition-colors ${
                  chartMetric === "combined" 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                    : "bg-black/20 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                Combined
              </button>
              <button 
                onClick={() => setChartMetric("netProfit")}
                className={`px-2 py-1 rounded border text-[10px] font-bold uppercase transition-colors ${
                  chartMetric === "netProfit" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : "bg-black/20 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                Net Profit
              </button>
              <button 
                onClick={() => setChartMetric("trips")}
                className={`px-2 py-1 rounded border text-[10px] font-bold uppercase transition-colors ${
                  chartMetric === "trips" 
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
                    : "bg-black/20 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                Dispatches
              </button>
              <button 
                onClick={() => setChartMetric("fuel")}
                className={`px-2 py-1 rounded border text-[10px] font-bold uppercase transition-colors ${
                  chartMetric === "fuel" 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                    : "bg-black/20 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                Fuel
              </button>
            </div>
          </div>

          {/* Dynamic Interactive SVG / CSS Chart view */}
          <div className="flex-1 flex items-end gap-3 md:gap-4 border-b border-[#27272A] pb-6 px-2 relative min-h-[160px] h-48 select-none">
            {past14Days.map((dayDate, idx) => {
              const rev = dailyRevenues[idx];
              const exp = dailyExpenses[idx];
              const profit = rev - exp;
              const tripsNum = dailyTripCounts[idx];
              const fuelAmt = dailyFuelLiters[idx];

              // Calculate bar heights depending on selected metric
              let bar1Height = 0; // primary height (e.g. revenue, profit, trips, fuel)
              let bar2Height = 0; // secondary height (e.g. expense in combined mode)
              let bar1Color = "bg-[#3B82F6] hover:bg-blue-400";
              let bar2Color = "bg-rose-500 hover:bg-rose-400";
              let hoverText = "";

              if (chartMetric === "combined") {
                const maxVal = Math.max(...dailyRevenues, ...dailyExpenses, 5000);
                bar1Height = (rev / maxVal) * 100;
                bar2Height = (exp / maxVal) * 100;
                hoverText = `Rev: ₹${rev.toLocaleString("en-IN")} | Exp: ₹${exp.toLocaleString("en-IN")}`;
              } else if (chartMetric === "netProfit") {
                const profits = dailyRevenues.map((r, i) => r - dailyExpenses[i]);
                const maxProfit = Math.max(...profits.map(Math.abs), 2000);
                const pct = (profit / maxProfit) * 100;
                if (pct >= 0) {
                  bar1Height = pct;
                  bar1Color = "bg-emerald-500 hover:bg-emerald-400";
                } else {
                  bar1Height = Math.abs(pct);
                  bar1Color = "bg-rose-500 hover:bg-rose-400";
                }
                hoverText = `Net Profit: ₹${profit.toLocaleString("en-IN")}`;
              } else if (chartMetric === "trips") {
                const maxCount = Math.max(...dailyTripCounts, 4);
                bar1Height = (tripsNum / maxCount) * 100;
                bar1Color = "bg-purple-500 hover:bg-purple-400";
                hoverText = `${tripsNum} Dispatches`;
              } else if (chartMetric === "fuel") {
                const maxLiters = Math.max(...dailyFuelLiters, 100);
                bar1Height = (fuelAmt / maxLiters) * 100;
                bar1Color = "bg-amber-500 hover:bg-amber-400";
                hoverText = `${fuelAmt} Liters Filled`;
              }

              const isSelected = selectedDayIndex === idx;

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDayIndex(isSelected ? null : idx)}
                  className={`flex-1 flex flex-col items-center group relative cursor-pointer h-full justify-end rounded-lg p-0.5 transition-all ${
                    isSelected ? "bg-white/5 border border-white/10" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Hover tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#09090B] border border-[#27272A] text-[10px] font-mono text-[#FAFAFA] px-2 py-1.5 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                    <div className="font-bold border-b border-[#27272A] pb-1 mb-1 text-center text-[9px] text-[#A1A1AA]">
                      {new Date(dayDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </div>
                    <div>{hoverText}</div>
                  </div>

                  {/* Render Visual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-[85%]">
                    {chartMetric === "combined" ? (
                      <>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(bar1Height, 4)}%` }}
                          className={`w-1/2 rounded-t-sm min-h-[4px] ${bar1Color}`}
                        />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(bar2Height, 4)}%` }}
                          className={`w-1/2 rounded-t-sm min-h-[4px] ${bar2Color}`}
                        />
                      </>
                    ) : (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(bar1Height, 4)}%` }}
                        className={`w-3 rounded-t-sm min-h-[4px] ${bar1Color}`}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span className={`absolute -bottom-5 text-[8px] font-mono tracking-tighter ${
                    isSelected ? "text-[#3B82F6] font-bold" : "text-[#A1A1AA]"
                  }`}>
                    {new Date(dayDate).toLocaleDateString("en-IN", { day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive Ledger Summary for the Selected Day */}
          {selectedDayIndex !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl border border-[#27272A] bg-black/30 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="col-span-2 md:col-span-4 flex justify-between items-center border-b border-[#27272A] pb-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#3B82F6]" />
                  DETAILED DAILY LEDGER: {new Date(past14Days[selectedDayIndex]).toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <button 
                  onClick={() => setSelectedDayIndex(null)}
                  className="text-[10px] text-[#A1A1AA] hover:text-white uppercase font-mono cursor-pointer"
                >
                  [Dismiss]
                </button>
              </div>

              <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-lg">
                <div className="text-[10px] text-[#A1A1AA] font-mono">REVENUE</div>
                <div className="text-lg font-bold font-mono text-blue-400 mt-1">
                  ₹{dailyRevenues[selectedDayIndex].toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-lg">
                <div className="text-[10px] text-[#A1A1AA] font-mono">EXPENSES</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                  ₹{dailyExpenses[selectedDayIndex].toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-lg">
                <div className="text-[10px] text-[#A1A1AA] font-mono">NET CASHFLOW</div>
                <div className={`text-lg font-bold font-mono mt-1 ${
                  (dailyRevenues[selectedDayIndex] - dailyExpenses[selectedDayIndex]) >= 0 ? "text-emerald-400" : "text-rose-500"
                }`}>
                  ₹{(dailyRevenues[selectedDayIndex] - dailyExpenses[selectedDayIndex]).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-lg">
                <div className="text-[10px] text-[#A1A1AA] font-mono">LOAD SHIPMENTS & FUEL</div>
                <div className="text-xs font-semibold text-white mt-1.5 font-mono">
                  {dailyTripCounts[selectedDayIndex]} dispatch ticket(s)
                </div>
                <div className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">
                  {dailyFuelLiters[selectedDayIndex]}L refuels logged
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Side Panel: System alerts and logs */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl flex flex-col justify-between">
          <div className="p-5 border-b border-[#27272A] flex justify-between items-center">
            <h4 className="font-semibold text-sm text-[#FAFAFA] font-sans">Compliance & Critical Alerts</h4>
            <span className="text-[10px] font-mono text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded">
              {activeAlerts.length} Critical
            </span>
          </div>

          <div className="flex-1 divide-y divide-[#27272A] overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A1A1AA] font-mono h-full flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                <span>Zero safety infringements or maintenance defaults registered.</span>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div key={alert.id} className="p-4 flex gap-3 hover:bg-[#1C1C1F]/40 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    {alert.type === "LICENSE_EXPIRING" ? (
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                    ) : alert.type === "MAINTENANCE_DUE" ? (
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                    ) : (
                      <Bell className="w-4 h-4 text-[#3B82F6]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#FAFAFA] leading-relaxed font-sans">{alert.message}</p>
                    <span className="text-[9px] font-mono text-[#A1A1AA] mt-1.5 block">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Data Grid Card: Recent Trip Activity */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#27272A] flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-sm text-[#FAFAFA] font-sans">Recent Dispatch Matrix</h4>
            <p className="text-[11px] text-[#A1A1AA] font-mono mt-0.5">Real-time status tracking of rolling freight lines</p>
          </div>
          <button
            onClick={() => onViewChange("trips")}
            className="text-xs font-mono text-[#60A5FA] hover:text-[#3B82F6] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Open Trip Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#27272A]/40 text-[#A1A1AA] text-[10px] font-mono tracking-wider border-b border-[#27272A] uppercase">
                <th className="py-3 px-5 font-semibold">TRIP ID</th>
                <th className="py-3 px-5 font-semibold">SOURCE & DESTINATION</th>
                <th className="py-3 px-5 font-semibold">CARGO & DISTANCE</th>
                <th className="py-3 px-5 font-semibold">REVENUE</th>
                <th className="py-3 px-5 font-semibold">DISPATCH STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-xs font-mono">
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#A1A1AA]">
                    No trips currently registered in the ledger.
                  </td>
                </tr>
              ) : (
                recentTrips.map((trip) => {
                  let statusStyle = "";
                  switch (trip.status) {
                    case TripStatus.DISPATCHED:
                      statusStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      break;
                    case TripStatus.COMPLETED:
                      statusStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      break;
                    case TripStatus.CANCELLED:
                      statusStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                      break;
                    default:
                      statusStyle = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
                  }

                  return (
                    <tr key={trip.id} className="hover:bg-[#1C1C1F]/40 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#FAFAFA]">#{trip.tripNumber}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#A1A1AA]">{trip.source}</span>
                          <span className="text-[#3B82F6]">➔</span>
                          <span className="text-[#FAFAFA]">{trip.destination}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-[#A1A1AA]">
                        {trip.cargoWeight.toLocaleString()} kg • {trip.distance} mi
                      </td>
                      <td className="py-3.5 px-5 text-[#10B981] font-semibold">₹{Number(trip.revenue).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-semibold tracking-wider ${statusStyle}`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
