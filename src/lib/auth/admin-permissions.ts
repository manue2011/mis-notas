import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";

// App-wide roles for the Better Auth admin plugin. Named "superadmin" so it
// can't be confused with the workspace "admin" role in ./permissions.
export const SUPERADMIN_ROLE = "superadmin";

export const adminAccess = createAccessControl(defaultStatements);

export const appRoles = {
  [SUPERADMIN_ROLE]: adminAccess.newRole(adminAc.statements),
  user: adminAccess.newRole(userAc.statements),
};
