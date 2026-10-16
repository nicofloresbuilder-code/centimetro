# DECISIONS: CENTÍMETRO

*Semana 10 de AI 2041, capítulo 9 ("Isle of Happiness"). Rol: ADVERSARY. Slice declarado en el Blueprint: "comparación de medidas de la prenda y prototipo de una regla de datos públicos, sin garantizar el ajuste".*

## Decisiones

1. **Es del comprador, no de la tienda.** No hay enlaces para comprar, ni afiliados, ni "dónde comprarlo", ni nada para vendedores (zona prohibida). La app no gana nada si compras.
2. **Mides tu prenda, no tu cuerpo.** En la pelea quedó abierta la pregunta "¿el usuario se va a medir?". La respuesta: no hace falta. Se compara contra una prenda que ya te queda. Las medidas del cuerpo son opcionales y solo sirven cuando la tabla es de cuerpo.
3. **Prenda contra prenda, cuerpo contra cuerpo, y si no dice, no se compara.** Una prenda siempre mide más que el cuerpo que la usa. Si la tabla no dice qué midió, la app lo explica y no adivina. Ese hueco es evidencia para la regla.
4. **Las reglas calculan y la IA lee y explica** (condición de Fátima). La comparación es código determinista con autoprueba. Gemini solo lee la captura y escribe una explicación con el resultado ya calculado.
5. **Al texto de la IA se le revisa todo.** Se rechaza si promete ajuste ("te queda", "perfecto", "garantizado"), si recomienda comprar, si trae enlaces o si usa un número que el motor no calculó. Si se rechaza, sale la explicación automática.
6. **Lo que lee la IA no cuenta hasta que la persona lo revisa.** Lo que no se puede leer se descarta, no se corrige. Se cuenta cuántos números leyó la IA y cuántos corrigió la persona; ese es el registro de errores de extracción que pidió el Operator.
7. **"No sé" es un valor real.** Nunca se rellena. Con menos de 2 medidas comparables no hay "talla más parecida", y una diferencia de menos de 1 cm entre tallas se reporta como empate.
8. **"La más parecida en números", nunca "tu talla".** La fuente se marca siempre como interesada: Profeco encontró jeans que no miden lo que dice su etiqueta.
9. **La pausa está dentro del flujo, pero no bloquea** (cláusula de sombra). Antes de decidir aparecen el precio, los pagos y la devolución, pero todo es opcional. "No compro" pesa igual que seguir. No hay notificaciones, rachas ni métricas de uso.
10. **La devolución va aparte y con fuente** (condición del Operator). Va con texto, de dónde salió y fecha, o "no la encontré".
11. **Nada personal en el servidor, así que no hay login.** Las medidas, la tabla y las decisiones viven en `localStorage`, envuelto en try/catch. El servidor no guarda nada. Por eso, según el piso de seguridad, no hacen falta Supabase, auth ni RLS.
12. **La foto sale del navegador solo con permiso,** y el permiso se pide en el momento de leer. Se reduce en el navegador (máximo 1600 px, ~1.5 MB) y el servidor revisa el tipo y el peso.
13. **El servidor vuelve a correr todas las reglas** antes de llamar a la IA. A Gemini solo le llegan números, sin el nombre de tu prenda.
14. **La etiqueta en cm es un formato propuesto** (`etiqueta-cm/0.1`, con esquema en `/api/esquema`). No lleva datos de la persona. Viaja en el fragmento (#) del enlace y `/api/etiquetas` sirve ejemplos ILUSTRATIVOS que cualquier agente puede leer. Nunca se dice que la NOM ya cambió.
15. **La cuenta honesta** solo muestra conteos con denominador, sin porcentajes. "Me quedó" solo cuenta lo que ya llegó.
16. **No se usa el 75.8% de devoluciones ni ninguna cifra sin método** (acuerdo del Blueprint: las tasas de devolución solas no prueban malas decisiones).
17. **Gemini con plan B,** por lo aprendido en la semana 9. Si el modelo responde 404 o 503, se reintenta y se busca otro modelo Flash disponible. Si todo falla, la app sigue sin IA y lo dice.

## Bugs

| Bug | Cómo se encontró | Arreglo |
|---|---|---|
| La autoprueba esperaba 7 números leídos y eran 6 (un valor imposible se descartó bien) | Autoprueba | El error estaba en la prueba, no en el motor |
| ESLint: `setState` directo dentro de `useEffect` (al cargar y en la explicación) | Lint | Lo guardado se lee después del primer render; la explicación se deriva en el render y solo la respuesta remota va en el estado |
| Al reiniciar, el servidor viejo seguía ocupando el puerto y servía otra versión | Pase mecánico | Se reinicia por nombre de proceso. Además, `pkill -f "next start"` mataba a la misma terminal porque coincidía con su propio comando |
| La explicación decía "tu mi pantalón" | Pase mecánico (curl a `/api/explicar`) | `nombrePrenda()` quita "mi/tu/el/la" y se agregaron aserciones |
| El aviso del permiso salía cortado: la clase `.aviso.cinta` heredaba la altura de la cinta métrica | Pase mecánico, captura en celular | Las variantes se renombraron a `amarillo` |
| En celular, la tabla de resultados escondía las tallas 34 y 36 y el editor no cabía | Pase mecánico, captura en 390 px | Columnas fijas, letra más chica y textos que se acomodan en celular |
| El enlace roto contaba 2 alertas (el anunciador de rutas de Next también es una alerta) | Pase mecánico | La prueba ahora revisa el texto |
| Persona test, 2 rondas, 20 confusiones | `docs/PERSONA.md` | 18 se arreglaron; 1 queda como límite conocido |

## Lo que no se construyó

Cuentas, base de datos, medir el cuerpo con la cámara, leer la tabla directo de la página de la tienda, aportar etiquetas a un registro público con moderación, verificar etiquetas midiendo la prenda, el calendario de compromisos del equipo (aquí solo aparece la línea "es un compromiso nuevo"), el piloto con 10 personas del Operator y cualquier cosa para tiendas.

## Cierre de sesión

- **Sesión 1:** packet, motor (86 aserciones), API, cinco pasos, la regla, pase mecánico, persona test en dos rondas y dos deploys.
- **Primer paso de mañana:** con la llave real en Vercel, leer 5 capturas de tablas reales de tiendas mexicanas y anotar cuántos números se corrigen y cuántas tablas son de cuerpo y no de prenda. Esa es la condición para parar del packet (sección 12).
