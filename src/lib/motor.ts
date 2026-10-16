/* El motor de CENTÍMETRO: todas las reglas viven aquí y corren igual en el
   navegador y en el servidor. La IA lee y explica; el motor calcula. */

import {
  CON_ARTICULO, CONTORNOS, MEDIDAS, MEDIDAS_CUERPO, NOMBRE,
  type Categoria, type Celda, type Cuerpo, type EtiquetaCm, type FilaTalla, type Medida,
  type Rango, type Referencia, type Resultado, type ResultadoTalla, type Tabla, type TipoTabla,
  type Unidad, type RegistroDecision, type Devolucion,
} from "./tipos";

export const LIM = {
  texto: 80,
  devolucion: 600,
  fuente: 200,
  tallaLargo: 8,
  filasMin: 2,
  filasMax: 12,
  imagenBase64Max: 2_100_000, // ~1.5 MB de imagen
  explicacionMax: 650,
  precioMax: 1_000_000,
  mesesMax: 48,
  decisionesMax: 100,
};

/* Tolerancia para decir "parecido": en contornos 2 cm, en largos 1.5 cm. */
export const TOLERANCIA = (m: Medida) => (CONTORNOS.includes(m) ? 2 : 1.5);

/* Rangos plausibles en cm, ya como contorno completo o largo completo. */
const PLAUSIBLE: Record<Medida, [number, number]> = {
  cintura: [40, 200],
  cadera: [50, 220],
  pecho: [50, 220],
  entrepierna: [30, 110],
  largo: [30, 140],
  hombros: [25, 80],
  manga: [10, 95],
};

export const medio = (x: number) => Math.round(x * 2) / 2;

export function aCm(n: number, unidad: Unidad): number {
  return unidad === "in" ? medio(n * 2.54) : medio(n);
}

export function plausible(m: Medida, cm: number): boolean {
  const [a, b] = PLAUSIBLE[m];
  return Number.isFinite(cm) && cm >= a && cm <= b;
}

/* ---------- Texto ---------- */

const PATRONES_PROHIBIDOS: [RegExp, string][] = [
  [/\b[\w.+-]+@[\w-]+\.[\w.]+\b/, "un correo"],
  [/(\+?52[\s-]?)?(\d[\s-]?){10}/, "un teléfono"],
  [/\bAIza[0-9A-Za-z_-]{20,}/, "una llave de Google"],
  [/\b(sk|pk|rk)[-_][A-Za-z0-9_-]{16,}/, "una llave secreta"],
  [/\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/i, "una CURP"],
  [/\b(?:\d[ -]?){15,16}\b/, "un número de tarjeta"],
  [/contrase(ñ|n)a\s*[:=]/i, "una contraseña"],
];

/** Devuelve qué dato sensible trae el texto, o null si está limpio. */
export function revisarTexto(t: string): string | null {
  for (const [re, que] of PATRONES_PROHIBIDOS) if (re.test(t)) return que;
  return null;
}

