import { NextResponse } from "next/server";
import { exportUserData } from "@/lib/account/export";
import { getSession } from "@/lib/auth/session";

// GET /cuenta/datos: downloads everything Libreta keeps about you, as JSON.
export async function GET() {
  const current = await getSession();
  if (!current) return NextResponse.json({ error: "Inicia sesión para descargar tus datos." }, { status: 401 });

  const data = await exportUserData(current.user.id);
  if (!data) return NextResponse.json({ error: "No se encontró la cuenta." }, { status: 404 });

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="libreta-mis-datos-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
