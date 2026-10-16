/* Solo navegador: guardado local y preparación de imágenes. */

const PREFIJO = "centimetro.";

export function leer<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(PREFIJO + clave);
    return v ? (JSON.parse(v) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function guardar(clave: string, valor: unknown) {
  try {
    if (valor === null || valor === undefined) localStorage.removeItem(PREFIJO + clave);
    else localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: la app sigue funcionando en memoria */
  }
}

export function borrarTodo() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIJO)) localStorage.removeItem(k);
  } catch {
    /* nada */
  }
}

export const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const TIPOS = ["image/jpeg", "image/png", "image/webp"];

/** Reduce la imagen en el navegador (máx. 1600 px, JPEG) para mandarla ligera. */
export async function prepararImagen(archivo: Blob): Promise<string> {
  if (!TIPOS.includes(archivo.type)) throw new Error("La imagen debe ser JPG, PNG o WEBP.");
  if (archivo.size > 12 * 1024 * 1024) throw new Error("La imagen pesa más de 12 MB.");
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("No se pudo abrir la imagen."));
      i.src = url;
    });
    let escala = Math.min(1, 1600 / Math.max(img.width, img.height));
    for (let intento = 0; intento < 4; intento++) {
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL("image/jpeg", 0.85);
      if (data.length < 2_000_000) return data;
      escala *= 0.7;
    }
    throw new Error("La imagen sigue muy pesada; recórtala solo a la tabla.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
