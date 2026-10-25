import { notFound } from "next/navigation";
import { AccentPlayground } from "./AccentPlayground";

export const metadata = { title: "Sistema de diseño" };

// Temporary design-system sandbox. Not available in production.
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <AccentPlayground />;
}
