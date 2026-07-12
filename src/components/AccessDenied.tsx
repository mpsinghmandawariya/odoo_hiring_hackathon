import { ShieldX } from "lucide-react";
import { Role } from "../types.ts";

interface AccessDeniedProps {
  requiredRoles: Role[];
  userRole: Role;
}

export default function AccessDenied({ requiredRoles, userRole }: AccessDeniedProps) {
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
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#09090B]">
      <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-6">
        <ShieldX className="w-8 h-8 animate-pulse" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-[#FAFAFA] font-sans mb-2">
        Access Restricted (RBAC Block)
      </h2>
      
      <p className="text-sm text-[#A1A1AA] max-w-md leading-relaxed mb-6">
        Your current active role <span className="font-mono text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/20">{getRoleLabel(userRole)}</span> does not have governance authority to modify or view this module.
      </p>

      <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-lg max-w-sm w-full text-left font-mono">
        <div className="text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-2">Required Clearance Roles:</div>
        <div className="space-y-1">
          {requiredRoles.map((role, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-[#FAFAFA]">
              <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full"></span>
              <span>{getRoleLabel(role)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
