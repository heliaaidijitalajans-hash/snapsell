import { ShieldOff } from "lucide-react";
import { Link } from "react-router";
import { PERMISSION_LABELS, type Permission } from "../rbac/permissions";

export function AccessDenied({ permission }: { permission?: Permission | null }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Access Denied</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          You do not have permission to view this page.
          {permission ? (
            <>
              {" "}
              Required: <span className="text-white/70">{PERMISSION_LABELS[permission] || permission}</span>.
            </>
          ) : null}{" "}
          Contact a Super Admin if you need access.
        </p>
        <Link
          to="/admin"
          className="inline-flex px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white hover:bg-white/[0.1] transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
