import { LegalLinks } from "@/components/legal/LegalLinks";
import { Logo } from "@/components/ui/Logo";

export function LandingFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-8 sm:px-12 lg:px-20">
      <Logo href={null} />
      <LegalLinks />
      <p className="font-hand text-lg text-ink-muted">hecho con cuidado, y con mucho café</p>
    </footer>
  );
}
