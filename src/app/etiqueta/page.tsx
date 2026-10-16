import { Cabecera, Cinta, Pie } from "@/components/Marco";
import { VerEtiqueta } from "@/components/VerEtiqueta";

export const metadata = { title: "Etiqueta en cm · CENTÍMETRO" };

export default function PaginaEtiqueta() {
  return (
    <>
      <Cinta />
      <main className="envoltura">
        <Cabecera />
        <VerEtiqueta />
        <Pie />
      </main>
    </>
  );
}
