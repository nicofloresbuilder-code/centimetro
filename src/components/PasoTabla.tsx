"use client";
import { useRef, useState } from "react";
import { MEDIDAS, NOMBRE, type Categoria, type FilaTalla, type Medida, type Origen, type Tabla, type TipoTabla, type Unidad } from "@/lib/tipos";
import { contarCambios, contarNumeros, rangoATexto, textoARango, validarTabla } from "@/lib/motor";
import { TABLA_EJEMPLO } from "@/lib/ejemplo";
import { prepararImagen } from "@/lib/navegador";

type Props = {
  categoria: Categoria;
  tabla: Tabla | null;
  setTabla: (t: Tabla | null) => void;
  permiso: boolean;
  setPermiso: (b: boolean) => void;
  ia: "gemini" | "simulado" | "?";
  onSeguir: () => void;
  onAtras: () => void;
};

type FilaTexto = { talla: string; valores: Partial<Record<Medida, string>> };

const aTexto = (filas: FilaTalla[]): FilaTexto[] =>
  filas.map((f) => ({ talla: f.talla, valores: Object.fromEntries(Object.entries(f.medidas).map(([m, r]) => [m, rangoATexto(r)])) }));

const vacia = (cat: Categoria): FilaTexto[] => ["S", "M", "L"].map((t) => ({ talla: t, valores: Object.fromEntries(MEDIDAS[cat].map((m) => [m, ""])) }));

