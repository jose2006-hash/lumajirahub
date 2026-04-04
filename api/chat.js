export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;

  // Debug temporal — muestra si la key existe (sin revelarla completa)
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY no configurada en Vercel" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || "gpt-4o",
        max_tokens: body.max_tokens || 1000,
        messages: body.messages || [],
      }),
    });

    const data = await response.json();

    // Si OpenAI devuelve error, pasarlo al cliente para debug
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Error de OpenAI",
        code: data?.error?.code,
        type: data?.error?.type,
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}