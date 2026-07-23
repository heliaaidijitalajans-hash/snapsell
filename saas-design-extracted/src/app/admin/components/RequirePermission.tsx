import { useEffect } from "react";
import { useLocation } from "react-router";
import { useRbac } from "../rbac/RbacContext";
import { permissionForPath, type Permission } from "../rbac/permissions";
import { AccessDenied } from "./AccessDenied";

/** Blocks rendering when the current route requires a permission the session lacks. */
export function RequirePermission({
  children,
  permission,
}: {
  children: React.ReactNode;
  /** Override auto path matching. */
  permission?: Permission;
}) {
  const { can, touchActive, session } = useRbac();
  const location = useLocation();
  const needed = permission ?? permissionForPath(location.pathname);

  useEffect(() => {
    touchActive();
  }, [location.pathname, touchActive]);

  if (!session) return <AccessDenied />;
  if (needed && !can(needed)) return <AccessDenied permission={needed} />;
  return <>{children}</>;
}
