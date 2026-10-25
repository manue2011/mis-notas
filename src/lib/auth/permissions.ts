import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  page: ["read", "create", "update", "delete"],
  asset: ["read", "create", "delete"],
  settings: ["update"],
  inviteLink: ["create", "revoke"],
} as const;

export const ac = createAccessControl(statement);

export const lector = ac.newRole({
  page: ["read"],
  asset: ["read"],
});

export const editor = ac.newRole({
  page: ["read", "create", "update", "delete"],
  asset: ["read", "create", "delete"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  organization: ["update", "delete"],
  page: ["read", "create", "update", "delete"],
  asset: ["read", "create", "delete"],
  settings: ["update"],
  inviteLink: ["create", "revoke"],
});

export const roles = { admin, editor, lector };

export type RoleName = keyof typeof roles;

export const ROLE_NAMES = Object.keys(roles) as [RoleName, ...RoleName[]];

export type Permissions = {
  [K in keyof typeof statement]?: Array<(typeof statement)[K][number]>;
};
