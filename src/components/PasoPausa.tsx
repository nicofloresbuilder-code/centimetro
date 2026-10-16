"use client";
import { useState } from "react";
import type { Decision, Devolucion, RegistroDecision, Resultado, Tabla } from "@/lib/tipos";
import { LIM, limpio, validarDevolucion, validarPago } from "@/lib/motor";
import { hoy } from "@/lib/navegador";

type Props = {
  tabla: Tabla;
  resultado: Resultado;
  inicial: Decision | null;
  onGuardar: (r: RegistroDecision) => void;
  onAtras: () => void;
};

const pesos = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export function PasoPausa({ tabla, resultado, inicial, onGuardar, onAtras }: Props) {
  const tallas = tabla.filas.map((f) => f.talla);
  const [precio, setPrecio] = useState("");
  const [meses, setMeses] = useState("1");
  const [dev, setDev] = useState<Devolucion>({ texto: "", fuente: "", noEncontre: false, costo: "nodice", consultada: hoy() });
  const [decision, setDecision] = useState<Decision | null>(inicial);
  const [talla, setTalla] = useState<string>(resultado.masParecida ?? tallas[0] ?? "");
  const [otra, setOtra] = useState<string>(tallas.find((t) => t !== resultado.masParecida) ?? tallas[0] ?? "");
  const [errores, setErrores] = useState<string[]>([]);

  const p = precio.trim() ? Number(precio.replace(/[$,\s]/g, "")) : null;
  const m = Number(meses) || 1;
  const porMes = p && m > 1 ? Math.ceil(p / m) : null;

  const guardar = (saltar = false) => {
    if (!decision) { setErrores(["Elige qué decides. \"No compro\" y \"Lo pienso\" también cuentan."]); return; }
    const d: Devolucion = saltar ? { texto: "", fuente: "", noEncontre: false, costo: "nodice", consultada: hoy() } : { ...dev, texto: limpio(dev.texto, LIM.devolucion), fuente: limpio(dev.fuente, LIM.fuente) };
    const e = saltar ? [] : [...validarDevolucion(d), ...validarPago(p, m > 1 ? m : null)];
    setErrores(e);
    if (e.length) return;
    onGuardar({
      id: Math.random().toString(36).slice(2, 10),
      fecha: hoy(),
      producto: tabla.producto,
      tienda: tabla.tienda,
      masParecida: resultado.masParecida,
      decision,
      talla: decision === "compro" ? talla : decision === "otra" ? otra : null,
      precio: saltar ? null : p,
      meses: saltar || m <= 1 ? null : m,
      devolucion: d,
      desenlace: null,
    });
  };

  return (
    <section className="panel" aria-labelledby="t-pausa">
      <h2 id="t-pausa">4 · Pausa antes de comprar</h2>
      <p className="sub">Antes de decidir, dos cosas que la tabla no dice: cuánto te cuesta y qué pasa si no te queda. Todo es opcional. Puedes saltar esta pausa cuando quieras.</p>

      <h3>¿Cuánto cuesta?</h3>
      <div className="fila" style={{ alignItems: "flex-end" }}>
        <div className="campo" style={{ flex: "1 1 160px" }}>
          <label htmlFor="precio">Precio (MXN)</label>
          <input id="precio" type="number" inputMode="decimal" min={1} max={LIM.precioMax} value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
        <div className="campo" style={{ flex: "1 1 160px" }}>
          <label htmlFor="meses">¿En cuántos pagos?</label>
          <select id="meses" value={meses} onChange={(e) => setMeses(e.target.value)}>
            {[1, 3, 6, 9, 12, 18, 24].map((n) => <option key={n} value={n}>{n === 1 ? "De contado" : `${n} pagos`}</option>)}
          </select>
        </div>
      </div>
      {porMes && (
        <p className="aviso amarillo">
          Son unos <b>{pesos(porMes)} durante {m} pagos</b> (sin contar intereses, si los hay). Es un compromiso nuevo que se suma a los que ya tienes.
        </p>
      )}

      <h3>¿Qué pasa si no te queda?</h3>
      <p className="ayuda">Copia la política de devolución de la tienda y di de dónde la sacaste. Va aparte de las medidas: es otra fuente y también es de la tienda.</p>
      <div className="campo">
        <label htmlFor="dev">Política de devolución (texto)</label>
        <textarea id="dev" maxLength={LIM.devolucion} disabled={dev.noEncontre} placeholder="Ej. Tienes 30 días para devolver. El envío de regreso lo pagas tú." value={dev.texto} onChange={(e) => setDev({ ...dev, texto: e.target.value })} />
      </div>
      <div className="campo">
        <label htmlFor="fuente">¿De dónde salió?</label>
        <input id="fuente" type="text" maxLength={LIM.fuente} disabled={dev.noEncontre} placeholder="Ej. página de devoluciones de la tienda" value={dev.fuente} onChange={(e) => setDev({ ...dev, fuente: e.target.value })} />
        <p className="ayuda">Consultada el {dev.consultada}.</p>
      </div>
      <label className="check">
        <input type="checkbox" checked={dev.noEncontre} onChange={(e) => setDev({ ...dev, noEncontre: e.target.checked, texto: "", fuente: "" })} />
        No la encontré
      </label>
      <div className="campo" style={{ marginTop: 10 }}>
        <span className="etq">¿Devolver te cuesta?</span>
        <div className="opciones" role="group" aria-label="¿Devolver cuesta?">
          {(["si", "no", "nodice"] as const).map((c) => (
            <button key={c} type="button" className="opcion" aria-pressed={dev.costo === c} onClick={() => setDev({ ...dev, costo: c })}>
              {c === "si" ? "Sí cuesta" : c === "no" ? "Es gratis" : "No lo dice"}
            </button>
          ))}
        </div>
      </div>
      {dev.noEncontre && <p className="aviso gis">Sin política de devolución a la vista, si no te queda, no sabes qué pasa. Tómalo en cuenta.</p>}

      <h3>Tu decisión</h3>
      <div role="radiogroup" aria-label="Decisión" style={{ display: "grid", gap: 8 }}>
        <label className="check">
          <input type="radio" name="dec" checked={decision === "compro"} onChange={() => setDecision("compro")} />
          <span>
            Compro la talla{" "}
            <select aria-label="Talla que compro" value={talla} onChange={(e) => { setTalla(e.target.value); setDecision("compro"); }} style={{ width: "auto", padding: "2px 6px" }}>
              {tallas.map((t) => <option key={t}>{t}</option>)}
            </select>
            {resultado.masParecida && <span className="chico"> (la más parecida en números es {resultado.masParecida})</span>}
          </span>
        </label>
        <label className="check">
          <input type="radio" name="dec" checked={decision === "otra"} onChange={() => setDecision("otra")} />
          <span>
            Compro otra talla por otra razón:{" "}
            <select aria-label="Otra talla" value={otra} onChange={(e) => { setOtra(e.target.value); setDecision("otra"); }} style={{ width: "auto", padding: "2px 6px" }}>
              {tallas.map((t) => <option key={t}>{t}</option>)}
            </select>
          </span>
        </label>
        <label className="check"><input type="radio" name="dec" checked={decision === "no-compro"} onChange={() => setDecision("no-compro")} /> No compro</label>
        <label className="check"><input type="radio" name="dec" checked={decision === "lo-pienso"} onChange={() => setDecision("lo-pienso")} /> Lo pienso</label>
      </div>

      {errores.length > 0 && <div className="errores" role="alert"><ul>{errores.map((e) => <li key={e}>{e}</li>)}</ul></div>}

      <div className="acciones">
        <button type="button" className="btn prim" onClick={() => guardar(false)}>Guardar mi decisión</button>
        <button type="button" className="btn" onClick={() => guardar(true)}>Saltar la pausa y guardar solo la decisión</button>
        <button type="button" className="btn" onClick={onAtras}>Volver a la comparación</button>
      </div>
      <p className="chico" style={{ marginTop: 8 }}>Tu decisión se guarda solo en este navegador. Nadie más la ve.</p>
    </section>
  );
}