export function limpio(t: unknown, max: number): string {
  return String(t ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/* ---------- Referencia (la prenda de la persona) ---------- */

/** Convierte lo que escribió la persona (contornos a lo ancho) a cm completos. */
export function referenciaEnCm(ref: Referencia): Partial<Record<Medida, number | null>> {
  const out: Partial<Record<Medida, number | null>> = {};
  for (const m of MEDIDAS[ref.categoria]) {
    const v = ref.plano[m];
    out[m] = v == null ? null : medio(CONTORNOS.includes(m) ? v * 2 : v);
  }
  return out;
}

export function validarReferencia(ref: Referencia): string[] {
  const e: string[] = [];
  if (!ref.nombre || ref.nombre.length < 2) e.push("Ponle un nombre a tu prenda (por ejemplo, \"mi pantalón azul\").");
  if (ref.nombre.length > LIM.texto) e.push("El nombre es muy largo.");
  const q = revisarTexto(ref.nombre);
  if (q) e.push(`El nombre parece traer ${q}. Quítalo.`);
  const cm = referenciaEnCm(ref);
  let conocidas = 0;
  for (const m of MEDIDAS[ref.categoria]) {
    const v = cm[m];
    if (v == null) continue;
    conocidas++;
    if (!plausible(m, v))
      e.push(`${NOMBRE[m]}: ${v} cm no parece una medida real${CONTORNOS.includes(m) ? " (recuerda: se mide a lo ancho, nosotros la duplicamos)" : ""}.`);
  }
  if (conocidas === 0) e.push("Necesitas al menos una medida. Las demás pueden quedar como \"no sé\".");
  return e;
}

export function validarCuerpo(c: Cuerpo, cat: Categoria): string[] {
  const e: string[] = [];
  for (const m of MEDIDAS_CUERPO[cat]) {
    const v = c.medidas[m];
    if (v != null && !plausible(m, v)) e.push(`${NOMBRE[m]} del cuerpo: ${v} cm no parece real.`);
  }
  return e;
}

/* ---------- Tabla de la tienda ---------- */

export function contarNumeros(filas: FilaTalla[]): number {
  let n = 0;
  for (const f of filas) for (const r of Object.values(f.medidas)) if (r) n += r.min === r.max ? 1 : 2;
  return n;
}

/** Normaliza a cm y a contorno completo. */
export function rangoEnCm(m: Medida, r: Rango, t: Pick<Tabla, "unidad" | "plano" | "tipo">): Rango {
  const doble = t.plano && t.tipo === "prenda" && CONTORNOS.includes(m) ? 2 : 1;
  return { min: medio(aCm(r.min, t.unidad) * doble), max: medio(aCm(r.max, t.unidad) * doble) };
}

export function validarTabla(t: Tabla): string[] {
  const e: string[] = [];
  if (limpio(t.producto, LIM.texto).length < 2) e.push("Escribe qué prenda es.");
  if (limpio(t.tienda, LIM.texto).length < 2) e.push("Escribe de qué tienda o marca es la tabla.");
  for (const s of [t.producto, t.tienda]) {
    const q = revisarTexto(s);
    if (q) e.push(`Un campo parece traer ${q}.`);
  }
  if (t.filas.length < LIM.filasMin) e.push("La tabla necesita al menos 2 tallas.");
  if (t.filas.length > LIM.filasMax) e.push("Máximo 12 tallas.");
  const vistas = new Set<string>();
  for (const f of t.filas) {
    const tal = f.talla.trim();
    if (!tal || tal.length > LIM.tallaLargo) e.push(`Talla "${tal || "(vacía)"}" no válida.`);
    if (vistas.has(tal.toUpperCase())) e.push(`La talla ${tal} está repetida.`);
    vistas.add(tal.toUpperCase());
    for (const m of MEDIDAS[t.categoria]) {
      const r = f.medidas[m];
      if (!r) continue;
      if (!(r.min <= r.max)) e.push(`${tal} · ${NOMBRE[m]}: el mínimo es mayor que el máximo.`);
      const cm = rangoEnCm(m, r, t);
      const tipoEsCuerpo = t.tipo === "cuerpo";
      if (!plausible(m, cm.min) || !plausible(m, cm.max))
        e.push(`${tal} · ${NOMBRE[m]}: ${cm.min}${cm.max !== cm.min ? "–" + cm.max : ""} cm no parece real${!tipoEsCuerpo && CONTORNOS.includes(m) && !t.plano ? " (¿la tabla da medidas a lo ancho?)" : ""}.`);
    }
  }
  if (contarNumeros(t.filas) === 0) e.push("La tabla no tiene ningún número.");
  return e;
}

/** Limpia lo que devolvió Gemini. Lo que no cumple, se descarta; nunca se inventa. */
export function sanearLectura(raw: unknown, categoria: Categoria): { tabla: Omit<Tabla, "tienda" | "producto" | "origen" | "correcciones" | "revisada"> | null; notas: string } {
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r !== "object") return { tabla: null, notas: "La respuesta no se pudo leer." };
  if (r.legible === false) return { tabla: null, notas: limpio(r.notas, 200) || "La IA dice que la captura no se lee." };
  const tipo: TipoTabla = r.tipo === "prenda" || r.tipo === "cuerpo" ? r.tipo : "nodice";
  const unidad: Unidad = r.unidad === "in" ? "in" : "cm";
  const plano = r.plano === true;
  const filasRaw = Array.isArray(r.filas) ? r.filas.slice(0, LIM.filasMax) : [];
  const filas: FilaTalla[] = [];
  for (const fr of filasRaw) {
    const f = fr as { talla?: unknown; medidas?: Record<string, unknown> };
    const talla = limpio(f?.talla, LIM.tallaLargo);
    if (!talla || filas.some((x) => x.talla.toUpperCase() === talla.toUpperCase())) continue;
    const medidas: FilaTalla["medidas"] = {};
    for (const m of MEDIDAS[categoria]) {
      const v = f?.medidas?.[m];
      let rango: Rango | null = null;
      if (Array.isArray(v) && v.length >= 1) {
        const a = Number(v[0]), b = Number(v[v.length > 1 ? 1 : 0]);
        if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) rango = { min: Math.min(a, b), max: Math.max(a, b) };
      } else if (typeof v === "number" && v > 0) rango = { min: v, max: v };
      if (rango) {
        const cm = rangoEnCm(m, rango, { unidad, plano, tipo });
        if (!plausible(m, cm.min) || !plausible(m, cm.max)) rango = null; // número raro: se descarta, no se corrige
      }
      medidas[m] = rango;
    }
    filas.push({ talla, medidas });
  }
  if (filas.length < LIM.filasMin) return { tabla: null, notas: "No se encontraron al menos 2 tallas con números." };
  return { tabla: { categoria, tipo, unidad, plano, filas, numerosLeidos: contarNumeros(filas) }, notas: limpio(r.notas, 200) };
}

