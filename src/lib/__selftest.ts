/* Autoprueba del motor: npx tsx src/lib/__selftest.ts */
import {
  aCm, comparar, contarCambios, cuentaHonesta, explicacionPlantilla, referenciaEnCm, revisarExplicacion,
  revisarTexto, sanearLectura, validarReferencia, validarTabla, aEtiqueta, validarEtiqueta, codificar, decodificar,
  validarDevolucion, validarPago, leerTabla, leerReferencia,
} from "./motor";
import { REF_EJEMPLO, TABLA_EJEMPLO, ETIQUETAS_PUBLICAS } from "./ejemplo";
import type { Tabla, RegistroDecision } from "./tipos";

let ok = 0, mal = 0;
function prueba(nombre: string, cond: boolean) {
  if (cond) ok++;
  else { mal++; console.log("✗", nombre); }
}

const T = (p: Partial<Tabla> = {}): Tabla => ({ ...structuredClone(TABLA_EJEMPLO), revisada: true, ...p });

// Conversión
prueba("1 in = 2.54 cm → 32 in = 81.5", aCm(32, "in") === 81.5);
prueba("cm se queda", aCm(82, "cm") === 82);
prueba("ref a lo ancho se duplica", referenciaEnCm(REF_EJEMPLO).cintura === 82 && referenciaEnCm(REF_EJEMPLO).cadera === 100);
prueba("entrepierna no se duplica", referenciaEnCm(REF_EJEMPLO).entrepierna === 76);

// Validaciones
prueba("ref ejemplo válida", validarReferencia(REF_EJEMPLO).length === 0);
prueba("ref sin medidas no", validarReferencia({ ...REF_EJEMPLO, plano: { cintura: null, cadera: null, entrepierna: null } }).length > 0);
prueba("cintura 900 no", validarReferencia({ ...REF_EJEMPLO, plano: { cintura: 450 } }).length > 0);
prueba("nombre con teléfono no", validarReferencia({ ...REF_EJEMPLO, nombre: "pantalón 55 1234 5678" }).length > 0);
prueba("tabla ejemplo válida", validarTabla(T()).length === 0);
prueba("una sola talla no", validarTabla(T({ filas: T().filas.slice(0, 1) })).length > 0);
prueba("talla repetida no", validarTabla(T({ filas: [T().filas[0], T().filas[0]] })).length > 0);
prueba("min > max no", validarTabla(T({ filas: [{ talla: "A", medidas: { cintura: { min: 90, max: 80 } } }, T().filas[1]] })).length > 0);
prueba("revisarTexto correo", revisarTexto("escribe a ana@correo.com") === "un correo");
prueba("revisarTexto llave", revisarTexto("AIzaSyA1234567890abcdefghijk") !== null);
prueba("revisarTexto limpio", revisarTexto("Jeans corte recto") === null);

