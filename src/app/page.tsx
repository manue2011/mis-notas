import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowToJoin } from "@/components/landing/HowToJoin";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AccentScope } from "@/components/ui/AccentScope";
import { DEFAULT_ACCENT } from "@/lib/accent";

export const metadata = {
  title: { absolute: "Libreta · Cuadernos compartidos para equipos pequeños" },
  description:
    "Un cuaderno compartido para tu equipo: páginas, listas de tareas, pantallazos, notas adhesivas y código. Solo por invitación.",
};

// Public home page. The app itself starts at /libretas.
export default function Home() {
  return (
    <AccentScope accent={DEFAULT_ACCENT} className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <HowToJoin />
      </main>
      <LandingFooter />
    </AccentScope>
  );
}
