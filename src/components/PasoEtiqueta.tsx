"use client";
import { useState } from "react";
import Link from "next/link";
import type { Desenlace, RegistroDecision, Tabla } from "@/lib/tipos";
import { aEtiqueta, codificar, cuentaHonesta } from "@/lib/motor";
import { hoy } from "@/lib/navegador";
import { VistaEtiqueta } from "./Etiqueta";

type Props = {
  tabla: Tabla | null;
  decisiones: RegistroDecision[];
  setDecisiones: (d: RegistroDecision[]) => void;
  ultima: string | null;
  onNueva: () => void;
};

const DECISION: Record<RegistroDecision["decision"], string> = { compro: "Compré", otra: "Compré otra talla", "no-compro": "No compré", "lo-pienso": "Lo estoy pensando" };
const DESENLACE: Record<Desenlace, string> = { quedo: "Me quedó", grande: "Me quedó grande", chica: "Me quedó chica", devolvi: "La devolví", "no-llego": "No ha llegado" };

export function PasoEtiqueta({ tabla, decisiones, setDecisiones, ultima, onNueva }: Props) {
  const [copiado, setCopiado] = useState(false);
  const etiqueta = tabla && tabla.revisada && tabla.tipo !== "nodice" ? aEtiqueta(tabla, hoy()) : null;
  const enlace = etiqueta && typeof window !== "undefined" ? `${window.location.origin}/etiqueta#${codificar(etiqueta)}` : null;
  const c = cuentaHonesta(decisiones);
  const reciente = decisiones.find((d) => d.id === ultima);

  const descargar = () => {
    if (!etiqueta) return;
    const b = new Blob([JSON.stringify(etiqueta, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `etiqueta-cm-${etiqueta.producto.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const copiar = async () => {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  };

  const ponerDesenlace = (id: string, v: string) =>
    setDecisiones(decisiones.map((d) => (d.id === id ? { ...d, desenlace: (v || null) as Desenlace | null } : d)));

  return (
    <>
      <section className="panel" aria-labelledby="t-etq">
        <h2 id="t-etq">5 · La etiqueta en cm</h2>
        {reciente && (
          <p className="aviso ok" role="status">
            Guardado: <b>{DECISION[reciente.decision]}{reciente.talla ? ` talla ${reciente.talla}` : ""}</b> · {reciente.producto}.
          </p>
        )}
        <p className="sub">
          Así se vería la tabla si la ley pidiera centímetros en la etiqueta y en la ficha en línea, en un formato que cualquier persona o agente puede leer. Aquí no va <b>nada tuyo</b>: solo las medidas de la prenda y de dónde salieron.
        </p>
        {etiqueta ? (
          <>
            <VistaEtiqueta e={etiqueta} />
            <div className="acciones">
              <button type="button" className="btn prim" onClick={descargar}>Descargar como archivo (JSON)</button>
              <button type="button" className="btn" onClick={copiar}>{copiado ? "Enlace copiado ✓" : "Copiar enlace para compartir"}</button>
              <a className="btn" href="/api/etiquetas" target="_blank" rel="noreferrer">Ver el formato público</a>
            </div>
            <p className="chico" style={{ marginTop: 8 }}>
              El enlace lleva la etiqueta después del &ldquo;#&rdquo;: el navegador no lo manda al servidor y aquí no se guarda. Es un prototipo de la regla, no una norma vigente. <Link href="/regla">Ver la propuesta</Link>.
            </p>
          </>
        ) : (
          <p className="aviso gis">
            Esta tabla no dice si sus medidas son de la prenda o del cuerpo, así que no se puede hacer una etiqueta honesta. Ese es justo el hueco que la regla cerraría.
          </p>
        )}
        <div className="acciones">
          <button type="button" className="btn" onClick={onNueva}>Comparar otra prenda</button>
        </div>
      </section>

      <section className="panel" aria-labelledby="t-dec">
        <h2 id="t-dec">Mis decisiones</h2>
        <p className="sub">Cuando llegue lo que compraste, anota cómo te quedó. Así sabrás si comparar en cm te sirve. Solo vive en este navegador.</p>
        <p className="cuenta">
          Decisiones guardadas: {c.total}
          <br />
          No compré: {c.noCompro} de {c.total} · Compré: {c.compraron} de {c.total}
          <br />
          Ya sé cómo quedó: {c.conDesenlace} de {c.compraron} compras
          <br />
          Me quedó bien: {c.quedo} de {c.conDesenlace}
        </p>
        {decisiones.length === 0 && <p className="chico">Todavía no hay decisiones guardadas.</p>}
        {decisiones.map((d) => (
          <div className="decision" key={d.id}>
            <div>
              <b>{DECISION[d.decision]}{d.talla ? ` talla ${d.talla}` : ""}</b> · {d.producto} <span className="chico">({d.tienda}, {d.fecha})</span>
              <div className="chico">
                Más parecida en números: {d.masParecida ?? "ninguna clara"}
                {d.precio ? ` · ${d.precio.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })}${d.meses ? ` en ${d.meses} pagos` : ""}` : ""}
                {` · Devolución: ${d.devolucion.noEncontre ? "no la encontré" : d.devolucion.texto ? `según ${d.devolucion.fuente}` : "no anotada"}`}
              </div>
            </div>
            {(d.decision === "compro" || d.decision === "otra") && (
              <select aria-label={`Cómo quedó ${d.producto}`} value={d.desenlace ?? ""} onChange={(e) => ponerDesenlace(d.id, e.target.value)}>
                <option value="">¿Cómo te quedó?</option>
                {(Object.keys(DESENLACE) as Desenlace[]).map((k) => <option key={k} value={k}>{DESENLACE[k]}</option>)}
              </select>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