// Comparación
const r = comparar(REF_EJEMPLO, null, T());
prueba("ok", r.ok);
prueba("la 32 es la más parecida", r.masParecida === "32");
prueba("32: cintura +1", r.tallas.find((t) => t.talla === "32")!.celdas.find((c) => c.medida === "cintura")!.dif === 1);
prueba("32: cadera 0", r.tallas.find((t) => t.talla === "32")!.celdas.find((c) => c.medida === "cadera")!.dif === 0);
prueba("entrepierna falta de la tienda", r.faltan.some((f) => f.medida === "entrepierna" && f.de === "tienda"));
prueba("solo 2 comparables", r.medidasComparables.length === 2);
prueba("aviso de parte interesada siempre", r.avisos[0].includes("parte interesada"));
prueba("sin revisar no compara", !comparar(REF_EJEMPLO, null, { ...T(), revisada: false }).ok);
prueba("tabla 'nodice' no compara", !comparar(REF_EJEMPLO, null, T({ tipo: "nodice" })).ok);
const rc = comparar(REF_EJEMPLO, null, T({ tipo: "cuerpo" }));
prueba("tabla de cuerpo sin cuerpo no compara", !rc.ok && /CUERPO/.test(rc.motivo!));
const rc2 = comparar(REF_EJEMPLO, { medidas: { cintura: 80, cadera: 99 } }, T({ tipo: "cuerpo" }));
prueba("cuerpo vs cuerpo sí compara", rc2.ok && rc2.base === "cuerpo");
prueba("categoría distinta no", !comparar({ ...REF_EJEMPLO, categoria: "arriba", plano: { pecho: 50 } }, null, T()).ok);
const r1 = comparar({ ...REF_EJEMPLO, plano: { cintura: 41, cadera: null, entrepierna: null } }, null, T());
prueba("1 medida: no hay más parecida", r1.ok && r1.masParecida === null && /Solo hay 1/.test(r1.motivo!));
const rango = T({ filas: [{ talla: "M", medidas: { cintura: { min: 80, max: 84 }, cadera: { min: 98, max: 102 } } }, { talla: "L", medidas: { cintura: { min: 86, max: 90 }, cadera: { min: 104, max: 108 } } }] });
const rr = comparar(REF_EJEMPLO, null, rango);
prueba("dentro del rango = 0", rr.tallas[0].celdas.find((c) => c.medida === "cintura")!.dif === 0);
prueba("rango: M gana", rr.masParecida === "M");
const emp = T({ filas: [{ talla: "A", medidas: { cintura: { min: 81, max: 81 }, cadera: { min: 100, max: 100 } } }, { talla: "B", medidas: { cintura: { min: 83, max: 83 }, cadera: { min: 100, max: 100 } } }] });
const re = comparar(REF_EJEMPLO, null, emp);
prueba("empate dentro de 1 cm", re.masParecida === null && re.empate.length === 2);
const lejos = T({ filas: [{ talla: "XS", medidas: { cintura: { min: 60, max: 60 }, cadera: { min: 80, max: 80 } } }, { talla: "S", medidas: { cintura: { min: 64, max: 64 }, cadera: { min: 84, max: 84 } } }] });
prueba("ninguna se parece: aviso de no comprar", comparar(REF_EJEMPLO, null, lejos).avisos.some((a) => a.includes("No comprar")));
const pulg = T({ unidad: "in", filas: [{ talla: "32", medidas: { cintura: { min: 32.5, max: 32.5 }, cadera: { min: 39.5, max: 39.5 } } }, { talla: "34", medidas: { cintura: { min: 34.5, max: 34.5 }, cadera: { min: 41.5, max: 41.5 } } }] });
const rp = comparar(REF_EJEMPLO, null, pulg);
prueba("pulgadas: 32.5 in = 82.5 cm", rp.tallas[0].celdas[0].tienda!.min === 82.5);
prueba("pulgadas: aviso", rp.avisos.some((a) => a.includes("pulgadas")));
const plano = T({ plano: true, filas: [{ talla: "S", medidas: { cintura: { min: 39, max: 39 }, cadera: { min: 48, max: 48 } } }, { talla: "M", medidas: { cintura: { min: 41, max: 41 }, cadera: { min: 50, max: 50 } } }] });
const rpl = comparar(REF_EJEMPLO, null, plano);
prueba("tabla a lo ancho se duplica", rpl.masParecida === "M" && rpl.tallas[1].celdas[0].dif === 0);
prueba("estira 'no sé': aviso", comparar({ ...REF_EJEMPLO, estira: "nose" }, null, T()).avisos.some((a) => a.includes("estira")));

// Lectura de la IA
const lectura = sanearLectura({ legible: true, tipo: "prenda", unidad: "in", plano: false, filas: [
  { talla: "30", medidas: { cintura: [31, 31], cadera: [38, 38], entrepierna: [30, 30] } },
  { talla: "32", medidas: { cintura: [33], cadera: 39.5, entrepierna: null, muslo: [12, 12] } },
  { talla: "32", medidas: { cintura: [1, 1] } },
  { talla: "34", medidas: { cintura: [900, 900], cadera: [41.5, 41.5] } },
], notas: "ok" }, "abajo");
prueba("lectura: 3 tallas únicas", lectura.tabla?.filas.length === 3);
prueba("lectura: número solo → [n,n]", lectura.tabla?.filas[1].medidas.cadera?.min === 39.5);
prueba("lectura: [33] → rango 33", lectura.tabla?.filas[1].medidas.cintura?.max === 33);
prueba("lectura: medida ajena ignorada", !("muslo" in (lectura.tabla?.filas[1].medidas ?? {})));
prueba("lectura: valor imposible se descarta", lectura.tabla?.filas[2].medidas.cintura === null);
prueba("lectura: cuenta números", lectura.tabla?.numerosLeidos === 6);
prueba("ilegible", sanearLectura({ legible: false }, "abajo").tabla === null);
prueba("basura", sanearLectura("hola", "abajo").tabla === null);
prueba("tipo desconocido → nodice", sanearLectura({ tipo: "x", filas: [{ talla: "S", medidas: { cintura: [70, 70] } }, { talla: "M", medidas: { cintura: [75, 75] } }] }, "abajo").tabla?.tipo === "nodice");
prueba("cambios: 0", contarCambios(T().filas, T().filas) === 0);
const editada = structuredClone(T().filas); editada[2].medidas.cintura = { min: 84, max: 84 }; editada[0].medidas.entrepierna = { min: 75, max: 75 };
prueba("cambios: 2", contarCambios(T().filas, editada) === 2);

// Texto de la IA
const bueno = "En números, la 32 es la que más se parece a tu pantalón: cintura +1 cm y cadera igual. La tienda no da la entrepierna. Esto no garantiza cómo te va a quedar.";
prueba("explicación buena pasa", revisarExplicacion(bueno, r).ok);
prueba("'te queda perfecto' no pasa", !revisarExplicacion("La 32 te queda perfecto, cómprala ya.", r).ok);
prueba("número inventado no pasa", !revisarExplicacion("La 32 tiene 87 cm de cintura y se parece más.", r).ok);
prueba("enlace no pasa", !revisarExplicacion("La 32 se parece más, mira https://tienda.com para más.", r).ok);
prueba("'no sabemos si te queda' pasa", revisarExplicacion("La 32 se parece más en números, pero no sabemos si te queda por el largo.", r).ok);
prueba("plantilla pasa su propio filtro", revisarExplicacion(explicacionPlantilla(r, REF_EJEMPLO.nombre), r).ok);
prueba("plantilla empate pasa", revisarExplicacion(explicacionPlantilla(re, "pantalón"), re).ok);
prueba("plantilla menciona la falta", explicacionPlantilla(r, "pantalón").includes("largo interior"));

