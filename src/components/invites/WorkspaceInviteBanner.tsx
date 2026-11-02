import { Monogram } from "@/components/ui/Monogram";
import { Tape } from "@/components/ui/Tape";
import type { AccentKey } from "@/lib/accent";

const roleText = { admin: "admin", editor: "editor", lector: "lector" } as const;

/** "Lucía te ha invitado a unirte a Equipo Diseño", on a taped card. */
export function WorkspaceInviteBanner(props: {
  inviterName: string | null;
  workspaceName: string;
  accent: AccentKey;
  role: keyof typeof roleText;
}) {
  return (
    <div className="relative mb-8 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5">
      <Tape className="-top-2.5 left-5 w-20" rotate={-3} />
      <Monogram name={props.workspaceName} accent={props.accent} className="size-9" />
      <p className="text-sm">
        {props.inviterName ? <strong className="font-semibold">{props.inviterName}</strong> : "Alguien"} te ha
        invitado a unirte a <strong className="font-semibold">{props.workspaceName}</strong> como{" "}
        {roleText[props.role]}
      </p>
    </div>
  );
}
