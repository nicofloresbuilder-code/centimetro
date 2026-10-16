"use client";
import { useState } from "react";
import { COMO_MEDIR, CONTORNOS, MEDIDAS, MEDIDAS_CUERPO, NOMBRE, type Categoria, type Cuerpo, type Medida, type Referencia } from "@/lib/tipos";
import { medio, validarCuerpo, validarReferencia } from "@/lib/motor";
import { REF_EJEMPLO } from "@/lib/ejemplo";

type Props = {
  refe: Referencia;
  setRef: (r: Referencia) => void;
  cuerpo: Cuerpo;
  setCuerpo: (c: Cuerpo) => void;
  onSeguir: () => void;
};

const numero = (s: string): number | null => {
  const n = Number(s.replace(",", "."));
  return s.trim() && Number.isFinite(n) ? n : null;
};

export function PasoPrenda({ refe, setRef, cuerpo, setCuerpo, onSeguir }: Props) {
  const [errores, setErrores] = useState<string[]>([]);
  const [verCuerpo, setVerCuerpo] = useState(Object.values(cuerpo.medidas).some((v) => v != null));

  const cambiarCategoria = (c: Categoria) => setRef({ ...refe, categoria: c, plano: {} });
  const ponerMedida = (m: Medida, v: number | null | undefined) => setRef({ ...refe, plano: { ...refe.plano, [m]: v } });

  const seguir = () => {
    const e = [...validarReferencia(refe), ...validarCuerpo(cuerpo, refe.categoria)];
    setErrores(e);
    if (!e.length) onSeguir();
  };

  return (
    <section className="panel" aria-labelledby="t-prenda">
      <h2 id="t-prenda">1 · Una prenda tuya que te quede bien</h2>
      <p className="sub">
        No te midas tú: <b>mide una prenda que ya tienes y te gusta cómo te queda</b>. Acuéstala en una mesa y usa una cinta o una regla. Lo que no sepas, déjalo en &ldquo;no sé&rdquo;. Nunca lo inventamos.
      </p>

      <div className="campo">
        <span className="etq">¿Qué tipo de prenda vas a comparar?</span>
        <div className="opciones" role="group" aria-label="Tipo de prenda">
          <button type="button" className="opcion" aria-pressed={refe.categoria === "abajo"} onClick={() => cambiarCategoria("abajo")}>Pantalón, jeans, short</button>
          <button type="button" className="opcion" aria-pressed={refe.categoria === "arriba"} onClick={() => cambiarCategoria("arriba")}>Playera, camisa, sudadera</button>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="nombre">¿Cómo le dices a tu prenda?</label>
        <input id="nombre" type="text" maxLength={80} placeholder="Ej. mi pantalón azul" value={refe.nombre} onChange={(e) => setRef({ ...refe, nombre: e.target.value })} />
      </div>

      {MEDIDAS[refe.categoria].map((m) => {
        const v = refe.plano[m];
        const nose = v === null;
        const contorno = CONTORNOS.includes(m);
        return (
          <div className="medida" key={m}>
            <div>
              <label className="etq" htmlFor={`m-${m}`}>
                {NOMBRE[m]} {contorno && <span className="chico">(a lo ancho)</span>}
              </label>
              <p className="ayuda">{COMO_MEDIR[m]}</p>
            </div>
            <div>
              <div className="fila" style={{ flexWrap: "nowrap" }}>
                <input
                  id={`m-${m}`}
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={200}
                  step={0.5}
                  disabled={nose}
                  value={typeof v === "number" ? v : ""}
                  onChange={(e) => ponerMedida(m, numero(e.target.value) ?? undefined)}
                  aria-describedby={`eco-${m}`}
                />
                <span className="chico">cm</span>
              </div>
              <label className="check" style={{ marginTop: 6 }}>
                <input type="checkbox" checked={nose} onChange={(e) => ponerMedida(m, e.target.checked ? null : undefined)} />
                No sé
              </label>
              {contorno && typeof v === "number" && (
                <p className="eco" id={`eco-${m}`}>
                  Contorno ≈ {medio(v * 2)} cm
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div className="campo" style={{ marginTop: 14 }}>
        <span className="etq">¿La tela estira?</span>
        <div className="opciones" role="group" aria-label="¿Estira?">
          {(["si", "no", "nose"] as const).map((e) => (
            <button type="button" key={e} className="opcion" aria-pressed={refe.estira === e} onClick={() => setRef({ ...refe, estira: e })}>
              {e === "si" ? "Sí estira" : e === "no" ? "No estira" : "No sé"}
            </button>
          ))}
        </div>
      </div>

      <details open={verCuerpo} onToggle={(e) => setVerCuerpo((e.target as HTMLDetailsElement).open)} style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>Opcional: medidas de tu cuerpo (solo si la tabla de la tienda es de cuerpo)</summary>
        <p className="ayuda">
          Muchas tiendas dan medidas del <b>cuerpo</b>, no de la prenda. Esas no se pueden comparar contra tu prenda. Si quieres, escribe las tuyas aquí. Se quedan en este navegador.
        </p>
        {MEDIDAS_CUERPO[refe.categoria].map((m) => (
          <div className="campo" key={m}>
            <label htmlFor={`c-${m}`}>{NOMBRE[m]} del cuerpo (contorno completo, cm)</label>
            <input
              id={`c-${m}`}
              type="number"
              inputMode="decimal"
              step={0.5}
              value={cuerpo.medidas[m] ?? ""}
              onChange={(e) => setCuerpo({ medidas: { ...cuerpo.medidas, [m]: numero(e.target.value) } })}
            />
          </div>
        ))}
      </details>

      {errores.length > 0 && (
        <div className="errores" role="alert">
          <ul>{errores.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="acciones">
        <button type="button" className="btn prim" onClick={seguir}>Seguir a la tabla de la tienda</button>
        <button type="button" className="btn" onClick={() => { setRef(structuredClone(REF_EJEMPLO)); setErrores([]); }}>
          Llenar con el ejemplo inventado
        </button>
      </div>
    </section>
  );
}
