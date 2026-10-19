import { NextResponse } from "next/server";
import { gemini, hayLlave, ipDe, permitido } from "@/lib/servidor";
import { LIM, sanearLectura } from "@/lib/motor";
import { sistemaLeer } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);

/* Lee la captura de una tabla de tallas. La imagen no se guarda en ningún lado. */
export async function POST(req: Request) {
  if (!permitido(ipDe(req), 15)) return NextResponse.json({ error: "Demasiadas lecturas seguidas. Espera unos minutos." }, { status: 429 });
  let body: { imagen?: unknown; categoria?: unknown; permiso?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }
  if (body.permiso !== true) return NextResponse.json({ error: "Sin tu permiso, la captura no se manda a la IA." }, { status: 403 });
  const categoria = body.categoria === "arriba" ? "arriba" : body.categoria === "abajo" ? "abajo" : null;
  if (!categoria) return NextResponse.json({ error: "Falta el tipo de prenda." }, { status: 400 });
  const m = typeof body.imagen === "string" ? /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(body.imagen) : null;
  if (!m || !TIPOS.has(m[1])) return NextResponse.json({ error: "La imagen debe ser JPG, PNG o WEBP." }, { status: 400 });
  if (m[2].length > LIM.imagenBase64Max) return NextResponse.json({ error: "La imagen es muy pesada (máximo ~1.5 MB)." }, { status: 413 });

  if (!hayLlave())
    return NextResponse.json({ simulado: true, error: "La lectura con IA no está configurada en este servidor. Escribe la tabla a mano o usa el ejemplo." });

  const r = await gemini(sistemaLeer(categoria), [
    { inlineData: { mimeType: m[1], data: m[2] } },
    { text: `Lee esta tabla de tallas. Tipo de prenda: ${categoria === "abajo" ? "de la cintura para abajo (pantalón, jeans, falda, short)" : "de la cintura para arriba (playera, camisa, sudadera)"}.` },
  ]);
  if (!r) return NextResponse.json({ error: "La IA no pudo leer la captura ahorita. Intenta otra vez o escríbela a mano." }, { status: 502 });
  const { tabla, notas } = sanearLectura(r.datos, categoria);
  if (!tabla) return NextResponse.json({ error: notas || "No se encontró una tabla de tallas en la captura." }, { status: 422 });
  return NextResponse.json({ tabla, notas, modelo: r.modelo });
}
