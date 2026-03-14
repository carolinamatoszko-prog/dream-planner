// app/api/analyze/route.js
// Serverless Function — executa no servidor da Vercel, não no browser.
// A variável OPENAI_API_KEY nunca chega ao cliente.

export async function POST(request) {
  const { dream } = await request.json();

  if (!dream || dream.trim().length === 0) {
    return Response.json({ error: "Texto do sonho em falta." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Chave de API não configurada. Adiciona OPENAI_API_KEY nas variáveis de ambiente da Vercel." },
      { status: 500 }
    );
  }

  const prompt = `És um consultor financeiro e de vida especializado em ajudar pessoas a concretizar os seus sonhos. Analisa o seguinte sonho e responde EXCLUSIVAMENTE com um objeto JSON válido, sem texto adicional, sem markdown, sem backticks.

Sonho: "${dream}"

Responde com este JSON exato:
{
  "categoryLabel": "nome curto da categoria do sonho (ex: Viagem Internacional, Empreendedorismo, Imóvel Próprio, etc.)",
  "categoryIcon": "um único emoji representativo",
  "costMin": número inteiro em euros (custo mínimo realista),
  "costMax": número inteiro em euros (custo máximo realista),
  "months": número inteiro de meses necessários para preparação,
  "costNote": "frase curta e motivadora sobre o custo (max 8 palavras)",
  "timeNote": "frase curta sobre o tempo (max 8 palavras)",
  "steps": [
    "Passo prático 1 detalhado e específico para ESTE sonho",
    "Passo prático 2 detalhado e específico para ESTE sonho",
    "Passo prático 3 detalhado e específico para ESTE sonho"
  ]
}

Regras:
- Os valores de custo devem ser REALISTAS para Portugal/Europa em 2025
- Os passos devem ser ESPECÍFICOS para este sonho exato, não genéricos
- Responde em português europeu
- Responde APENAS com o JSON, sem mais nada`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 800,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error("OpenAI error:", err);
      return Response.json({ error: "Erro ao contactar a OpenAI." }, { status: 502 });
    }

    const data = await openaiRes.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const costFormatted =
      parsed.costMin === parsed.costMax
        ? parsed.costMin.toLocaleString("pt-PT") + " €"
        : parsed.costMin.toLocaleString("pt-PT") + " – " + parsed.costMax.toLocaleString("pt-PT") + " €";

    return Response.json({
      categoryLabel: parsed.categoryLabel,
      categoryIcon: parsed.categoryIcon,
      cost: costFormatted,
      costNote: parsed.costNote,
      months: parsed.months,
      timeNote: parsed.timeNote,
      steps: parsed.steps,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return Response.json({ error: "Erro interno ao processar o sonho." }, { status: 500 });
  }
}