/** Cuenta cuántos números cambió la persona respecto a lo que leyó la IA. */
export function contarCambios(antes: FilaTalla[], despues: FilaTalla[]): number {
  let n = 0;
  const mapa = new Map(antes.map((f) => [f.talla.toUpperCase(), f]));
  for (const f of despues) {
    const a = mapa.get(f.talla.toUpperCase());
    const claves = new Set([...Object.keys(f.medidas), ...Object.keys(a?.medidas ?? {})]) as Set<Medida>;
    for (const m of claves) {
      const x = a?.medidas[m] ?? null, y = f.medidas[m] ?? null;
      if (!x && !y) continue;
      if (!x || !y) { n += 1; continue; }
      if (x.min !== y.min) n++;
      if (x.max !== y.max && !(x.min === x.max && y.min === y.max)) n++;
    }
  }
  for (const a of antes) if (!despues.some((f) => f.talla.toUpperCase() === a.talla.toUpperCase())) n += 1;
  return n;
}

/* ---------- Comparación ---------- */

export function comparar(ref: Referencia, cuerpo: Cuerpo | null, t: Tabla): Resultado {
  const base: Resultado["base"] = t.tipo === "cuerpo" ? "cuerpo" : "prenda";
  const vacio: Resultado = { ok: false, motivo: null, base, medidasComparables: [], tallas: [], masParecida: null, empate: [], faltan: [], avisos: [] };

  if (!t.revisada) return { ...vacio, motivo: "Primero revisa la tabla contra la captura y confírmala." };
  if (t.categoria !== ref.categoria)
    return { ...vacio, motivo: "Tu prenda y la tabla son de tipos distintos (una es de arriba y otra de abajo)." };
  if (t.tipo === "nodice")
    return {
      ...vacio,
      motivo:
        "La tabla no dice si son medidas de la prenda o de tu cuerpo, y eso cambia todo: una prenda siempre mide más que el cuerpo que la usa. Sin ese dato, no comparamos. Esto es justo lo que la etiqueta en cm resolvería.",
    };

  let tuyas: Partial<Record<Medida, number | null>>;
  let lista: Medida[];
  if (t.tipo === "prenda") {
    tuyas = referenciaEnCm(ref);
    lista = MEDIDAS[t.categoria];
  } else {
    lista = MEDIDAS_CUERPO[t.categoria];
    tuyas = {};
    for (const m of lista) tuyas[m] = cuerpo?.medidas[m] ?? null;
    if (!lista.some((m) => tuyas[m] != null))
      return {
        ...vacio,
        motivo:
          "Esta tabla es de medidas del CUERPO y tu referencia es una PRENDA. No se pueden comparar directo. Si quieres, escribe tus medidas del cuerpo (opcional, se quedan en tu navegador).",
      };
  }

  const tallas: ResultadoTalla[] = t.filas.map((f) => {
    const celdas: Celda[] = lista.map((m) => {
      const tuya = tuyas[m] ?? null;
      const r = f.medidas[m] ?? null;
      const tienda = r ? rangoEnCm(m, r, t) : null;
      if (tuya == null) return { medida: m, tuya, tienda, dif: null, estado: "falta-tuya" };
      if (!tienda) return { medida: m, tuya, tienda, dif: null, estado: "falta-tienda" };
      const dif = tuya >= tienda.min && tuya <= tienda.max ? 0 : tuya < tienda.min ? medio(tienda.min - tuya) : medio(tienda.max - tuya);
      const estado = Math.abs(dif) <= TOLERANCIA(m) ? "parecido" : dif > 0 ? "mas" : "menos";
      return { medida: m, tuya, tienda, dif, estado };
    });
    return { talla: f.talla, celdas, distancia: null };
  });

  // Solo cuentan para elegir las medidas que se pueden comparar en TODAS las tallas.
  const comparables = lista.filter((m) => tallas.every((tt) => tt.celdas.find((c) => c.medida === m)?.dif != null));
  for (const tt of tallas)
    tt.distancia = comparables.length ? medio(comparables.reduce((s, m) => s + Math.abs(tt.celdas.find((c) => c.medida === m)!.dif!), 0)) : null;

  const faltan: Resultado["faltan"] = [];
  for (const m of lista) {
    if (tuyas[m] == null) faltan.push({ medida: m, de: "tuya" });
    else if (!comparables.includes(m)) faltan.push({ medida: m, de: "tienda" });
  }

  const avisos: string[] = [
    "La tabla la hizo la tienda: es parte interesada. Profeco midió jeans en 2026 y encontró modelos que no medían lo que decía su etiqueta.",
  ];
  if (ref.estira === "si") avisos.push("Tu prenda estira. Una tela distinta puede sentirse diferente aunque los números se parezcan.");
  if (ref.estira === "nose") avisos.push("No sabemos si tu prenda estira, y eso cambia cómo se siente la misma medida.");
  if (t.unidad === "in") avisos.push("La tabla venía en pulgadas; se convirtió a cm (1 in = 2.54 cm) y se redondeó a medio centímetro.");
  if (t.plano && t.tipo === "prenda") avisos.push("La tabla daba medidas a lo ancho; se duplicaron para tener el contorno.");
  if (t.origen === "gemini") avisos.push(`La IA leyó ${t.numerosLeidos} números de la captura y tú corregiste ${t.correcciones}.`);
  if (base === "cuerpo") avisos.push("Comparaste medidas del cuerpo contra una tabla del cuerpo. Cuánto le sobra a la prenda lo decide la tienda y no lo sabemos.");

  let masParecida: string | null = null;
  let empate: string[] = [];
  let motivo: string | null = null;
  if (comparables.length < 2) {
    motivo =
      comparables.length === 1
        ? `Solo hay 1 medida que se puede comparar (${NOMBRE[comparables[0]].toLowerCase()}). No alcanza para decir qué talla se parece más; abajo están los números.`
        : "No hay ninguna medida que se pueda comparar en todas las tallas.";
  } else {
    const orden = [...tallas].sort((a, b) => a.distancia! - b.distancia!);
    const mejor = orden[0].distancia!;
    empate = orden.filter((x) => x.distancia! - mejor <= 1).map((x) => x.talla);
    if (empate.length === 1) {
      masParecida = empate[0];
      empate = [];
    }
    if (mejor / comparables.length > 4)
      avisos.push(`Ninguna talla se parece mucho a tu prenda: la más cercana tiene ${mejor} cm de diferencia sumando las medidas. No comprar también es una opción.`);
  }

  return { ok: true, motivo, base, medidasComparables: comparables, tallas, masParecida, empate, faltan, avisos };
}