// Pausa
prueba("devolución sin fuente no", validarDevolucion({ texto: "30 días", fuente: "", noEncontre: false, costo: "nodice", consultada: "2026-10-16" }).length > 0);
prueba("'no la encontré' pasa", validarDevolucion({ texto: "", fuente: "", noEncontre: true, costo: "nodice", consultada: "2026-10-16" }).length === 0);
prueba("meses sin precio no", validarPago(null, 6).length > 0);
prueba("meses 60 no", validarPago(1000, 60).length > 0);
prueba("pago ok", validarPago(899, 3).length === 0);
const regs = [
  { decision: "compro", desenlace: "quedo" }, { decision: "no-compro", desenlace: null }, { decision: "otra", desenlace: null }, { decision: "compro", desenlace: "chica" },
] as RegistroDecision[];
const c = cuentaHonesta(regs);
prueba("cuenta: 4 / 1 no compro / 3 compraron / 2 con desenlace / 1 quedó", c.total === 4 && c.noCompro === 1 && c.compraron === 3 && c.conDesenlace === 2 && c.quedo === 1);

// Etiqueta
const et = aEtiqueta(T(), "2026-10-16");
prueba("etiqueta válida", validarEtiqueta(et).length === 0);
prueba("etiqueta ejemplo es ILUSTRATIVO", et.estado === "ILUSTRATIVO");
prueba("etiqueta gemini es APORTADA", aEtiqueta(T({ origen: "gemini" }), "2026-10-16").estado === "APORTADA");
prueba("etiqueta en pulgadas sale en cm", aEtiqueta(pulg, "x").tallas[0].medidas_cm.cintura![0] === 82.5);
prueba("etiqueta nodice no existe", (() => { try { aEtiqueta(T({ tipo: "nodice" }), "x"); return false; } catch { return true; } })());
prueba("etiqueta no lleva datos de la persona", !JSON.stringify(et).includes("Pantalón azul"));
prueba("etiquetas públicas válidas", ETIQUETAS_PUBLICAS.every((e) => validarEtiqueta(e).length === 0));
prueba("etiqueta rota no", validarEtiqueta({ ...et, tallas: [{ talla: "M", medidas_cm: { cintura: [900, 900] } }] }).length > 0);
prueba("ida y vuelta base64url con acentos", JSON.stringify(decodificar(codificar(et))) === JSON.stringify(et));
prueba("decodificar basura → null", decodificar("%%%") === null);

// Lectura desde el navegador
prueba("leerTabla basura → null", leerTabla({ foo: 1 }) === null);
prueba("leerTabla limpia tipos", leerTabla({ ...T(), tipo: "raro", unidad: "km", revisada: "sí" })!.tipo === "nodice");
prueba("leerTabla revisada solo true", leerTabla({ ...T(), revisada: "sí" })!.revisada === false);
prueba("leerReferencia ignora strings", leerReferencia({ ...REF_EJEMPLO, plano: { cintura: "41" } })!.plano.cintura === null);

console.log(`${ok} bien, ${mal} mal`);
if (mal) process.exit(1);
import { textoARango, rangoATexto } from "./motor";
const tr = (s: string) => JSON.stringify(textoARango(s));
let ok2 = 0;
const p2 = (n: string, c: boolean) => { if (c) ok2++; else { console.log("✗", n); process.exitCode = 1; } };
p2("celda '82'", tr("82") === JSON.stringify({ min: 82, max: 82 }));
p2("celda '80-84'", tr("80-84") === JSON.stringify({ min: 80, max: 84 }));
p2("celda '80 a 84'", tr("80 a 84") === JSON.stringify({ min: 80, max: 84 }));
p2("celda '32,5'", tr("32,5") === JSON.stringify({ min: 32.5, max: 32.5 }));
p2("celda vacía", textoARango("  ") === null);
p2("celda 'M'", textoARango("M") === "error");
p2("celda ida y vuelta", rangoATexto({ min: 80, max: 84 }) === "80-84");
import { nombrePrenda } from "./motor";
p2("'mi pantalón' → 'pantalón'", nombrePrenda("mi pantalón") === "pantalón");
p2("'Pantalón azul' → 'pantalón azul'", nombrePrenda("Pantalón azul") === "pantalón azul");
p2("siglas se respetan", nombrePrenda("JEANS") === "JEANS");
p2("plantilla no dice 'tu mi'", !explicacionPlantilla(r, "mi pantalón").includes("tu mi"));
console.log(`${ok2} bien (celdas y nombres)`);
