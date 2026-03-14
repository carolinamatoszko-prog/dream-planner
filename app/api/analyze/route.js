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
  "categoryLabel": "nome curto da categoria do sonho (ex: Viagem Internacional, Empreendedorismo, etc.)",
  "categoryIcon": "um único emoji representativo",
  "costMin": número inteiro em euros (custo mínimo realista),
  "costMax": número inteiro em euros (custo máximo realista),
  "months": número decimal representando meses de preparação (usa frações: 0.07 para 2 horas, 0.25 para 1 semana, 0.5 para 2 semanas, 1 para 1 mês, 6 para 6 meses, 24 para 2 anos),
  "costNote": "frase curta e motivadora sobre o custo (max 8 palavras)",
  "timeNote": "frase curta sobre o tempo (max 8 palavras)",
  "steps": [
    "Passo prático 1 detalhado e específico para ESTE sonho",
    "Passo prático 2 detalhado e específico para ESTE sonho",
    "Passo prático 3 detalhado e específico para ESTE sonho"
  ]
}

Regras:
- Custos REALISTAS para o Brasil/França em 2025
- Passos ESPECÍFICOS para este sonho, não genéricos
- Responde em português do Brasil
- Responde APENAS com o JSON, sem mais nada

Calibração de "months" — valores de referência obrigatórios:
- Fazer um bolo, cozinhar: months: 0.07  (≈ 2 horas)
- Tarefa de um dia: months: 0.03  (≈ 1 dia)
- 1 semana de preparação: months: 0.25
- 2 semanas: months: 0.5
- 1 mês: months: 1
- 6 meses: months: 6
- 1 ano: months: 12
- 2 anos: months: 24`;

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

    const months = parseFloat(parsed.months) || 1;

    return Response.json({
      categoryLabel: parsed.categoryLabel,
      categoryIcon: parsed.categoryIcon,
      cost: costFormatted,
      costNote: parsed.costNote,
      months,
      timeNote: parsed.timeNote,
      steps: parsed.steps,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return Response.json({ error: "Erro interno ao processar o sonho." }, { status: 500 });
  }
}