/* ---------- Texto de la IA ---------- */

const PROMESAS = [
  /te (va a )?queda(r|rá|ra)?\b/i, /te quedar[áa]/i, /perfect[oa]/i, /garantiz/i, /segur[oa] (que )?te/i,
  /c[oó]mpra(la|lo|las|los)\b/i, /te recomiendo comprar/i, /deber[ií]as comprar/i, /vale la pena comprar/i, /\bideal\b/i,
];
const NEGACION = /\b(no|ni|nunca|sin)\s+(\S+\s+){0,3}$/i;

function numerosPermitidos(r: Resultado): number[] {
  const s = new Set<number>();
  for (let i = 0; i <= 10; i++) s.add(i);
  for (const t of r.tallas) {
    const n = Number(t.talla.replace(",", "."));
    if (Number.isFinite(n)) s.add(n);
    if (t.distancia != null) s.add(t.distancia);
    for (const c of t.celdas) {
      if (c.tuya != null) s.add(c.tuya);
      if (c.tienda) { s.add(c.tienda.min); s.add(c.tienda.max); }
      if (c.dif != null) s.add(Math.abs(c.dif));
    }
  }
  s.add(2.54); s.add(2026);
  return [...s];
}

/** Revisa el texto de la IA: sin promesas de ajuste y sin números que el motor no calculó. */
export function revisarExplicacion(texto: string, r: Resultado): { ok: boolean; motivo: string | null } {
  if (!texto || texto.length < 20) return { ok: false, motivo: "vacío" };
  if (texto.length > LIM.explicacionMax) return { ok: false, motivo: "muy largo" };
  for (const re of PROMESAS) {
    const m = re.exec(texto);
    if (m && !NEGACION.test(texto.slice(Math.max(0, m.index - 30), m.index))) return { ok: false, motivo: `promesa: "${m[0]}"` };
  }
  if (/https?:\/\/|www\./i.test(texto)) return { ok: false, motivo: "trae un enlace" };
  const permitidos = numerosPermitidos(r);
  for (const n of texto.match(/\d+(?:[.,]\d+)?/g) ?? []) {
    const v = Number(n.replace(",", "."));
    if (!permitidos.some((p) => Math.abs(p - v) < 0.051)) return { ok: false, motivo: `número no calculado: ${n}` };
  }
  return { ok: true, motivo: null };
}

