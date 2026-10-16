"use client";
import { useEffect, useState } from "react";
import { NOMBRE, type Cuerpo, type Referencia, type Resultado, type Tabla } from "@/lib/tipos";
import { difTexto, explicacionPlantilla, nombrePrenda } from "@/lib/motor";

type Props = {
  refe: Referencia;
  cuerpo: Cuerpo;
  tabla: Tabla;
  resultado: Resultado;
  permiso: boolean;
  ia: "gemini" | "simulado" | "?";
  onPausa: () => void;
  onNoCompro: () => void;
  onEditarPrenda: () => void;
  onEditarTabla: () => void;
};

type Explicacion = { texto: string; fuente: "gemini" | "plantilla"; motivo?: string };

export function PasoComparar({ refe, cuerpo, tabla, resultado: r, permiso, onPausa, onNoCompro, onEditarPrenda, onEditarTabla }: Props) {
  const clave = JSON.stringify(r) + String(permiso);
  const [remota, setRemota] = useState<{ clave: string; exp: Explicacion } | null>(null);
  const local: Explicacion = { texto: explicacionPlantilla(r, refe.nombre || "prenda"), fuente: "plantilla", motivo: permiso ? undefined : "sin permiso de IA" };
  const pedir = r.ok && permiso;
  const exp: Explicacion | null = !pedir ? local : remota?.clave === clave ? remota.exp : null;
  const cargando = pedir && !exp;

  useEffect(() => {
    if (!pedir) return;
    let vivo = true;
    fetch("/api/explicar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ referencia: refe, cuerpo, tabla: { ...tabla, leidas: undefined }, permiso }),
    })
      .then((x) => x.json())
      .then((j) => { if (vivo) setRemota({ clave, exp: j.texto ? j : local }); })
      .catch(() => { if (vivo) setRemota({ clave, exp: { ...local, motivo: "sin conexión" } }); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const nombre = nombrePrenda(refe.nombre);
  const contra = r.base === "prenda" ? `tu ${nombre}` : "tu cuerpo";

  return (
    <section className="panel" aria-labelledby="t-comp">
      <h2 id="t-comp">3 · Comparar en centímetros</h2>
      <p className="sub">
        {tabla.producto} · {tabla.tienda}
      </p>
      <div className="chips">
        <span className="chip gis">Tabla de la tienda · parte interesada</span>
        <span className="chip">{tabla.tipo === "prenda" ? "Medidas de la prenda" : tabla.tipo === "cuerpo" ? "Medidas del cuerpo" : "No dice de qué son"}</span>
        <span className="chip ok">Revisada por ti ✓</span>
        {tabla.origen === "ejemplo" && <span className="chip gis">EJEMPLO INVENTADO</span>}
      </div>

      {!r.ok ? (
        <>
          <div className="aviso gis" role="status" style={{ marginTop: 14 }}>{r.motivo}</div>
          <div className="acciones">
            {tabla.tipo === "nodice" && <button className="btn" onClick={onEditarTabla}>Revisar otra vez la tabla</button>}
            {tabla.tipo === "cuerpo" && <button className="btn" onClick={onEditarPrenda}>Escribir medidas de mi cuerpo</button>}
          </div>
        </>
      ) : (
        <>
          <div className="res-envoltura">
            <table className="res">
              <caption className="res-cap">
                Diferencia de cada talla contra {contra}. <b>+</b> = la talla mide más; <b>−</b> = mide menos; <b>?</b> = falta el dato.
              </caption>
              <thead>
                <tr>
                  <th scope="col">vs. {r.base === "prenda" ? "tu prenda" : "tu cuerpo"}</th>
                  {r.tallas.map((t) => (
                    <th scope="col" key={t.talla} className={t.talla === r.masParecida ? "gana" : undefined}>{t.talla}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.tallas[0].celdas.map((c0, fi) => (
                  <tr key={c0.medida}>
                    <th scope="row">
                      {NOMBRE[c0.medida]}
                      <small>{c0.tuya != null ? `tuya: ${c0.tuya} cm` : "tuya: no sé"}</small>
                    </th>
                    {r.tallas.map((t) => {
                      const c = t.celdas[fi];
                      return (
                        <td key={t.talla} className={[t.talla === r.masParecida ? "gana" : "", c.estado === "parecido" ? "parecido" : c.estado === "mas" || c.estado === "menos" ? "lejos" : ""].join(" ")}>
                          {c.dif == null ? "?" : difTexto(c.dif)}
                          <small>{c.tienda ? (c.tienda.min === c.tienda.max ? `${c.tienda.min}` : `${c.tienda.min}–${c.tienda.max}`) : "—"}</small>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Diferencia total</th>
                  {r.tallas.map((t) => (
                    <td key={t.talla} className={t.talla === r.masParecida ? "gana" : undefined}>{t.distancia == null ? "—" : `${t.distancia} cm`}</td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {r.masParecida ? (
            <p className="aviso ok"><b>La más parecida en números: {r.masParecida}.</b> No es una promesa de que te quede.</p>
          ) : r.empate.length ? (
            <p className="aviso amarillo"><b>Empate entre {r.empate.join(" y ")}.</b> Quedan a menos de 1 cm de diferencia total: depende de si lo prefieres más justo o más holgado.</p>
          ) : (
            <p className="aviso gis">{r.motivo}</p>
          )}

          {r.faltan.length > 0 && (
            <div className="aviso gis">
              <b>Falta{r.faltan.length > 1 ? "n" : ""} {r.faltan.length} dato{r.faltan.length > 1 ? "s" : ""}:</b>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {r.faltan.map((f) => (
                  <li key={f.medida}>
                    {f.de === "tuya" ? (
                      <>No sabes la {NOMBRE[f.medida].toLowerCase()} de {r.base === "prenda" ? "tu prenda" : "tu cuerpo"}. ¿La puedes medir? <button className="btn chico-btn" onClick={onEditarPrenda}>Agregarla</button></>
                    ) : (
                      <>La tienda no da la {NOMBRE[f.medida].toLowerCase()}{r.tallas.some((t) => t.celdas.find((c) => c.medida === f.medida)?.tienda) ? " en todas las tallas" : ""}. Eso queda como incógnita.</>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {r.avisos.length > 0 && (
        <ul className="chico" style={{ paddingLeft: 18 }}>
          {r.avisos.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}

      <div className="explica" aria-live="polite">
        <span className="quien">
          {cargando ? "Escribiendo…" : exp?.fuente === "gemini" ? "En sencillo · escrito por Gemini a partir de los números de arriba" : `En sencillo · plantilla sin IA${exp?.motivo ? ` (${exp.motivo})` : ""}`}
        </span>
        <p>{exp?.texto ?? "…"}</p>
      </div>

      <div className="acciones par">
        <button type="button" className="btn prim" onClick={onPausa}>Seguir a la pausa antes de comprar</button>
        <button type="button" className="btn" onClick={onNoCompro}>No compro</button>
      </div>
      <p className="chico" style={{ marginTop: 8 }}>
        Las dos opciones pesan lo mismo. CENTÍMETRO no gana nada si compras.
      </p>
    </section>
  );
}
