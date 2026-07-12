import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  loginReal, 
  registerReal, 
  forgotPasswordReal, 
  resetPasswordReal 
} from "../lib/state.ts";
import { Role } from "../types.ts";
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Briefcase, 
  Key, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  HelpCircle,
  Activity,
  UserPlus,
  Sun,
  Moon,
  Truck,
  Warehouse,
  Compass,
  Package,
  Route
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function LoginView({ onLoginSuccess, theme, onToggleTheme }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  
  // Sign In inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.FLEET_MANAGER);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Sign Up inputs
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmployeeId, setRegEmployeeId] = useState("");
  const [regRole, setRegRole] = useState<Role>(Role.FLEET_MANAGER);

  // Forgot Password / Reset Password inputs
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  // Feedback States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto populate demo credentials
  const handleLoadDemo = (selectedRole: Role) => {
    setRole(selectedRole);
    if (selectedRole === Role.FLEET_MANAGER) {
      setEmail("manager@transitops.com");
      setPassword("Manager@123");
    } else if (selectedRole === Role.DISPATCHER) {
      setEmail("dispatcher@transitops.com");
      setPassword("Dispatcher@123");
    } else if (selectedRole === Role.SAFETY_OFFICER) {
      setEmail("safety@transitops.com");
      setPassword("Safety@123");
    } else if (selectedRole === Role.FINANCIAL_ANALYST) {
      setEmail("finance@transitops.com");
      setPassword("Finance@123");
    }
    setError(null);
    setSuccess(`Loaded ${selectedRole.replace("_", " ")} demo credentials.`);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out both email and password fields.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await loginReal(email, password, role);
      setSuccess("Authentication sequence validated. Redirecting...");
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 800);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError("Please fill out Name, Email, and Password.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await registerReal({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        employeeId: regEmployeeId,
        role: regRole
      });
      setSuccess("Account registered successfully! You can now log in.");
      // Pre-populate login form with newly created email
      setEmail(regEmail);
      setPassword(regPassword);
      setRole(regRole);
      setActiveTab("signin");
    } catch (err: any) {
      setError(err.message || "Failed to process registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Please enter your registered email address.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await forgotPasswordReal(forgotEmail);
      setResetToken(res.token || "");
      setSuccess(`Reset verification token issued. Use recovery code below.`);
      setActiveTab("reset");
    } catch (err: any) {
      setError(err.message || "No account found matching this email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !resetPassword) {
      setError("Token and new password are required.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await resetPasswordReal(resetToken, resetPassword);
      setSuccess("Security credentials updated! Proceed to sign in.");
      setPassword(resetPassword);
      setActiveTab("signin");
    } catch (err: any) {
      setError(err.message || "Invalid or expired recovery code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-root" className="min-h-screen w-screen flex flex-col md:flex-row bg-[#09090B] text-[#FAFAFA] font-sans overflow-x-hidden select-none relative">
      
      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2.5 rounded-lg border border-[#27272A] bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all cursor-pointer shadow-md flex items-center gap-2"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-mono uppercase tracking-wider hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>
      
      {/* LEFT PANEL: Redesigned Premium Logistics Hero Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-[#27272A] relative overflow-hidden bg-[#050f23]">
        
        {/* Background container with Ken Burns effect */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.15 }}
            transition={{
              duration: 25,
              ease: "linear",
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute inset-0 w-full h-full opacity-45"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=1920')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'blur(1px)', // Slight blur
            }}
          />
          
          {/* Subtle gradient overlay & vignette */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(5, 15, 35, 0.75) 0%, rgba(5, 15, 35, 0.92) 100%)`,
              boxShadow: 'inset 0 0 120px rgba(5, 15, 35, 0.95)'
            }}
          />
        </div>

        {/* Ambient Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none z-10" />

        {/* Floating Logistics Icons with low opacity (7%) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-7">
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[8%] text-white"
          >
            <Truck className="w-10 h-10" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -4, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[40%] right-[10%] text-white"
          >
            <Warehouse className="w-9 h-9" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[35%] left-[12%] text-white"
          >
            <Compass className="w-8 h-8" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-[18%] right-[15%] text-white"
          >
            <Package className="w-9 h-9" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute top-[22%] right-[25%] text-white"
          >
            <Shield className="w-8 h-8" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            className="absolute bottom-[10%] left-[30%] text-white"
          >
            <Route className="w-8 h-8" />
          </motion.div>
        </div>

        {/* Header Branding */}
        <div className="z-20 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] backdrop-blur-md">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#FFFFFF]">TransitOps</h1>
            <p className="text-[10px] font-mono tracking-wider uppercase text-[#3B82F6]">Smart Transport ERP</p>
          </div>
        </div>

        {/* Content & Supported Roles */}
        <div className="z-20 my-12 md:my-auto max-w-lg flex flex-col justify-center">
          <div className="flex">
            <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-[#3B82F6] border border-white/[0.08] backdrop-blur-md mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              <span>Enterprise Logistics Platform</span>
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-[48px] font-bold tracking-tight text-[#FFFFFF] leading-[1.1] font-sans">
            Smart Fleet Operations & Logistics Control
          </h2>
          
          <p className="mt-4 text-lg font-medium text-zinc-300 leading-relaxed font-sans">
            Manage fleets, dispatch operations, maintenance, fuel analytics, and enterprise transport workflows from one intelligent platform.
          </p>

          {/* Premium Glassmorphism Information Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[20px] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] mt-8 relative overflow-hidden group">
            {/* Ambient light streak inside card */}
            <div className="absolute -inset-px bg-gradient-to-r from-transparent via-[#3B82F6]/10 to-transparent opacity-50 pointer-events-none" />
            
            <ul className="space-y-3.5 relative z-10">
              {[
                "ISO 27001 Compliant",
                "Role-Based Access Control",
                "JWT Secure Authentication",
                "Real-Time Fleet Monitoring",
                "End-to-End Transport Analytics"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center space-x-3 text-sm text-zinc-200">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  </div>
                  <span className="font-semibold tracking-wide text-zinc-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Credentials Loader */}
          <div className="mt-8">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              <span>Quick Demo login emulator</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Fleet Manager", role: Role.FLEET_MANAGER },
                { name: "Dispatcher", role: Role.DISPATCHER },
                { name: "Safety Officer", role: Role.SAFETY_OFFICER },
                { name: "Financial Analyst", role: Role.FINANCIAL_ANALYST }
              ].map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleLoadDemo(r.role)}
                  className="px-3 py-2 rounded-lg border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#3B82F6]/40 text-xs font-semibold text-zinc-300 hover:text-white transition-all duration-200 cursor-pointer backdrop-blur-md"
                >
                  {r.name}
                </button>
              ))}
            </div>
            <p className="text-[9px] font-mono text-zinc-400 mt-2">
              Click a button above to auto-populate credentials for role-based system emulation.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-20 text-[10px] font-mono text-zinc-500 flex justify-between items-center pt-6 border-t border-white/[0.05]">
          <span>© 2026 TransitOps ERP, Inc.</span>
          <span>SECURE TLS 1.3 SECP256K1</span>
        </div>
      </div>

      {/* RIGHT PANEL: Dynamic Authentication Cards */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 relative bg-[#09090B]">
        <div className="w-full max-w-md">
          
          {/* Notifications / Alerts banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-start space-x-3"
              >
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Switch Board */}
          <AnimatePresence mode="wait">
            
            {/* 1. SIGN IN SCREEN */}
            {activeTab === "signin" && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border border-[#27272A] rounded-xl bg-[#18181B]/40 p-8 shadow-xl backdrop-blur-md relative"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#FFFFFF]">Sign in to TransitOps</h3>
                  <p className="text-xs text-[#71717A] mt-1">Provide your credentials and select your authorized security tier.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#52525B]" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. manager@transitops.com"
                        className="w-full pl-10 pr-4 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setActiveTab("forgot")}
                        className="text-xs text-[#3B82F6] hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#52525B]" />
                      <input 
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Authorized Security Role</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-2.5 h-4 w-4 text-[#52525B]" />
                      <select 
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full pl-10 pr-4 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all appearance-none"
                      >
                        <option value={Role.FLEET_MANAGER}>Fleet Manager (All Rights)</option>
                        <option value={Role.DISPATCHER}>Dispatcher (Active Dispatch Boards)</option>
                        <option value={Role.SAFETY_OFFICER}>Safety Officer (Driver Auditing)</option>
                        <option value={Role.FINANCIAL_ANALYST}>Financial Analyst (Fuel & Expenses)</option>
                      </select>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs text-[#A1A1AA] cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-[#09090B] border-[#27272A] text-[#3B82F6] focus:ring-[#3B82F6]" 
                      />
                      <span>Keep terminal logged on (Remember me)</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-[#3B82F6] hover:bg-[#2563EB] text-[#FFFFFF] py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Validate & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch to SignUp */}
                <div className="mt-6 pt-6 border-t border-[#27272A] text-center text-xs text-[#71717A]">
                  Don't have an operator ledger yet?{" "}
                  <button 
                    onClick={() => setActiveTab("signup")} 
                    className="text-[#3B82F6] hover:underline font-semibold"
                  >
                    Request Operator Account
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. SIGN UP SCREEN */}
            {activeTab === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border border-[#27272A] rounded-xl bg-[#18181B]/40 p-8 shadow-xl backdrop-blur-md"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#FFFFFF]">Request Operator Credentials</h3>
                  <p className="text-xs text-[#71717A] mt-1">Setup your transport ledger nodes. Roles are subject to authorization verification.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">Full Operator Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2 h-3.5 w-3.5 text-[#52525B]" />
                      <input 
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Captain Sarah Lin"
                        className="w-full pl-9 pr-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2 h-3.5 w-3.5 text-[#52525B]" />
                      <input 
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. sarah.lin@transitops.com"
                        className="w-full pl-9 pr-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">Create Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2 h-3.5 w-3.5 text-[#52525B]" />
                      <input 
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 8 complex characters"
                        className="w-full pl-9 pr-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Phone */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2 h-3.5 w-3.5 text-[#52525B]" />
                        <input 
                          type="text"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+1 (555) 234-5678"
                          className="w-full pl-9 pr-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                        />
                      </div>
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">Employee Node ID</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-2 h-3.5 w-3.5 text-[#52525B]" />
                        <input 
                          type="text"
                          value={regEmployeeId}
                          onChange={(e) => setRegEmployeeId(e.target.value)}
                          placeholder="EMP-8088"
                          className="w-full pl-9 pr-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Requested Role */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">Requested Operational Role</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#52525B]" />
                      <select 
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as Role)}
                        className="w-full pl-9 pr-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      >
                        <option value={Role.FLEET_MANAGER}>Fleet Manager (All Rights)</option>
                        <option value={Role.DISPATCHER}>Dispatcher (Active Dispatch Boards)</option>
                        <option value={Role.SAFETY_OFFICER}>Safety Officer (Driver Auditing)</option>
                        <option value={Role.FINANCIAL_ANALYST}>Financial Analyst (Fuel & Expenses)</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Registration Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-[#3B82F6] hover:bg-[#2563EB] text-[#FFFFFF] py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Request Access Keys</span>
                        <UserPlus className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch to SignIn */}
                <div className="mt-5 pt-5 border-t border-[#27272A] text-center text-xs text-[#71717A]">
                  Return to security validations checkpoint.{" "}
                  <button 
                    onClick={() => setActiveTab("signin")} 
                    className="text-[#3B82F6] hover:underline font-semibold"
                  >
                    Operator Login
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. FORGOT PASSWORD SCREEN */}
            {activeTab === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border border-[#27272A] rounded-xl bg-[#18181B]/40 p-8 shadow-xl backdrop-blur-md"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#FFFFFF]">Request Security Reset</h3>
                  <p className="text-xs text-[#71717A] mt-1">A mock recovery token will be outputted directly into this terminal window upon validation.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#52525B]" />
                      <input 
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="manager@transitops.com"
                        className="w-full pl-10 pr-4 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Reset Password Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-[#3B82F6] hover:bg-[#2563EB] text-[#FFFFFF] py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Issue Reset Token</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Cancel link */}
                <div className="mt-6 pt-6 border-t border-[#27272A] text-center text-xs">
                  <button 
                    onClick={() => setActiveTab("signin")} 
                    className="text-[#A1A1AA] hover:text-[#FAFAFA] font-medium"
                  >
                    Cancel and return
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. RESET PASSWORD WITH TOKEN SCREEN */}
            {activeTab === "reset" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border border-[#27272A] rounded-xl bg-[#18181B]/40 p-8 shadow-xl backdrop-blur-md"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#FFFFFF]">Verify Security Token</h3>
                  <p className="text-xs text-[#71717A] mt-1">We have auto-populated your generated reset token below. Input your new security password.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* Token */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Verification Reset Code</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-[#52525B]" />
                      <input 
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="reset-XXXXXX"
                        className="w-full pl-10 pr-4 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Define New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#52525B]" />
                      <input 
                        type="password"
                        required
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="Minimum 8 complex characters"
                        className="w-full pl-10 pr-4 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Reset Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-[#3B82F6] hover:bg-[#2563EB] text-[#FFFFFF] py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Validate & Overwrite Credentials</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Cancel link */}
                <div className="mt-6 pt-6 border-t border-[#27272A] text-center text-xs">
                  <button 
                    onClick={() => setActiveTab("signin")} 
                    className="text-[#A1A1AA] hover:text-[#FAFAFA] font-medium"
                  >
                    Cancel and return
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
