// ================================================================
// OPENAI — llama al proxy serverless de Vercel (evita CORS)
// ================================================================
let _runtimeApiKey = "";
export const setRuntimeApiKey = (k) => { _runtimeApiKey = k; };
export const getApiKey = () => _runtimeApiKey;

export async function callOpenAI(systemPrompt, messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Sin respuesta.";
}