const f1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function difTexto(d: number): string {
  if (d === 0) return "igual";
  return `${d > 0 ? "+" : "−"}${f1(Math.abs(d))} cm`;
}

/** "Mi Pantalón azul" → "pantalón azul", para poder decir "tu pantalón azul". */
export function nombrePrenda(n: string): string {
  const t = n.trim().replace(/^(mi|mis|tu|tus|el|la)\s+/i, "");
  return (t || "prenda").replace(/^\p{Lu}(?!\p{Lu})/u, (c) => c.toLowerCase());
}

/** Explicación sin IA: la misma información, con reglas fijas. */
export function explicacionPlantilla(r: Resultado, nombreRef: string): string {
  if (!r.ok) return r.motivo ?? "No se pudo comparar.";
  const partes: string[] = [];
  const contra = r.base === "prenda" ? `tu ${nombrePrenda(nombreRef)}` : "tus medidas del cuerpo";
  if (r.masParecida) {
    const t = r.tallas.find((x) => x.talla === r.masParecida)!;
    const det = t.celdas
      .filter((c) => c.dif != null)
      .map((c) => (c.dif === 0 ? `${NOMBRE[c.medida].toLowerCase()} igual` : `${NOMBRE[c.medida].toLowerCase()} ${difTexto(c.dif!)}`))
      .join(", ");
    partes.push(`En números, la ${r.masParecida} es la que más se parece a ${contra}: ${det}.`);
  } else if (r.empate.length) {
    partes.push(`Las tallas ${r.empate.join(" y ")} quedan casi igual de cerca de ${contra}. Depende de si lo prefieres más justo o más holgado.`);
  } else if (r.motivo) partes.push(r.motivo);
  const ft = r.faltan.filter((f) => f.de === "tienda").map((f) => CON_ARTICULO[f.medida]);
  const fy = r.faltan.filter((f) => f.de === "tuya").map((f) => CON_ARTICULO[f.medida]);
  if (ft.length) partes.push(`La tienda no da ${ft.join(" ni ")}, así que eso es una incógnita.`);
  if (fy.length) partes.push(`No sabes ${fy.join(" ni ")} de ${r.base === "prenda" ? "tu prenda" : "tu cuerpo"}; si lo mides, la comparación mejora.`);
  partes.push("Esto no garantiza cómo te va a quedar: la tabla es de la tienda.");
  return partes.join(" ");
}

/* ---------- Pausa y decisión ---------- */

