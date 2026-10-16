/* Cómo se ve una "etiqueta en cm": lo que propone la regla. */
import { MEDIDAS, NOMBRE, type EtiquetaCm } from "@/lib/tipos";

export function VistaEtiqueta({ e }: { e: EtiquetaCm }) {
  const cols = MEDIDAS[e.categoria].filter((m) => e.tallas.some((t) => t.medidas_cm[m]));
  return (
    <figure className="etiqueta" aria-label={`Etiqueta en cm de ${e.producto}`}>
      <div className="cab">
        <span>etiqueta-cm · v0.1</span>
        {e.estado === "ILUSTRATIVO" ? <span className="sello-ilus">ILUSTRATIVO</span> : <span>aportada por comprador</span>}
      </div>
      <h4>{e.producto}</h4>
      <div className="chico">{e.marca_o_tienda}</div>
      <div className="chico" style={{ marginTop: 4 }}>
        <b>{e.tipo_medidas === "prenda" ? "Medidas de la PRENDA" : "Medidas del CUERPO"}</b>, en centímetros. Contornos completos.
      </div>
      <table>
        <thead>
          <tr>
            <th>Talla</th>
            {cols.map((m) => <th key={m}>{NOMBRE[m]}</th>)}
          </tr>
        </thead>
        <tbody>
          {e.tallas.map((t) => (
            <tr key={t.talla}>
              <td><b>{t.talla}</b></td>
              {cols.map((m) => {
                const v = t.medidas_cm[m];
                return <td key={m}>{v ? (v[0] === v[1] ? v[0] : `${v[0]}–${v[1]}`) : "—"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="chico">
        Fuente: {e.fuente.quien === "tabla-de-la-tienda" ? "tabla de la tienda" : e.fuente.quien === "medida-por-comprador" ? "medida por un comprador" : "ejemplo inventado"} · {e.fuente.como} · {e.fuente.fecha} ·{" "}
        {e.fuente.verificada_fisicamente ? "verificada midiendo la prenda" : "NO verificada midiendo la prenda"}
      </div>
    </figure>
  );
}
