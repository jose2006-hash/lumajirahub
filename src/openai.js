// ================================================================
// OPENAI CONFIG
// ================================================================
let _runtimeApiKey = "";
export const setRuntimeApiKey = (k) => { _runtimeApiKey = k; };
export const getApiKey = () => _runtimeApiKey || import.meta.env.VITE_OPENAI_API_KEY || "";

export async function callOpenAI(systemPrompt, messages) {
  const key = getApiKey();
  if (!key) throw new Error("NO_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
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