export function validarDevolucion(d: Devolucion): string[] {
  const e: string[] = [];
  if (d.texto.length > LIM.devolucion) e.push("El texto de la devolución es muy largo.");
  if (d.fuente.length > LIM.fuente) e.push("La fuente es muy larga.");
  if (!d.noEncontre && d.texto.trim() && !d.fuente.trim()) e.push("Si pegas la política, di de dónde salió (página, correo, ticket).");
  for (const s of [d.texto, d.fuente]) {
    const q = revisarTexto(s);
    if (q) e.push(`La devolución parece traer ${q}. Quítalo.`);
  }
  return e;
}

export function validarPago(precio: number | null, meses: number | null): string[] {
  const e: string[] = [];
  if (precio != null && (!(precio > 0) || precio > LIM.precioMax)) e.push("El precio no es válido.");
  if (meses != null && (!Number.isInteger(meses) || meses < 1 || meses > LIM.mesesMax)) e.push("Los meses deben ser de 1 a 48.");
  if (meses != null && meses > 1 && precio == null) e.push("Para ver el pago por mes, escribe el precio.");
  return e;
}

/** Cuenta honesta: solo conteos con su denominador, sin porcentajes. */
export function cuentaHonesta(regs: RegistroDecision[]) {
  const total = regs.length;
  const noCompro = regs.filter((r) => r.decision === "no-compro").length;
  const compraron = regs.filter((r) => r.decision === "compro" || r.decision === "otra");
  const conDesenlace = compraron.filter((r) => r.desenlace && r.desenlace !== "no-llego");
  const quedo = conDesenlace.filter((r) => r.desenlace === "quedo").length;
  return { total, noCompro, compraron: compraron.length, conDesenlace: conDesenlace.length, quedo };
}

/* ---------- Etiqueta en cm (la regla pública propuesta) ---------- */

export function aEtiqueta(t: Tabla, fecha: string): EtiquetaCm {
  if (t.tipo === "nodice") throw new Error("Sin tipo de medidas no hay etiqueta.");
  return {
    formato: "etiqueta-cm/0.1",
    producto: limpio(t.producto, LIM.texto),
    marca_o_tienda: limpio(t.tienda, LIM.texto),
    categoria: t.categoria,
    tipo_medidas: t.tipo,
    tallas: t.filas.map((f) => {
      const medidas_cm: Partial<Record<Medida, [number, number]>> = {};
      for (const m of MEDIDAS[t.categoria]) {
        const r = f.medidas[m];
        if (r) {
          const c = rangoEnCm(m, r, t);
          medidas_cm[m] = [c.min, c.max];
        }
      }
      return { talla: f.talla, medidas_cm };
    }),
    fuente: {
      quien: t.origen === "ejemplo" ? "ejemplo-inventado" : "tabla-de-la-tienda",
      como: t.origen === "gemini" ? `captura leída por IA (${t.numerosLeidos} números) y revisada por el comprador (${t.correcciones} correcciones)` : t.origen === "manual" ? "tabla copiada a mano por el comprador" : "ejemplo de la app",
      fecha,
      verificada_fisicamente: false,
    },
    estado: t.origen === "ejemplo" ? "ILUSTRATIVO" : "APORTADA",
  };
}

export function validarEtiqueta(x: unknown): string[] {
  const e: string[] = [];
  const o = x as EtiquetaCm;
  if (!o || typeof o !== "object") return ["No es un objeto."];
  if (o.formato !== "etiqueta-cm/0.1") e.push("formato");
  if (typeof o.producto !== "string" || !o.producto || o.producto.length > LIM.texto) e.push("producto");
  if (typeof o.marca_o_tienda !== "string" || !o.marca_o_tienda || o.marca_o_tienda.length > LIM.texto) e.push("marca_o_tienda");
  if (o.categoria !== "abajo" && o.categoria !== "arriba") e.push("categoria");
  if (o.tipo_medidas !== "prenda" && o.tipo_medidas !== "cuerpo") e.push("tipo_medidas");
  if (!Array.isArray(o.tallas) || o.tallas.length < 1 || o.tallas.length > LIM.filasMax) e.push("tallas");
  else
    for (const t of o.tallas) {
      if (typeof t.talla !== "string" || !t.talla || t.talla.length > LIM.tallaLargo) e.push("talla");
      for (const [m, v] of Object.entries(t.medidas_cm ?? {})) {
        if (!(MEDIDAS[o.categoria] ?? []).includes(m as Medida)) e.push(`medida ${m}`);
        else if (!Array.isArray(v) || v.length !== 2 || !plausible(m as Medida, v[0]) || !plausible(m as Medida, v[1]) || v[0] > v[1]) e.push(`valor ${m}`);
      }
    }
  if (!o.fuente || typeof o.fuente.fecha !== "string" || typeof o.fuente.verificada_fisicamente !== "boolean") e.push("fuente");
  if (o.estado !== "ILUSTRATIVO" && o.estado !== "APORTADA") e.push("estado");
  for (const s of [o.producto, o.marca_o_tienda, o.fuente?.como ?? ""]) if (typeof s === "string" && revisarTexto(s)) e.push("datos sensibles");
  return e;
}

