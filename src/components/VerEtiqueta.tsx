"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { EtiquetaCm } from "@/lib/tipos";
import { decodificar, validarEtiqueta } from "@/lib/motor";
import { VistaEtiqueta } from "./Etiqueta";

/* Lee la etiqueta del fragmento (#). El servidor nunca la ve. */
export function VerEtiqueta() {
  const [estado, setEstado] = useState<{ e: EtiquetaCm | null; error: string | null } | null>(null);

  useEffect(() => {
    const leer = () => {
      const h = window.location.hash.slice(1);
      if (!h) return setEstado({ e: null, error: "Este enlace no trae ninguna etiqueta." });
      if (h.length > 20000) return setEstado({ e: null, error: "El enlace es demasiado largo." });
      const o = decodificar(h);
      const err = validarEtiqueta(o);
      setEstado(err.length ? { e: null, error: `Este enlace no trae una etiqueta válida; puede estar cortado o editado (${err.slice(0, 3).join(", ")}).` } : { e: o as EtiquetaCm, error: null });
    };
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, []);

  return (
    <section className="panel">
      <h2>Etiqueta en cm</h2>
      {!estado ? (
        <p>Leyendo…</p>
      ) : estado.error ? (
        <p className="aviso gis" role="alert">{estado.error}</p>
      ) : (
        <>
          <p className="sub">Alguien compartió estas medidas contigo. Las sacó de la tabla de la tienda; nadie midió la prenda para confirmarlas.</p>
          <VistaEtiqueta e={estado.e!} />
          <pre className="json">{JSON.stringify(estado.e, null, 2)}</pre>
        </>
      )}
      <div className="acciones">
        <Link className="btn prim" href="/">Comparar contra una prenda mía</Link>
        <Link className="btn" href="/regla">¿Por qué en cm?</Link>
      </div>
    </section>
  );
}
