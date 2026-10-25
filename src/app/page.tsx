import Link from "next/link";

// Placeholder until the app shell exists (step 6 redirects to the last workspace).
export default function Home() {
  return (
    <main className="px-6 py-16 md:px-16">
      <h1 className="font-serif text-4xl">Libreta</h1>
      <p className="mt-4 text-ink-muted">
        En construcción. Mira el <Link href="/dev/ui" className="underline">sistema de diseño</Link>.
      </p>
    </main>
  );
}
