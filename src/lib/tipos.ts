/* Tipos de CENTÍMETRO. Todo en centímetros una vez normalizado. */

export type Categoria = "abajo" | "arriba";
export type Medida = "cintura" | "cadera" | "entrepierna" | "pecho" | "largo" | "hombros" | "manga";

export const MEDIDAS: Record<Categoria, Medida[]> = {
  abajo: ["cintura", "cadera", "entrepierna"],
  arriba: ["pecho", "largo", "hombros", "manga"],
};

/* Medidas del cuerpo que tienen sentido comparar contra una tabla de cuerpo. */
export const MEDIDAS_CUERPO: Record<Categoria, Medida[]> = {
  abajo: ["cintura", "cadera", "entrepierna"],
  arriba: ["pecho", "cintura"],
};

export const NOMBRE: Record<Medida, string> = {
  cintura: "Cintura",
  cadera: "Cadera",
  entrepierna: "Largo interior",
  pecho: "Pecho",
  largo: "Largo",
  hombros: "Hombros",
  manga: "Manga",
};

/* "la cintura", "el largo interior": para escribir bien las frases. */
export const CON_ARTICULO: Record<Medida, string> = {
  cintura: "la cintura",
  cadera: "la cadera",
  entrepierna: "el largo interior",
  pecho: "el pecho",
  largo: "el largo",
  hombros: "los hombros",
  manga: "la manga",
};

/* Las que se miden "a lo ancho" con la prenda acostada y luego se duplican. */
export const CONTORNOS: Medida[] = ["cintura", "cadera", "pecho"];

export const COMO_MEDIR: Record<Medida, string> = {
  cintura: "Pantalón cerrado y acostado en la mesa. Mide de lado a lado por arriba, donde va el botón. No le des la vuelta: nosotros la duplicamos.",
  cadera: "Acostado, mide de lado a lado en la parte más ancha, a la altura del final del cierre.",
  entrepierna: "La entrepierna: desde la costura de en medio (entre las piernas) hasta el final de la pierna, por dentro. No es el tiro.",
  pecho: "Playera acostada. Mide de axila a axila. No le des la vuelta: nosotros la duplicamos.",
  largo: "Desde el punto más alto del hombro hasta el final de la prenda.",
  hombros: "De la costura de un hombro a la del otro, por la espalda.",
  manga: "Desde la costura del hombro hasta el final de la manga.",
};

export type Valor = number | null; // null = "no sé"

export type Estira = "si" | "no" | "nose";

export interface Referencia {
  categoria: Categoria;
  nombre: string;
  /* Tal como la escribió la persona: contornos a lo ancho (plano), largos completos. */
  plano: Partial<Record<Medida, Valor>>;
  estira: Estira;
}

export interface Cuerpo {
  medidas: Partial<Record<Medida, Valor>>; // contornos completos, en cm
}

export type TipoTabla = "prenda" | "cuerpo" | "nodice";
export type Unidad = "cm" | "in";
export type Origen = "gemini" | "manual" | "ejemplo";

export interface Rango {
  min: number;
  max: number;
}

export interface FilaTalla {
  talla: string;
  medidas: Partial<Record<Medida, Rango | null>>;
}

export interface Tabla {
  tienda: string;
  producto: string;
  categoria: Categoria;
  tipo: TipoTabla;
  unidad: Unidad;
  /* ¿Los contornos vienen a lo ancho (prenda acostada)? */
  plano: boolean;
  filas: FilaTalla[];
  origen: Origen;
  numerosLeidos: number; // cuántos números leyó la IA
  correcciones: number; // cuántos cambió la persona después
  revisada: boolean;
  leidas?: FilaTalla[] | null; // lo que leyó la IA, para contar correcciones (solo navegador)
}

export type EstadoCelda = "parecido" | "mas" | "menos" | "falta-tuya" | "falta-tienda";

export interface Celda {
  medida: Medida;
  tuya: number | null;
  tienda: Rango | null; // ya en cm y en contorno completo
  dif: number | null; // tienda − tuya, en cm
  estado: EstadoCelda;
}

export interface ResultadoTalla {
  talla: string;
  celdas: Celda[];
  distancia: number | null;
}

export interface Resultado {
  ok: boolean;
  motivo: string | null;
  base: "prenda" | "cuerpo";
  medidasComparables: Medida[];
  tallas: ResultadoTalla[];
  masParecida: string | null;
  empate: string[];
  faltan: { medida: Medida; de: "tuya" | "tienda" }[];
  avisos: string[];
}

export type Decision = "compro" | "otra" | "no-compro" | "lo-pienso";
export type Desenlace = "quedo" | "grande" | "chica" | "no-llego" | "devolvi";

export interface Devolucion {
  texto: string;
  fuente: string;
  noEncontre: boolean;
  costo: "si" | "no" | "nodice";
  consultada: string; // fecha AAAA-MM-DD
}

export interface RegistroDecision {
  id: string;
  fecha: string;
  producto: string;
  tienda: string;
  masParecida: string | null;
  decision: Decision;
  talla: string | null;
  precio: number | null;
  meses: number | null;
  devolucion: Devolucion;
  desenlace: Desenlace | null;
}

/* Formato público propuesto: "etiqueta en cm". No lleva datos de la persona. */
export interface EtiquetaCm {
  formato: "etiqueta-cm/0.1";
  producto: string;
  marca_o_tienda: string;
  categoria: Categoria;
  tipo_medidas: "prenda" | "cuerpo";
  tallas: { talla: string; medidas_cm: Partial<Record<Medida, [number, number]>> }[];
  fuente: {
    quien: "tabla-de-la-tienda" | "medida-por-comprador" | "ejemplo-inventado";
    como: string;
    fecha: string;
    verificada_fisicamente: boolean;
  };
  estado: "ILUSTRATIVO" | "APORTADA";
}
