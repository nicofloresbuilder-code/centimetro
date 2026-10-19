/* Solo servidor: llamadas a Gemini y límite de uso.
   La llave GEMINI_API_KEY vive en Vercel y nunca llega al navegador. */

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const PREFERIDO = process.env.GEMINI_MODEL || "gemini-flash-latest";

export function hayLlave(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

type Parte = { text: string } | { inlineData: { mimeType: string; data: string } };

/* Lección de la semana 9: Google retira modelos (404) y a veces se satura (503).
   Si el modelo falla, se pide la lista de modelos Flash disponibles y se usa otro. */
let modeloVigente: string | null = null;

/* Bug del deploy 3: gemini-flash-latest respondió 503 y el "plan B" eligió un
   modelo raro (gemini-omni-1.1-flash) sin cuota gratuita (429). Ahora el plan B
   solo usa modelos Flash con versión normal ("gemini-2.5-flash", "gemini-3-flash"),
   del más nuevo al más viejo, y al final las versiones "lite". */
const version = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);

async function modelosRespaldo(llave: string, evitar: string): Promise<string[]> {
  try {
    const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": llave } });
    if (!r.ok) return ["gemini-2.5-flash", "gemini-2.5-flash-lite"].filter((m) => m !== evitar);
    const j = await r.json();
    const nombres: string[] = (j?.models ?? [])
      .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: { name: string }) => String(m.name).replace(/^models\//, ""));
    const normales = nombres.filter((n) => /^gemini-\d+(\.\d+)?-flash$/.test(n)).sort((x, y) => version(y) - version(x));
    const lite = nombres.filter((n) => /^gemini-\d+(\.\d+)?-flash-lite$/.test(n)).sort((x, y) => version(y) - version(x));
    return [...normales, ...lite].filter((n) => n !== evitar);
  } catch {
    return [];
  }
}

/* Bug del deploy 2: con la captura, gemini-flash-latest tardó más de 28 s
   ("AbortError") porque el modelo "piensa" antes de contestar. Ahora se pide
   pensar poco, cada intento tiene su propio límite de tiempo y, si el modelo
   no acepta la configuración de pensamiento (400), se repite sin ella. */
function configPensamiento(modelo: string): Record<string, unknown> {
  if (/2\.5-flash/.test(modelo)) return { thinkingConfig: { thinkingBudget: 0 } };
  if (/^gemini-(3|flash-latest)/.test(modelo)) return { thinkingConfig: { thinkingLevel: "low" } };
  return {};
}

async function llamar(modelo: string, llave: string, sistema: string, partes: Parte[], ms: number, pensamiento = true): Promise<Response> {
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${BASE}/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": llave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: partes }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 4096,
          ...(pensamiento ? configPensamiento(modelo) : {}),
        },
      }),
      signal: ctrl.signal,
    });
    if (r.status === 400 && pensamiento && Object.keys(configPensamiento(modelo)).length) {
      clearTimeout(reloj);
      return llamar(modelo, llave, sistema, partes, ms, false);
    }
    return r;
  } catch (e) {
    // Tiempo agotado o red caída: se responde como "saturado" para probar otro modelo.
    console.error(`Gemini (${modelo}) no respondió:`, (e as Error).name);
    return new Response(null, { status: 504 });
  } finally {
    clearTimeout(reloj);
  }
}

/** Llama a Gemini pidiendo JSON. Devuelve { datos, modelo } o null si algo falla. */
export async function gemini(sistema: string, partes: Parte[]): Promise<{ datos: unknown; modelo: string } | null> {
  const llave = process.env.GEMINI_API_KEY;
  if (!llave) return null;
  const inicio = Date.now();
  const queda = () => 55000 - (Date.now() - inicio);
  try {
    let modelo = modeloVigente ?? PREFERIDO;
    let r = await llamar(modelo, llave, sistema, partes, 25000);
    if ([429, 500, 503].includes(r.status) && queda() > 15000) {
      await new Promise((ok) => setTimeout(ok, 1500));
      r = await llamar(modelo, llave, sistema, partes, Math.min(25000, queda() - 2000));
    }
    if ([400, 404, 429, 500, 503, 504].includes(r.status) && queda() > 8000) {
      const otros = (await modelosRespaldo(llave, modelo)).slice(0, 3);
      for (const otro of otros) {
        if (queda() < 8000) break;
        console.error(`Gemini respondió ${r.status} con ${modelo}; se intenta con ${otro}`);
        modelo = otro;
        r = await llamar(modelo, llave, sistema, partes, Math.min(25000, queda() - 2000));
        if (r.ok) break;
      }
    }
    if (!r.ok) {
      console.error("Gemini respondió", r.status, "con", modelo);
      return null;
    }
    modeloVigente = modelo;
    const j = await r.json();
    const texto: string | undefined = j?.candidates?.[0]?.content?.parts
      ?.filter((p: { thought?: boolean }) => !p.thought)
      .map((p: { text?: string }) => p.text ?? "")
      .join("");
    if (!texto) return null;
    return { datos: JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, "")), modelo };
  } catch (e) {
    console.error("Gemini falló:", (e as Error).name);
    return null;
  }
}

/* Límite por IP en memoria de cada instancia: suficiente para un prototipo. */
const visitas = new Map<string, number[]>();
export function permitido(ip: string, max = 20, ventanaMs = 10 * 60 * 1000): boolean {
  const ahora = Date.now();
  const lista = (visitas.get(ip) ?? []).filter((t) => ahora - t < ventanaMs);
  if (lista.length >= max) return false;
  lista.push(ahora);
  visitas.set(ip, lista);
  return true;
}

export function ipDe(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
