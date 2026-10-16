import { NextResponse } from "next/server";
import { ESQUEMA } from "@/lib/ejemplo";

export function GET() {
  return NextResponse.json(ESQUEMA, { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=3600" } });
}
