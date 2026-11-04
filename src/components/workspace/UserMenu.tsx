import Link from "next/link";
import { Settings } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { LeaveWorkspaceButton } from "./LeaveWorkspaceButton";

type Props = {
  name: string;
  email: string;
  superadmin: boolean;
  workspace: { organizationId: string; name: string };
};

export function UserMenu({ name, email, superadmin, workspace }: Props) {
  return (
    <div className="flex flex-col gap-1 border-t border-border pt-4">
      <div className="px-2 pb-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-ink-muted">{email}</p>
      </div>
      <ThemeSwitcher className="mb-1" />
      {superadmin ? (
        <Link
          href="/admin"
          className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-surface/70"
        >
          <Settings size={16} strokeWidth={1.75} aria-hidden />
          Administración
        </Link>
      ) : null}
      <LeaveWorkspaceButton key={workspace.organizationId} {...workspace} />
      <SignOutButton className="justify-start px-2" />
    </div>
  );
}
