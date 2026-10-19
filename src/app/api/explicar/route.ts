import { NextResponse } from "next/server";
import { gemini, hayLlave, ipDe, permitido } from "@/lib/servidor";
import { comparar, explicacionPlantilla, leerCuerpo, leerReferencia, leerTabla, revisarExplicacion, validarCuerpo, validarReferencia, validarTabla } from "@/lib/motor";
import { SISTEMA_EXPLICAR, datosParaExplicar } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

/* El servidor vuelve a correr las reglas: lo que diga el navegador no basta.
   A la IA solo le llegan los números ya calculados, sin nombres. */
export async function POST(req: Request) {
  if (!permitido(ipDe(req), 30)) return NextResponse.json({ error: "Demasiadas solicitudes. Espera unos minutos." }, { status: 429 });
  let body: { referencia?: unknown; cuerpo?: unknown; tabla?: unknown; permiso?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }
  const ref = leerReferencia(body.referencia);
  const tabla = leerTabla(body.tabla);
  if (!ref || !tabla) return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  const cuerpo = leerCuerpo(body.cuerpo, ref.categoria);
  const errores = [...validarReferencia(ref), ...validarTabla(tabla), ...(cuerpo ? validarCuerpo(cuerpo, ref.categoria) : [])];
  if (errores.length) return NextResponse.json({ error: errores[0] }, { status: 422 });

  const resultado = comparar(ref, cuerpo, tabla);
  const plantilla = explicacionPlantilla(resultado, ref.nombre);
  if (!resultado.ok || body.permiso !== true || !hayLlave())
    return NextResponse.json({ texto: plantilla, fuente: "plantilla", motivo: !resultado.ok ? "sin comparación" : body.permiso !== true ? "sin permiso de IA" : "sin llave" });

  const r = await gemini(SISTEMA_EXPLICAR, [{ text: datosParaExplicar(resultado) }]);
  const texto = typeof (r?.datos as { texto?: unknown })?.texto === "string" ? String((r!.datos as { texto: string }).texto).trim() : "";
  const rev = revisarExplicacion(texto, resultado);
  if (!rev.ok) {
    if (texto) console.error("Texto de IA rechazado:", rev.motivo);
    return NextResponse.json({ texto: plantilla, fuente: "plantilla", motivo: texto ? `la IA se rechazó (${rev.motivo})` : "la IA no respondió" });
  }
  return NextResponse.json({ texto, fuente: "gemini", modelo: r!.modelo });
}
