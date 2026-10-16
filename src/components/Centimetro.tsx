"use client";
/* La app: cinco pasos. Todo el estado vive en este navegador. */
import { useEffect, useState } from "react";
import type { Cuerpo, Referencia, RegistroDecision, Resultado, Tabla } from "@/lib/tipos";
import { comparar } from "@/lib/motor";
import { borrarTodo, guardar, leer } from "@/lib/navegador";
import { PasoPrenda } from "./PasoPrenda";
import { PasoTabla } from "./PasoTabla";
import { PasoComparar } from "./PasoComparar";
import { PasoPausa } from "./PasoPausa";
import { PasoEtiqueta } from "./PasoEtiqueta";

const PASOS = ["Tu prenda", "La tabla", "Comparar", "Antes de pagar", "Etiqueta en cm"];

export const REF_VACIA: Referencia = { categoria: "abajo", nombre: "", plano: {}, estira: "nose" };

export default function Centimetro() {
  const [listo, setListo] = useState(false);
  const [paso, setPaso] = useState(0);
  const [ref, setRef] = useState<Referencia>(REF_VACIA);
  const [cuerpo, setCuerpo] = useState<Cuerpo>({ medidas: {} });
  const [tabla, setTabla] = useState<Tabla | null>(null);
  const [permiso, setPermiso] = useState(false);
  const [ia, setIa] = useState<"gemini" | "simulado" | "?">("?");
  const [decisiones, setDecisiones] = useState<RegistroDecision[]>([]);
  const [ultima, setUltima] = useState<string | null>(null);
  const [inicial, setInicial] = useState<RegistroDecision["decision"] | null>(null);
  const [armado, setArmado] = useState(false);

  useEffect(() => {
    // Se lee lo guardado después del primer render (en el servidor no existe localStorage).
    const t = setTimeout(() => {
      setRef(leer("ref", REF_VACIA));
      setCuerpo(leer("cuerpo", { medidas: {} }));
      setTabla(leer<Tabla | null>("tabla", null));
      setPermiso(leer("permiso", false));
      setDecisiones(leer("decisiones", []));
      setListo(true);
    }, 0);
    fetch("/api/estado").then((r) => r.json()).then((j) => setIa(j.ia)).catch(() => setIa("simulado"));
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { if (listo) guardar("ref", ref); }, [ref, listo]);
  useEffect(() => { if (listo) guardar("cuerpo", cuerpo); }, [cuerpo, listo]);
  useEffect(() => { if (listo) guardar("tabla", tabla); }, [tabla, listo]);
  useEffect(() => { if (listo) guardar("permiso", permiso); }, [permiso, listo]);
  useEffect(() => { if (listo) guardar("decisiones", decisiones); }, [decisiones, listo]);

  const resultado: Resultado | null = tabla && tabla.revisada ? comparar(ref, cuerpo, tabla) : null;

  // Hasta dónde se puede llegar: no se salta la comparación, pero nunca se bloquea decidir.
  const alcanzable = [true, true, Boolean(tabla?.revisada), Boolean(tabla?.revisada), Boolean(ultima) || Boolean(tabla?.revisada)];

  const ir = (n: number) => {
    setPaso(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reiniciar = () => {
    // Sin ventanas emergentes: se confirma con un segundo toque.
    if (!armado) { setArmado(true); setTimeout(() => setArmado(false), 5000); return; }
    setArmado(false);
    borrarTodo();
    setRef(REF_VACIA); setCuerpo({ medidas: {} }); setTabla(null); setPermiso(false); setDecisiones([]); setUltima(null); setPaso(0);
  };

  return (
    <>
      <div className="chips" style={{ marginBottom: 6 }}>
        <span className="chip">Tus medidas: solo en este navegador</span>
        <span className="chip">Sin cuenta</span>
      </div>

      <nav aria-label="Pasos">
        <ol className="pasos">
          {PASOS.map((t, i) => (
            <li key={t}>
              <button type="button" disabled={!alcanzable[i]} aria-current={paso === i ? "step" : undefined} onClick={() => ir(i)}>
                <span className="n">{i + 1}/5</span>
                <span className="t">{t}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {!listo ? (
        <div className="panel">Cargando…</div>
      ) : paso === 0 ? (
        <PasoPrenda refe={ref} setRef={setRef} cuerpo={cuerpo} setCuerpo={setCuerpo} onSeguir={() => ir(1)} />
      ) : paso === 1 ? (
        <PasoTabla
          categoria={ref.categoria}
          tabla={tabla}
          setTabla={setTabla}
          permiso={permiso}
          setPermiso={setPermiso}
          ia={ia}
          onSeguir={() => ir(2)}
          onAtras={() => ir(0)}
        />
      ) : paso === 2 && tabla && resultado ? (
        <PasoComparar
          refe={ref}
          cuerpo={cuerpo}
          tabla={tabla}
          resultado={resultado}
          permiso={permiso}
          ia={ia}
          onPausa={() => { setInicial(null); ir(3); }}
          onNoCompro={() => { setInicial("no-compro"); ir(3); }}
          onEditarPrenda={() => ir(0)}
          onEditarTabla={() => ir(1)}
        />
      ) : paso === 3 && tabla && resultado ? (
        <PasoPausa
          tabla={tabla}
          resultado={resultado}
          inicial={inicial}
          onGuardar={(r) => { setDecisiones((d) => [r, ...d].slice(0, 100)); setUltima(r.id); ir(4); }}
          onAtras={() => ir(2)}
        />
      ) : paso === 4 ? (
        <PasoEtiqueta tabla={tabla} decisiones={decisiones} setDecisiones={setDecisiones} ultima={ultima} onNueva={() => { setTabla(null); setUltima(null); ir(1); }} />
      ) : (
        <div className="panel">
          <p>Primero confirma una tabla en el paso 2.</p>
          <button className="btn" onClick={() => ir(1)}>Ir al paso 2</button>
        </div>
      )}

      <div className="acciones" style={{ marginTop: 22 }}>
        <button className="btn chico-btn" type="button" onClick={reiniciar}>{armado ? "Toca otra vez para borrar todo" : "Borrar todo lo guardado en este navegador"}</button>
      </div>
    </>
  );
}

