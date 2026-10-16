/* Cinta, cabecera y pie compartidos por todas las páginas. */
import Link from "next/link";

export const REPO = "https://github.com/nicofloresbuilder-code/centimetro";

export function Cinta() {
  return (
    <div className="cinta" aria-hidden="true">
      <div className="cinta-num">
        {Array.from({ length: 30 }, (_, i) => (
          <span key={i}>{i * 10}</span>
        ))}
      </div>
    </div>
  );
}

export function Cabecera({ children }: { children?: React.ReactNode }) {
  return (
    <header className="cabecera">
      <div>
        <p className="marca">
          <Link href="/" style={{ textDecoration: "none" }}>
            CENTÍ<i>METRO</i>
          </Link>
        </p>
        <nav className="nav" aria-label="Secciones">
          <Link href="/">Comparar</Link>
          <Link href="/regla">La regla en cm</Link>
          <a href="/api/etiquetas">Datos públicos</a>
        </nav>
      </div>
      <div>
        <p className="lema">Compara la talla en centímetros contra una prenda tuya, antes de comprar en línea. Sin cuenta. Nada tuyo se guarda en el servidor.</p>
        {children}
      </div>
    </header>
  );
}

export function Pie() {
  return (
    <footer className="pie">
      <p>
        <b>Responsable:</b> Nicolás Flores (proyecto escolar, AI 2041 · semana 10). ¿Algo salió mal o una lectura estuvo equivocada?{" "}
        <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">Repórtalo en GitHub</a>.
      </p>
      <p>
        CENTÍMETRO no vende nada, no tiene enlaces a tiendas y no gana nada si compras. No garantiza cómo te va a quedar la ropa. Las tiendas y prendas de los ejemplos son inventadas.
      </p>
    </footer>
  );
}
