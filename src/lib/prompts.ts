/* Instrucciones para Gemini. La IA LEE y EXPLICA; nunca decide ni promete. */
import { MEDIDAS, NOMBRE, type Categoria, type Resultado } from "./tipos";
import { difTexto } from "./motor";

export function sistemaLeer(cat: Categoria): string {
  const claves = MEDIDAS[cat].join(", ");
  return `Lees capturas de TABLAS DE TALLAS de tiendas de ropa. Devuelves SOLO JSON.
Reglas:
- Copia los números tal como aparecen. NO conviertas unidades, NO redondees, NO completes huecos, NO inventes.
- Si una medida no aparece para una talla, pon null.
- Si un valor es un rango ("76-80"), devuelve [76, 80]. Si es un solo número, devuelve [n, n].
- Solo estas medidas, con estas claves: ${claves}. "entrepierna" es largo interior de pierna (inseam). Ignora otras medidas (estatura, peso, muslo, etc.).
- "tipo": "prenda" si la tabla dice que son medidas de la prenda (garment, prenda, producto acostado); "cuerpo" si dice que son medidas del cuerpo (body, tu cuerpo, cómo medirte); "nodice" si no lo dice claramente. No adivines.
- "unidad": "cm" o "in" según lo que diga la tabla. Si no lo dice, "cm" y explícalo en notas.
- "plano": true solo si la tabla dice que los contornos son a lo ancho / medio contorno / prenda acostada (½, "flat", "ancho"). Si no, false.
- "legible": false si no es una tabla de tallas o no se puede leer.
- "notas": máximo 2 frases cortas en español sobre algo dudoso. Nunca des consejos de compra.
Formato:
{"legible":true,"tipo":"prenda|cuerpo|nodice","unidad":"cm|in","plano":false,"filas":[{"talla":"M","medidas":{${MEDIDAS[cat].map((m) => `"${m}":[n,n]|null`).join(",")}}}],"notas":""}`;
}

export const SISTEMA_EXPLICAR = `Explicas en español de México, sencillo y corto, el resultado de una comparación de tallas YA CALCULADA.
Reglas estrictas:
- Usa SOLO los números que vienen en los datos. No calcules nada nuevo, no redondees distinto, no inventes medidas.
- Nunca digas que algo "te queda", "te va a quedar", que es "perfecto", "ideal" ni que está "garantizado". Di "se parece más en números".
- Nunca recomiendes comprar ni menciones tiendas, marcas o enlaces. No comprar también es válido.
- Di claramente qué datos faltan.
- Máximo 3 frases, máximo 450 caracteres. Tutea.
Devuelve JSON: {"texto":"..."}`;

/** Lo único que viaja al modelo para explicar: números ya calculados, sin nombres ni datos de la persona. */
export function datosParaExplicar(r: Resultado): string {
  const lineas: string[] = [];
  lineas.push(`Base: ${r.base === "prenda" ? "prenda de la persona contra medidas de la prenda" : "cuerpo de la persona contra tabla de cuerpo"}.`);
  lineas.push(`Talla que más se parece en números: ${r.masParecida ?? "ninguna clara"}${r.empate.length ? ` (empate entre ${r.empate.join(" y ")})` : ""}.`);
  if (r.motivo) lineas.push(`Nota del sistema: ${r.motivo}`);
  for (const t of r.tallas) {
    const d = t.celdas
      .map((c) => `${NOMBRE[c.medida]}: ${c.dif == null ? (c.estado === "falta-tuya" ? "la persona no la sabe" : "la tienda no la da") : difTexto(c.dif)}`)
      .join("; ");
    lineas.push(`Talla ${t.talla} → ${d}${t.distancia != null ? `; diferencia total ${t.distancia} cm` : ""}.`);
  }
  if (r.faltan.length) lineas.push(`Faltan: ${r.faltan.map((f) => `${NOMBRE[f.medida]} (${f.de === "tuya" ? "de la persona" : "de la tienda"})`).join(", ")}.`);
  return lineas.join("\n");
}
