import { NextResponse } from "next/server";
import { hayLlave } from "@/lib/servidor";

/* Solo dice SI hay llave configurada; nunca devuelve su valor. */
export function GET() {
  return NextResponse.json({ ia: hayLlave() ? "gemini" : "simulado" });
}
