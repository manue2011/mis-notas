import { CircleAlert } from "lucide-react";

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-error">
      <CircleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
