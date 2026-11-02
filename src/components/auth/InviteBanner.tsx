import { PencilLine } from "lucide-react";
import { Tape } from "@/components/ui/Tape";

/** "Manuel te ha invitado a Libreta", on a card with a strip of tape. */
export function InviteBanner({ inviterName }: { inviterName: string | null }) {
  return (
    <div className="relative mb-8 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5">
      <Tape className="-top-2.5 left-5 w-20" rotate={-3} />
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-on-accent">
        <PencilLine size={16} strokeWidth={2} aria-hidden />
      </span>
      <p className="text-sm">
        {inviterName ? <strong className="font-semibold">{inviterName}</strong> : "Alguien"} te ha
        invitado a unirte a <strong className="font-semibold">Libreta</strong>
      </p>
    </div>
  );
}
