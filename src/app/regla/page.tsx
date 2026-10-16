import Link from "next/link";
import { Cabecera, Cinta, Pie } from "@/components/Marco";
import { VistaEtiqueta } from "@/components/Etiqueta";
import { ETIQUETAS_PUBLICAS } from "@/lib/ejemplo";

export const metadata = { title: "La regla en cm · CENTÍMETRO" };

export default function Regla() {
  return (
    <>
      <Cinta />
      <main className="envoltura regla">
        <Cabecera />

        <section className="panel">
          <span className="chip gis">PROPUESTA · no es una norma vigente</span>
          <h2 style={{ marginTop: 10 }}>A una toalla la ley le pide centímetros. A tu pantalón, solo una letra.</h2>
          <p>
            La NOM-004-SE-2021 (etiquetado de textiles y ropa) obliga a poner la <b>talla</b> en la etiqueta de la ropa, en español. Pero acepta &ldquo;las expresiones o abreviaturas que tradicionalmente se vienen utilizando&rdquo;: S, M, L, 32. No dice cuánto mide una M. Para la <b>ropa de casa</b> (toallas, sábanas), en cambio, sí pide medidas en el sistema de unidades: m, cm, mm.
          </p>
          <div className="compara">
            <div>
              <div className="chico">Toalla (ropa de casa)</div>
              <div className="grande">70 × 140 cm</div>
              <div className="chico">La norma pide medidas.</div>
            </div>
            <div>
              <div className="chico">Pantalón (prenda de vestir)</div>
              <div className="grande">32</div>
              <div className="chico">La norma acepta la talla &ldquo;tradicional&rdquo;.</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Y la letra a veces ni siquiera coincide</h2>
          <ul>
            <li>En 2026, Profeco analizó <b>30 modelos de jeans de hombre</b>: <b>9</b> medían un poco más de lo que declaraba su talla.</li>
            <li>En 2026, Profeco analizó <b>23 modelos de jeans de mujer</b>: <b>3</b> salieron una talla más chicos que su etiqueta.</li>
          </ul>
          <p className="chico">Son pruebas de laboratorio de modelos específicos, no de toda la ropa del país. Muestran que una talla es una promesa sin medida detrás.</p>
        </section>

        <section className="panel">
          <h2>El dato de cuánto mide existe, pero es del vendedor</h2>
          <p>
            Las herramientas de tallas más grandes del mundo (True Fit, Fit Analytics) las contratan las tiendas y viven dentro de la página de la tienda. True Fit lanzó en febrero de 2026 un agente de compras con casi 20 años de datos de compras y devoluciones, pero se vende a tiendas y marcas. El comprador no tiene un dato propio y neutral.
          </p>
          <p>Cuando un dato es de un solo lado, ponerlo en una app voluntaria no basta: lo que abre la puerta es que publicarlo sea obligatorio.</p>
        </section>

        <section className="panel">
          <h2>La propuesta</h2>
          <ol>
            <li><b>Además de la talla</b>, las prendas de vestir declaran 2 o 3 medidas de la prenda en cm: cintura, cadera y entrepierna en pantalones; pecho, largo y hombros en prendas de arriba.</li>
            <li>Dicen si son medidas <b>de la prenda o del cuerpo</b>. Si no lo dicen, no se puede comparar nada.</li>
            <li>Si se venden en línea, la misma información aparece en la ficha del producto <b>en un formato que una máquina pueda leer</b>, como el que prueba esta app: <a href="/api/esquema">etiqueta-cm/0.1</a>.</li>
          </ol>
          <p>Así, cualquier persona o agente (gratis, del lado del comprador) puede comparar la prenda contra una que ya tienes. No hace falta una base de datos privada ni pagarle a nadie.</p>
          <h3>Ejemplo de etiqueta</h3>
          <VistaEtiqueta e={ETIQUETAS_PUBLICAS[0]} />
          <h3>Lo que esta propuesta NO hace</h3>
          <ul>
            <li>No garantiza que la ropa te quede: las telas estiran distinto y cada cuerpo es distinto.</li>
            <li>No obliga a nadie a medirse.</li>
            <li>No está aprobada. Es un prototipo para discutir, hecho por un estudiante.</li>
            <li>Tiene un costo para quien fabrica: medir y publicar. Ese costo no está calculado aquí.</li>
          </ul>
          <div className="acciones">
            <Link className="btn prim" href="/">Probar la comparación</Link>
            <a className="btn" href="/api/etiquetas">Ver los datos públicos (JSON)</a>
          </div>
        </section>

        <section className="panel fuentes">
          <h2>Fuentes</h2>
          <ul>
            <li>NOM-004-SE-2021, Información comercial: etiquetado de productos textiles, prendas de vestir, sus accesorios y ropa de casa. Diario Oficial de la Federación. <a href="https://dof.gob.mx/normasOficiales/8934/seeco/seeco.html">dof.gob.mx</a> (incisos 4.1.1 c, 4.4.1 y 4.4.2).</li>
            <li>Profeco, estudio de pantalones de mezclilla para caballero (30 modelos), reportado por El Imparcial, 26 jul 2026. <a href="https://www.elimparcial.com/dinero/2026/07/26/profeco-analiza-30-pantalones-de-mezclilla-para-caballero-y-revela-cuales-resisten-mejor-el-uso-cuales-se-encogen-despues-del-lavado-y-que-modelos-presentan-medidas-mayores-a-las-indicadas-en-su-etiqueta/">elimparcial.com</a></li>
            <li>Profeco, estudio de pantalones de mezclilla para dama (23 modelos), reportado por Crónica, 10 oct 2026. <a href="https://www.cronica.com.mx/negocios/2026/10/10/profeco-analiza-pantalones-de-mezclilla-para-dama-y-detecta-fallas-en-tallas-y-decoloracion/">cronica.com.mx</a></li>
            <li>True Fit, &ldquo;True Fit Launches Agentic AI Shopping Experience Powered by 20 Years of Fit Data&rdquo;, Business Wire, 17 feb 2026. <a href="https://www.businesswire.com/news/home/20260217995165/en">businesswire.com</a></li>
            <li>Snap adquiere Fit Analytics, Retail Dive, 2021. <a href="https://www.retaildive.com/news/snap-acquires-sizing-tech-company-fit-analytics/596941">retaildive.com</a></li>
          </ul>
        </section>

        <Pie />
      </main>
    </>
  );
}
