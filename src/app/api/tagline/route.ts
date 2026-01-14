import OpenAI from "openai";

const tones = ["Professional", "Playful", "Premium", "Bold"] as const;
const audiences = [
  "General",
  "Motorsport fans",
  "Finance/banking",
  "Developers",
] as const;

type Tone = (typeof tones)[number];
type Audience = (typeof audiences)[number];

const parseTone = (value: unknown): Tone =>
  tones.includes(value as Tone) ? (value as Tone) : "Professional";

const parseAudience = (value: unknown): Audience =>
  audiences.includes(value as Audience) ? (value as Audience) : "General";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type OutputShape = {
  taglines: string[];
  metaDescription: string;
};

const clamp = (value: string, max: number) =>
  value.length <= max ? value : value.slice(0, max - 3).trimEnd() + "...";

const sanitizeTagline = (value: string) => {
  const cleaned = value
    .replace(/^[\s"']+/, "")
    .replace(/^[\d]+\s*[\.\)\-:]+/, "")
    .replace(/[\s"']+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ");
  return words.length > 10 ? words.slice(0, 10).join(" ") : cleaned;
};

const extractJson = (value: string) => {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return value.slice(start, end + 1);
};

const createResponse = async (model: string, prompt: string) =>
  client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "You generate marketing copy as structured JSON.",
              "Rules:",
              "- Produce 5 taglines, each short (around 10 words max).",
              "- No numbering, no quotes, no bullet characters.",
              "- Make each tagline distinct, avoid near-duplicates.",
              "- Provide a meta description 160 characters or fewer.",
              "Output only a JSON object with keys taglines and metaDescription.",
              "Do not wrap in markdown or code fences.",
            ].join("\n"),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
    text: {
      format: { type: "json_object" },
    },
  });

const requestTaglines = async (prompt: string) => {
  try {
    return await createResponse("gpt-5-mini", prompt);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.code === "model_not_found" || error.status === 403) {
        return createResponse("gpt-4o-mini", prompt);
      }
    }
    throw error;
  }
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Server configuration issue. Missing API key." },
      { status: 500 }
    );
  }

  let payload: { description?: string; tone?: string; audience?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const description = payload.description?.toString() ?? "";
  if (description.trim().length < 20) {
    return Response.json(
      { error: "Description must be at least 20 characters." },
      { status: 400 }
    );
  }

  const tone = parseTone(payload.tone);
  const audience = parseAudience(payload.audience);
  const prompt = [
    `Description: ${description.trim()}`,
    `Tone: ${tone}`,
    `Audience: ${audience}`,
    "Return the JSON only.",
  ].join("\n");

  try {
    const response = await requestTaglines(prompt);
    const raw = response.output_text?.trim();
    if (!raw) {
      return Response.json(
        { error: "We could not generate taglines right now." },
        { status: 502 }
      );
    }

    let output: OutputShape | null = null;
    try {
      output = JSON.parse(raw) as OutputShape;
    } catch {
      const extracted = extractJson(raw);
      if (extracted) {
        try {
          output = JSON.parse(extracted) as OutputShape;
        } catch {
          output = null;
        }
      }
    }

    const taglines = Array.isArray(output?.taglines)
      ? output?.taglines.map(sanitizeTagline).filter(Boolean).slice(0, 5)
      : [];
    const metaDescription =
      typeof output?.metaDescription === "string"
        ? clamp(output.metaDescription.trim(), 160)
        : "";

    if (!taglines.length || !metaDescription) {
      return Response.json(
        { error: "We could not generate taglines right now." },
        { status: 502 }
      );
    }

    return Response.json({ taglines, metaDescription }, { status: 200 });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI tagline generation failed", {
        status: error.status,
        code: error.code,
        message: error.message,
      });
      if (error.code === "invalid_api_key") {
        return Response.json(
          { error: "Invalid API key. Please check your key and try again." },
          { status: 502 }
        );
      }
      if (error.code === "insufficient_quota") {
        return Response.json(
          { error: "OpenAI quota exceeded. Please check your billing." },
          { status: 502 }
        );
      }
      if (error.code === "rate_limit_exceeded") {
        return Response.json(
          { error: "Too many requests. Please try again in a moment." },
          { status: 502 }
        );
      }
    } else {
      console.error("OpenAI tagline generation failed", error);
    }
    return Response.json(
      { error: "Generation failed. Please try again in a moment." },
      { status: 502 }
    );
  }
}