export function PasoTabla({ categoria, tabla, setTabla, permiso, setPermiso, ia, onSeguir, onAtras }: Props) {
  const usable = tabla && tabla.categoria === categoria ? tabla : null;
  const [tienda, setTienda] = useState(usable?.tienda ?? "");
  const [producto, setProducto] = useState(usable?.producto ?? "");
  const [tipo, setTipo] = useState<TipoTabla>(usable?.tipo ?? "nodice");
  const [unidad, setUnidad] = useState<Unidad>(usable?.unidad ?? "cm");
  const [plano, setPlano] = useState(usable?.plano ?? false);
  const [filas, setFilas] = useState<FilaTexto[] | null>(usable ? aTexto(usable.filas) : null);
  const [origen, setOrigen] = useState<Origen>(usable?.origen ?? "manual");
  const [leidas, setLeidas] = useState<FilaTalla[] | null>(usable?.origen === "gemini" ? usable.leidas ?? null : null);
  const [revisada, setRevisada] = useState(false);
  const [imagen, setImagen] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [notas, setNotas] = useState<string | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const archivo = useRef<HTMLInputElement>(null);

  const medidas = MEDIDAS[categoria];

  const aFilas = (ft: FilaTexto[]): { filas: FilaTalla[]; malas: string[] } => {
    const malas: string[] = [];
    const out = ft.map((f) => {
      const m: FilaTalla["medidas"] = {};
      for (const k of medidas) {
        const r = textoARango(f.valores[k] ?? "");
        if (r === "error") { malas.push(`${f.talla || "?"} · ${NOMBRE[k]}: "${f.valores[k]}" no es un número (usa 82 o 80-84).`); m[k] = null; }
        else m[k] = r;
      }
      return { talla: f.talla.trim(), medidas: m };
    });
    return { filas: out, malas };
  };

  const actual = filas ? aFilas(filas) : null;
  const cambios = leidas && actual ? contarCambios(leidas, actual.filas) : 0;

  const cargarLectura = (t: Omit<Tabla, "tienda" | "producto" | "origen" | "correcciones" | "revisada">, org: Origen) => {
    setTipo(t.tipo); setUnidad(t.unidad); setPlano(t.plano); setFilas(aTexto(t.filas)); setOrigen(org);
    setLeidas(org === "gemini" ? structuredClone(t.filas) : null);
    setRevisada(false);
    setAviso(null);
  };

  const leer = async (dataUrl: string) => {
    setAviso(null); setNotas(null); setErrores([]);
    if (!permiso) { setAviso("Para leer la captura con IA, primero marca el permiso. O escribe la tabla a mano."); return; }
    setLeyendo(true);
    try {
      const r = await fetch("/api/leer-tabla", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imagen: dataUrl, categoria, permiso: true }) });
      const j = await r.json();
      if (j.simulado) { setAviso(j.error); return; }
      if (!r.ok || !j.tabla) { setAviso(j.error ?? "No se pudo leer."); return; }
      cargarLectura(j.tabla, "gemini");
      setNotas(j.notas || null);
    } catch {
      setAviso("No hubo conexión. Escribe la tabla a mano.");
    } finally {
      setLeyendo(false);
    }
  };

  const elegirArchivo = async (f: File | undefined) => {
    if (!f) return;
    setAviso(null);
    try {
      const d = await prepararImagen(f);
      setImagen(d);
    } catch (e) {
      setAviso((e as Error).message);
    }
  };

  const probarCaptura = async () => {
    setAviso(null);
    try {
      const b = await (await fetch("/ejemplo-captura.png")).blob();
      const d = await prepararImagen(b);
      setImagen(d);
      if (!tienda) setTienda("Tienda Ejemplo (inventada)");
      if (!producto) setProducto("Jeans slim");
      if (permiso) await leer(d);
    } catch (e) {
      setAviso((e as Error).message);
    }
  };

  const confirmar = () => {
    if (!actual) return;
    const t: Tabla = {
      tienda, producto, categoria, tipo, unidad, plano: tipo === "prenda" && plano, filas: actual.filas, origen,
      numerosLeidos: leidas ? contarNumeros(leidas) : 0, correcciones: cambios, revisada: true,
    };
    const e = [...actual.malas, ...validarTabla(t)];
    if (!revisada) e.unshift("Marca que revisaste cada número contra la tabla original.");
    setErrores(e);
    if (e.length) return;
    setTabla({ ...t, leidas });
    onSeguir();
  };

  const editar = (i: number, k: Medida | "talla", v: string) => {
    if (!filas) return;
    const n = structuredClone(filas);
    if (k === "talla") n[i].talla = v.slice(0, 8);
    else n[i].valores[k] = v.slice(0, 11);
    setFilas(n);
    setRevisada(false);
  };

  const cambiada = (i: number, k: Medida) => {
    if (!leidas || !actual) return false;
    const a = leidas.find((f) => f.talla.toUpperCase() === actual.filas[i]?.talla.toUpperCase());
    return rangoATexto(a?.medidas[k] ?? null) !== (filas?.[i].valores[k] ?? "").trim();
  };

  return (
    <section className="panel" aria-labelledby="t-tabla">
      <h2 id="t-tabla">2 · La tabla de tallas de la tienda</h2>
      <p className="sub">Toma captura de la tabla de tallas del producto. La IA la lee y <b>tú revisas cada número</b>. Si prefieres, cópiala a mano.</p>

      <div className="fila" style={{ alignItems: "flex-start" }}>
        <div className="campo" style={{ flex: "1 1 220px" }}>
          <label htmlFor="producto">¿Qué prenda es?</label>
          <input id="producto" type="text" maxLength={80} placeholder="Ej. jeans corte recto" value={producto} onChange={(e) => setProducto(e.target.value)} />
        </div>
        <div className="campo" style={{ flex: "1 1 220px" }}>
          <label htmlFor="tienda">¿De qué tienda o marca?</label>
          <input id="tienda" type="text" maxLength={80} placeholder="Ej. la tienda en línea" value={tienda} onChange={(e) => setTienda(e.target.value)} />
        </div>
      </div>

      <div className="aviso amarillo">
        <label className="check">
          <input type="checkbox" checked={permiso} onChange={(e) => setPermiso(e.target.checked)} />
          <span>
            <b>Usar IA (Gemini) para leer la captura y explicar el resultado.</b> La captura se manda a Google solo para leerla y aquí no se guarda. Sin permiso, nada sale de tu navegador: copias la tabla a mano y la explicación sale de una plantilla.
          </span>
        </label>
        {ia === "simulado" && <p className="chico" style={{ margin: "6px 0 0" }}>Ojo: en este servidor la IA no está configurada. Puedes copiar la tabla a mano o usar la tabla de ejemplo.</p>}
      </div>

      <div className="acciones">
        <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => elegirArchivo(e.target.files?.[0])} />
        <button type="button" className="btn cinta-btn" onClick={() => archivo.current?.click()}>Subir captura</button>
        <button type="button" className="btn" onClick={probarCaptura}>Probar con una captura de ejemplo</button>
        <button type="button" className="btn" onClick={() => { cargarLectura({ ...vaciaTabla(categoria) }, "manual"); }}>Escribir a mano</button>
        {categoria === "abajo" && (
          <button type="button" className="btn" onClick={() => { setTienda(TABLA_EJEMPLO.tienda); setProducto(TABLA_EJEMPLO.producto); cargarLectura(structuredClone(TABLA_EJEMPLO), "ejemplo"); }}>
            Tabla de ejemplo (sin IA)
          </button>
        )}
      </div>

      {imagen && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="vista-previa" src={imagen} alt="Tu captura de la tabla de tallas" />
          <button type="button" className="btn prim" disabled={leyendo} onClick={() => leer(imagen)}>
            {leyendo ? "Leyendo la tabla…" : "Leer con IA"}
          </button>
        </div>
      )}
      {aviso && <div className="aviso gis" role="status">{aviso}</div>}

      {filas && (
        <>
          <h3>Revisa la tabla</h3>
          {origen === "gemini" && (
            <p className="aviso amarillo" role="status">
              La IA leyó <b>{leidas ? contarNumeros(leidas) : 0} números</b>. Llevas <b>{cambios}</b> {cambios === 1 ? "corrección" : "correcciones"}. Las celdas que cambiaste se marcan en amarillo.{notas ? ` Nota de la IA: ${notas}` : ""}
            </p>
          )}
          {origen === "ejemplo" && <p className="aviso">Tabla de una tienda <b>inventada</b> para probar.</p>}

          <div className="campo">
            <span className="etq">¿Estas medidas son de la prenda o del cuerpo?</span>
            <p className="ayuda">Busca en la tabla algo como &ldquo;medidas de la prenda&rdquo; o &ldquo;medidas del cuerpo / cómo medirte&rdquo;. Si no lo dice, elige &ldquo;No lo dice&rdquo;: no adivinamos.</p>
            <div className="opciones" role="group" aria-label="Tipo de medidas">
              {(["prenda", "cuerpo", "nodice"] as const).map((t) => (
                <button key={t} type="button" className="opcion" aria-pressed={tipo === t} onClick={() => { setTipo(t); setRevisada(false); }}>
                  {t === "prenda" ? "De la prenda" : t === "cuerpo" ? "Del cuerpo" : "No lo dice"}
                </button>
              ))}
            </div>
          </div>

          <div className="fila" style={{ marginBottom: 8 }}>
            <span className="etq" style={{ margin: 0 }}>Unidad:</span>
            <div className="opciones" role="group" aria-label="Unidad">
              <button type="button" className="opcion" aria-pressed={unidad === "cm"} onClick={() => { setUnidad("cm"); setRevisada(false); }}>cm</button>
              <button type="button" className="opcion" aria-pressed={unidad === "in"} onClick={() => { setUnidad("in"); setRevisada(false); }}>pulgadas</button>
            </div>
            {tipo === "prenda" && (
              <label className="check">
                <input type="checkbox" checked={plano} onChange={(e) => { setPlano(e.target.checked); setRevisada(false); }} />
                Los contornos vienen a lo ancho (prenda acostada)
              </label>
            )}
          </div>

          <div className="rejilla-envoltura">
            <table className="rejilla">
              <thead>
                <tr>
                  <th scope="col">Talla</th>
                  {medidas.map((m) => <th key={m} scope="col">{NOMBRE[m]}</th>)}
                  <th scope="col"><span className="chico">quitar</span></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i}>
                    <td className="talla">
                      <input aria-label={`Talla fila ${i + 1}`} value={f.talla} onChange={(e) => editar(i, "talla", e.target.value)} />
                    </td>
                    {medidas.map((m) => (
                      <td key={m}>
                        <input
                          aria-label={`${NOMBRE[m]}, talla ${f.talla || i + 1}`}
                          className={cambiada(i, m) ? "cambiado" : undefined}
                          inputMode="decimal"
                          placeholder="—"
                          value={f.valores[m] ?? ""}
                          onChange={(e) => editar(i, m, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button type="button" className="btn chico-btn" aria-label={`Quitar talla ${f.talla}`} onClick={() => { setFilas(filas.filter((_, j) => j !== i)); setRevisada(false); }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ayuda">Escribe un número (82) o un rango (80-84). Vacío = la tienda no lo da.</p>
          <button type="button" className="btn chico-btn" disabled={filas.length >= 12} onClick={() => setFilas([...filas, { talla: "", valores: {} }])}>+ Agregar talla</button>

          <label className="check" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={revisada} onChange={(e) => setRevisada(e.target.checked)} />
            <span><b>Revisé cada número contra la tabla original.</b> Lo que no aparece, lo dejé vacío.</span>
          </label>

          {errores.length > 0 && (
            <div className="errores" role="alert"><ul>{errores.map((e) => <li key={e}>{e}</li>)}</ul></div>
          )}
          <div className="acciones">
            <button type="button" className="btn prim" onClick={confirmar}>Confirmar y comparar</button>
            <button type="button" className="btn" onClick={onAtras}>Volver a mi prenda</button>
          </div>
        </>
      )}
    </section>
  );
}

function vaciaTabla(cat: Categoria) {
  const filas: FilaTalla[] = vacia(cat).map((f) => ({ talla: f.talla, medidas: {} }));
  return { categoria: cat, tipo: "nodice" as TipoTabla, unidad: "cm" as Unidad, plano: false, filas, numerosLeidos: 0 };
}
