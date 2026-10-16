import { NextResponse } from "next/server";
import { ETIQUETAS_PUBLICAS } from "@/lib/ejemplo";

/* Prototipo de la regla: datos públicos en cm que cualquier agente puede leer.
   Hoy son ejemplos ILUSTRATIVOS; no hay datos de personas. */
export function GET() {
  return NextResponse.json(
    {
      aviso: "Datos ILUSTRATIVOS de un formato PROPUESTO (etiqueta-cm/0.1). No es una norma vigente ni son tiendas reales.",
      esquema: "/api/esquema",
      etiquetas: ETIQUETAS_PUBLICAS,
    },
    { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" } },
  );
}