/* base64url para viajar en el fragmento (#) del enlace: el navegador no lo manda al servidor. */
export function codificar(o: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(o));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodificar(s: string): unknown {
  try {
    const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(b, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/* ---------- Lectura segura de lo que manda el navegador (servidor) ---------- */

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function leerReferencia(raw: unknown): Referencia | null {
  const r = raw as Partial<Referencia> | null;
  if (!r || (r.categoria !== "abajo" && r.categoria !== "arriba")) return null;
  const plano: Referencia["plano"] = {};
  for (const m of MEDIDAS[r.categoria]) plano[m] = num((r.plano as Record<string, unknown> | undefined)?.[m]);
  const estira = r.estira === "si" || r.estira === "no" ? r.estira : "nose";
  return { categoria: r.categoria, nombre: limpio(r.nombre, LIM.texto), plano, estira };
}

export function leerCuerpo(raw: unknown, cat: Categoria): Cuerpo | null {
  const c = raw as Partial<Cuerpo> | null;
  if (!c || typeof c !== "object") return null;
  const medidas: Cuerpo["medidas"] = {};
  for (const m of MEDIDAS_CUERPO[cat]) medidas[m] = num((c.medidas as Record<string, unknown> | undefined)?.[m]);
  return { medidas };
}

export function leerTabla(raw: unknown): Tabla | null {
  const t = raw as Partial<Tabla> | null;
  if (!t || (t.categoria !== "abajo" && t.categoria !== "arriba") || !Array.isArray(t.filas)) return null;
  const cat = t.categoria;
  const filas: FilaTalla[] = t.filas.slice(0, LIM.filasMax + 1).map((f) => {
    const medidas: FilaTalla["medidas"] = {};
    for (const m of MEDIDAS[cat]) {
      const r = (f?.medidas as Record<string, unknown> | undefined)?.[m] as Partial<Rango> | null | undefined;
      const a = num(r?.min), b = num(r?.max);
      medidas[m] = a != null && b != null ? { min: a, max: b } : null;
    }
    return { talla: limpio(f?.talla, LIM.tallaLargo + 1), medidas };
  });
  return {
    tienda: limpio(t.tienda, LIM.texto),
    producto: limpio(t.producto, LIM.texto),
    categoria: cat,
    tipo: t.tipo === "prenda" || t.tipo === "cuerpo" ? t.tipo : "nodice",
    unidad: t.unidad === "in" ? "in" : "cm",
    plano: t.plano === true,
    filas,
    origen: t.origen === "gemini" || t.origen === "ejemplo" ? t.origen : "manual",
    numerosLeidos: Math.max(0, Math.min(500, Math.floor(num(t.numerosLeidos) ?? 0))),
    correcciones: Math.max(0, Math.min(500, Math.floor(num(t.correcciones) ?? 0))),
    revisada: t.revisada === true,
  };
}

/* ---------- Celdas de texto del editor: "82", "80-84", "80 a 84", vacío = falta ---------- */

export function rangoATexto(r: Rango | null | undefined): string {
  if (!r) return "";
  return r.min === r.max ? String(r.min) : `${r.min}-${r.max}`;
}

/** Devuelve el rango, null si está vacío, o "error" si no se entiende. */
export function textoARango(s: string): Rango | null | "error" {
  const t = s.trim();
  if (!t) return null;
  const m = /^(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:(?:-|–|a)\s*(\d{1,3}(?:[.,]\d{1,2})?))?$/.exec(t);
  if (!m) return "error";
  const a = Number(m[1].replace(",", ".")), b = m[2] ? Number(m[2].replace(",", ".")) : a;
  if (!(a > 0) || !(b > 0)) return "error";
  return { min: Math.min(a, b), max: Math.max(a, b) };
}
