// Vercel Serverless Function
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(405).send("Use POST");
  }

  try {
    const { difficulty = "easy", numOptions = 4, avoidCategories = [] } = req.body || {};

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are a trivia generator. Output ONLY JSON with keys:
category (string), question (string), options (string[${numOptions}]),
correctIndex (integer 0..${numOptions - 1}), explanation (string).
Family-friendly, globally relevant, concise.`;

    const user = `Make ONE multiple-choice question. Difficulty: ${difficulty}.
Avoid categories: ${Array.isArray(avoidCategories) && avoidCategories.length ? avoidCategories.join(", ") : "none"}.
Ensure exactly ${numOptions} options and exactly one correctIndex.`;

    const r = await client.responses.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_output_tokens: 400
    });

    const json = JSON.parse(r.output_text);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.json({
      id: crypto.randomUUID(),
      category: json.category,
      difficulty,
      question: json.question,
      options: (json.options || []).slice(0, Number(numOptions) || 4),
      correctIndex: json.correctIndex,
      explanation: json.explanation ?? null
    });
  } catch (err) {
    console.error(err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };
