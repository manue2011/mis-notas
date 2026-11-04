import type { RoleName } from "@/lib/auth/permissions";

export const ROLE_LABELS: Record<RoleName, string> = {
  admin: "Administrador",
  editor: "Editor",
  lector: "Lector",
};

export function roleLabel(role: string): string {
  return role in ROLE_LABELS ? ROLE_LABELS[role as RoleName] : role;
}
