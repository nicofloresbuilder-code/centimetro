/* Datos inventados para la demostración. Ninguna tienda ni persona es real. */
import type { EtiquetaCm, Referencia, Tabla } from "./tipos";

export const REF_EJEMPLO: Referencia = {
  categoria: "abajo",
  nombre: "Pantalón azul (ejemplo)",
  plano: { cintura: 41, cadera: 50, entrepierna: 76 },
  estira: "no",
};

export const TABLA_EJEMPLO: Tabla = {
  tienda: "Tienda Ejemplo (inventada)",
  producto: "Jeans corte recto",
  categoria: "abajo",
  tipo: "prenda",
  unidad: "cm",
  plano: false,
  filas: [
    { talla: "28", medidas: { cintura: { min: 74, max: 74 }, cadera: { min: 92, max: 92 }, entrepierna: null } },
    { talla: "30", medidas: { cintura: { min: 78, max: 78 }, cadera: { min: 96, max: 96 }, entrepierna: null } },
    { talla: "32", medidas: { cintura: { min: 83, max: 83 }, cadera: { min: 100, max: 100 }, entrepierna: null } },
    { talla: "34", medidas: { cintura: { min: 88, max: 88 }, cadera: { min: 105, max: 105 }, entrepierna: null } },
    { talla: "36", medidas: { cintura: { min: 93, max: 93 }, cadera: { min: 110, max: 110 }, entrepierna: null } },
  ],
  origen: "ejemplo",
  numerosLeidos: 0,
  correcciones: 0,
  revisada: false,
};

/* El conjunto público de ejemplo que sirve /api/etiquetas. Todo ILUSTRATIVO. */
export const ETIQUETAS_PUBLICAS: EtiquetaCm[] = [
  {
    formato: "etiqueta-cm/0.1",
    producto: "Jeans corte recto",
    marca_o_tienda: "Tienda Ejemplo (inventada)",
    categoria: "abajo",
    tipo_medidas: "prenda",
    tallas: [
      { talla: "30", medidas_cm: { cintura: [78, 78], cadera: [96, 96], entrepierna: [76, 76] } },
      { talla: "32", medidas_cm: { cintura: [83, 83], cadera: [100, 100], entrepierna: [76, 76] } },
      { talla: "34", medidas_cm: { cintura: [88, 88], cadera: [105, 105], entrepierna: [77, 77] } },
    ],
    fuente: { quien: "ejemplo-inventado", como: "ejemplo de la app", fecha: "2026-10-16", verificada_fisicamente: false },
    estado: "ILUSTRATIVO",
  },
  {
    formato: "etiqueta-cm/0.1",
    producto: "Playera básica",
    marca_o_tienda: "Marca Ficticia",
    categoria: "arriba",
    tipo_medidas: "prenda",
    tallas: [
      { talla: "S", medidas_cm: { pecho: [96, 96], largo: [68, 68], hombros: [42, 42] } },
      { talla: "M", medidas_cm: { pecho: [102, 102], largo: [71, 71], hombros: [45, 45] } },
      { talla: "L", medidas_cm: { pecho: [108, 108], largo: [74, 74], hombros: [48, 48] } },
    ],
    fuente: { quien: "ejemplo-inventado", como: "ejemplo de la app", fecha: "2026-10-16", verificada_fisicamente: false },
    estado: "ILUSTRATIVO",
  },
  {
    formato: "etiqueta-cm/0.1",
    producto: "Pantalón de vestir",
    marca_o_tienda: "Marca Ficticia",
    categoria: "abajo",
    tipo_medidas: "cuerpo",
    tallas: [
      { talla: "M", medidas_cm: { cintura: [78, 82], cadera: [96, 100] } },
      { talla: "L", medidas_cm: { cintura: [83, 88], cadera: [101, 106] } },
    ],
    fuente: { quien: "ejemplo-inventado", como: "ejemplo de la app: tabla de CUERPO, no de la prenda", fecha: "2026-10-16", verificada_fisicamente: false },
    estado: "ILUSTRATIVO",
  },
];

/* JSON Schema del formato propuesto. */
export const ESQUEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://centimetro.vercel.app/api/esquema",
  title: "etiqueta-cm/0.1",
  description:
    "Formato PROPUESTO (no es una norma vigente) para publicar las medidas de una prenda en centímetros, en la etiqueta y en la ficha en línea, legible por personas y por agentes. No lleva datos de quien compra.",
  type: "object",
  required: ["formato", "producto", "marca_o_tienda", "categoria", "tipo_medidas", "tallas", "fuente", "estado"],
  properties: {
    formato: { const: "etiqueta-cm/0.1" },
    producto: { type: "string", maxLength: 80 },
    marca_o_tienda: { type: "string", maxLength: 80 },
    categoria: { enum: ["abajo", "arriba"] },
    tipo_medidas: { enum: ["prenda", "cuerpo"], description: "prenda = medidas de la ropa; cuerpo = medidas de la persona que la usaría" },
    tallas: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        required: ["talla", "medidas_cm"],
        properties: {
          talla: { type: "string", maxLength: 8 },
          medidas_cm: {
            type: "object",
            description: "Cada medida es [mínimo, máximo] en cm. Los contornos (cintura, cadera, pecho) van completos, no a lo ancho.",
            propertyNames: { enum: ["cintura", "cadera", "entrepierna", "pecho", "largo", "hombros", "manga"] },
            additionalProperties: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
          },
        },
      },
    },
    fuente: {
      type: "object",
      required: ["quien", "como", "fecha", "verificada_fisicamente"],
      properties: {
        quien: { enum: ["tabla-de-la-tienda", "medida-por-comprador", "ejemplo-inventado"] },
        como: { type: "string" },
        fecha: { type: "string" },
        verificada_fisicamente: { type: "boolean" },
      },
    },
    estado: { enum: ["ILUSTRATIVO", "APORTADA"] },
  },
};
