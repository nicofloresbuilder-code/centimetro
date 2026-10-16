# PERSONA TEST: CENTÍMETRO

**Método:** abrí un chat nuevo por persona y le di una persona construida con lo que sabemos del usuario: compra ropa en línea desde el celular, ya devolvió prendas por talla y no confía en las apps. Le pasé capturas de cada pantalla en orden, a 390 px de ancho como en un celular, y le pedí que intentara la tarea narrando en voz alta: dónde duda, qué no entiende y dónde se iría. Registré cada confusión, arreglé las peores y repetí la prueba.

## Las personas

| | Ale | Doña Lupe |
|---|---|---|
| Quién es | 29 años, CDMX. Compra jeans y playeras en tiendas distintas, casi siempre en el camión | 52 años, Iztapalapa. Vende comida afuera del metro. Le compra pantalones a su hijo por Marketplace y Mercado Libre |
| Con qué mide | Solo una regla escolar de 30 cm | Una cinta de costurera; sabe qué son "cintura" y "cadera" |
| Cómo se rinde | Hojea; si algo le pide mucho, se va sin decir nada | Lee despacio; las palabras en inglés y lo rojo la asustan, y se va sin decir nada |
| Tarea | "Quiero saber qué talla pedir de unos jeans que vi en línea, sin adivinar." | "Quiero ver qué talla le pido a mi hijo usando un pantalón suyo que le queda bien." |

## Ronda 1: dónde se perdieron

| # | Pantalla | Qué pasó | Severidad | Persona |
|---|---|---|---|---|
| 1 | Todas | La etiqueta roja "IA: no configurada" parecía un error antes de empezar | Alta | Las dos |
| 2 | Tu prenda | "Cintura (a lo ancho)": Lupe mide dándole la vuelta y habría puesto el doble | Alta | Lupe |
| 3 | Tu prenda | "Entrepierna": Lupe le dice "tiro" o "largo" | Media | Lupe |
| 4 | Tu prenda | Con una regla de 30 cm no alcanza para medir de lado a lado | Media | Ale |
| 5 | La tabla | El recuadro "Usar IA (Gemini)… se manda a Google" y luego "la IA no está configurada": desconfianza y contradicción | Alta | Las dos |
| 6 | La tabla | Cuatro botones del mismo peso; no sabían cuál era el siguiente. **Aquí las dos se habrían ido** | Alta | Las dos |
| 7 | La tabla | "¿Medidas de la prenda o del cuerpo?" No sabían contestar | Alta | Las dos |
| 8 | La tabla | La casilla "Los contornos vienen a lo ancho" no se entendía | Media | Las dos |
| 9 | La tabla | "Revisé cada número" lo palomean sin revisar | Media | Las dos |
| 10 | Comparar | "Parte interesada", "EJEMPLO INVENTADO" y los números en rojo parecían errores | Media | Las dos |
| 11 | Comparar | "Plantilla sin IA (sin llave)": jerga encima del texto que sí servía | Media | Lupe |
| 12 | Pausa | Pedía precio, pagos y pegar la política: se sintió como un trámite | Media | Las dos |
| 13 | Etiqueta | "JSON", "agente", "formato", "v0.1": no tienen nada que ver con su objetivo | Media | Las dos |
| 14 | Etiqueta | La cuenta en letra de máquina con "0 de 0" parecía un error | Baja | Ale |

**Peor problema: el paso 2.** Las dos llegaban a la pantalla de la tabla y veían IA, Gemini, Google, un aviso de que no funcionaba y cuatro botones iguales. Ahí se iban sin decir nada.

### Lo que cambié después de la ronda 1

- **Paso 2 con un solo camino.** Si hay IA, hay un solo botón principal: "Subir captura de la tabla". Si no hay IA, ese botón no aparece y el principal es "Copiar los números de la tabla". Lo demás quedó como botones chicos.
- **El permiso se pide al momento de leer**, con una frase clara: "tu foto se manda a la IA de Google. No se guarda" y los botones [Sí, leerla] [No, la copio yo]. Antes era una casilla con un párrafo.
- Se quitó la etiqueta roja de IA de arriba.
- "A lo ancho" ahora dice "de lado a lado", con "No le des la vuelta: nosotros la duplicamos". "Contorno" ahora dice "Vuelta completa". La ayuda sugiere medir por partes si la regla es corta.
- "Entrepierna" se cambió por "Largo interior".
- "¿Prenda o cuerpo?" ahora pregunta "¿Quién midió: la ropa o a una persona?", y explica qué buscar en la tabla.
- **Nuevo:** si una cintura o cadera mide menos de 55 cm, la app pregunta si la tabla viene de lado a lado.
- La pausa ahora se llama "Antes de pagar" y es más corta: la política de devolución quedó como opcional y escondida.
- "Plantilla sin IA" ahora dice "Texto automático". En la etiqueta, "JSON" y "formato público" quedaron en letra chica, para programadores.

## Ronda 2: Doña Lupe otra vez

**Resueltas:** 1, 2, 4 (el ejemplo), 5, 6, 7, 8, 11, 12 y 13. Ya no abandona en el paso 2.

**Siguen o aparecieron:**

| Qué | Severidad | Qué hice |
|---|---|---|
| Copiar 15 números a mano en el celular si dice "No, la copio yo" (**nuevo peor problema**) | Alta | El camino a mano empieza con 2 filas vacías: "Solo copia las tallas que estás pensando (mínimo 2)". Son 4 números en lugar de 15 |
| La captura de ejemplo viene en inglés y en pulgadas y no le dice que se convierte | Media | Debajo de la foto ahora dice: "Si viene en inglés o en pulgadas, no importa: lo pasamos a centímetros" |
| "La tienda no da la largo interior" (error de concordancia) | Baja | Se agregaron artículos a cada medida: "el largo interior", "la cintura" |
| "Guardar mi decisión" y "Guardar solo la decisión" se veían iguales | Media | Se quitó el segundo botón |
| Lo rojo en la comparación todavía asusta | Media | Las etiquetas de la fuente y del ejemplo ahora son grises |
| "Tiro" es otra medida en costura | Media | La ayuda ahora dice "No es el tiro" |
| La casilla "Ya comparé cada número" se palomea sin revisar | Media | **No se arregló.** Una casilla no obliga a revisar. Por eso la app también cuenta las correcciones y lo dice en el resultado. Queda como límite conocido |

**Resultado:** las dos personas llegan a la talla más parecida en el paso 3. Ale volvería a usarla "si la tienda ya trae la tabla cargada". Esa respuesta es otro argumento para la regla en cm.
