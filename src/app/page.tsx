import Centimetro from "@/components/Centimetro";
import { Cabecera, Cinta, Pie } from "@/components/Marco";

export default function Inicio() {
  return (
    <>
      <Cinta />
      <main className="envoltura">
        <Cabecera />
        <Centimetro />
        <Pie />
      </main>
    </>
  );
}
