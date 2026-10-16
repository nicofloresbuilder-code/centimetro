# CENTÍMETRO

**Compara la talla en centímetros contra una prenda tuya, antes de comprar en línea.** Sin cuenta, y nada tuyo se guarda en el servidor.

**En vivo:** https://centimetro.vercel.app · **La regla propuesta:** https://centimetro.vercel.app/regla · **Datos públicos:** https://centimetro.vercel.app/api/etiquetas

Proyecto de la semana 10 de AI 2041 (capítulo 9, "Isle of Happiness"), rol ADVERSARY. Ataca el vacío de **arrepentimiento por talla** del lado del comprador.

## Por qué

En México, la etiqueta de la ropa solo trae una letra. La NOM-004-SE-2021 acepta "las abreviaturas que tradicionalmente se vienen utilizando" para la talla, pero a la ropa de casa sí le pide centímetros. En 2026, Profeco encontró jeans que no miden lo que dice su etiqueta: 9 de 30 modelos de hombre y 3 de 23 de mujer. Las herramientas de tallas que existen (True Fit, Fit Analytics) las pagan las tiendas. El dato de cuánto mide la prenda es del vendedor.

## Cómo funciona

1. **Tu prenda.** Mides una prenda que ya te queda bien, acostada y de lado a lado. Lo que no sepas queda como "no sé".
2. **La tabla.** Subes la captura de la tabla de tallas. Con tu permiso, Gemini la lee y tú revisas cada número. También la puedes copiar a mano.
3. **Comparar.** Reglas fijas comparan en cm, prenda contra prenda o cuerpo contra cuerpo. Te dicen la talla más parecida en números y lo que falta. La IA solo la explica.
4. **Antes de pagar.** Precio, pagos y devolución con su fuente, todo opcional. "No compro" pesa lo mismo que comprar.
5. **Etiqueta en cm.** Así debería venir cualquier prenda. Sale como archivo y como enlace, y no lleva nada tuyo.

## Correrlo

```bash
npm install
cp .env.example .env.local    # pon tu GEMINI_API_KEY (opcional)
npm run dev                   # http://localhost:3000
npx tsx src/lib/__selftest.ts # 86 aserciones del motor
```

| Variable | Para qué | ¿Obligatoria? |
|---|---|---|
| `GEMINI_API_KEY` | Llave gratuita de Google AI Studio, solo en Vercel | No. Sin ella, la tabla se copia a mano y la explicación sale de un texto automático |
| `GEMINI_MODEL` | Modelo (por defecto `gemini-flash-latest`) | No |

## Estructura

| Archivo | Qué contiene |
|---|---|
| `src/lib/motor.ts` | Todas las reglas: validación, conversión, comparación, filtro del texto de la IA y etiqueta |
| `src/lib/tipos.ts` | Tipos y nombres de las medidas |
| `src/lib/prompts.ts` | Instrucciones para Gemini (leer y explicar) |
| `src/lib/servidor.ts` | Llamada a Gemini con modelo de respaldo y límite por IP |
| `src/lib/ejemplo.ts` | Ejemplos inventados, etiquetas ILUSTRATIVAS y esquema |
| `src/app/api/*` | `leer-tabla`, `explicar`, `estado`, `etiquetas`, `esquema` |
| `src/components/*` | Los cinco pasos, la etiqueta y la vista por enlace |
| `docs/PACKET.md` | El paquete antes del código, con mockup y diagramas |
| `docs/PERSONA.md` | Las dos rondas del persona test |
| `DECISIONS.md` | Decisiones, bugs y lo que no se construyó |

## Datos y seguridad

No hay cuentas, base de datos ni datos personales en el servidor: todo vive en tu navegador. La llave solo existe en Vercel, nunca en el repo. Cada campo tiene límites de largo, tipo y rango, y rechaza correos, teléfonos, CURP, tarjetas y llaves. El servidor vuelve a validar todo antes de llamar a la IA. La foto solo se manda con tu permiso y no se guarda. Las tiendas y prendas de los ejemplos son inventadas y están etiquetadas.

**CENTÍMETRO no garantiza cómo te va a quedar la ropa.** La regla en cm es una propuesta, no una norma vigente.

## Stack

Next.js 16 (App Router), React 19, TypeScript y Gemini (capa gratuita, visión y texto). Sin dependencias de interfaz.
