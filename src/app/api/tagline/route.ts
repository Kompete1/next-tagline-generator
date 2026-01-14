const tones = ["Professional", "Playful", "Premium", "Bold"] as const;
const audiences = [
  "General",
  "Motorsport fans",
  "Finance/banking",
  "Developers",
] as const;

type Tone = (typeof tones)[number];
type Audience = (typeof audiences)[number];

const toneModifiers: Record<Tone, string[]> = {
  Professional: ["precise", "focused", "clear", "trusted"],
  Playful: ["bright", "fun", "lively", "sparked"],
  Premium: ["refined", "elevated", "polished", "lux"],
  Bold: ["fearless", "powerful", "unmistakable", "fast"],
};

const toneVerbs: Record<Tone, string[]> = {
  Professional: ["deliver", "align", "streamline", "build"],
  Playful: ["ignite", "spark", "flip", "charge"],
  Premium: ["elevate", "polish", "distill", "curate"],
  Bold: ["unleash", "charge", "push", "own"],
};

const audienceNouns: Record<Audience, string[]> = {
  General: ["brands", "teams", "products", "stories"],
  "Motorsport fans": ["race days", "pit crews", "track moments", "fans"],
  "Finance/banking": ["portfolios", "finance teams", "banks", "trust"],
  Developers: ["builds", "developers", "products", "roadmaps"],
};

const audienceShort: Record<Audience, string> = {
  General: "general audiences",
  "Motorsport fans": "motorsport fans",
  "Finance/banking": "finance teams",
  Developers: "developers",
};

const clamp = (value: string, max: number) =>
  value.length <= max ? value : value.slice(0, max - 3).trimEnd() + "...";

const clampWords = (value: string, maxWords: number) => {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= maxWords) {
    return value;
  }
  return words.slice(0, maxWords).join(" ");
};

const hashSeed = (value: string) =>
  value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) || 1;

const createRng = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T,>(items: T[], rng: () => number) =>
  items[Math.floor(rng() * items.length)];

const buildTaglines = (description: string, tone: Tone, audience: Audience) => {
  const rng = createRng(hashSeed(`${description}-${tone}-${audience}`));
  const modifiers = toneModifiers[tone];
  const verbs = toneVerbs[tone];
  const nouns = audienceNouns[audience];

  const templates = [
    () => `${pick(modifiers, rng)} ${pick(nouns, rng)}`,
    () => `${pick(verbs, rng)} ${pick(nouns, rng)} faster`,
    () => `${pick(modifiers, rng)} wins for ${pick(nouns, rng)}`,
    () => `Built to ${pick(verbs, rng)} ${pick(nouns, rng)}`,
    () => `${pick(nouns, rng)} with ${pick(modifiers, rng) + " edge"}`,
    () => `${pick(verbs, rng)} what ${pick(nouns, rng)} demand`,
    () => `A ${pick(modifiers, rng)} pulse for ${pick(nouns, rng)}`,
    () => `${pick(modifiers, rng)} momentum for ${pick(nouns, rng)}`,
  ];

  const results = new Set<string>();
  let attempts = 0;

  while (results.size < 5 && attempts < 30) {
    const candidate = templates[attempts % templates.length]();
    const trimmed = clampWords(candidate.replace(/\s+/g, " ").trim(), 10);
    results.add(trimmed);
    attempts += 1;
  }

  return Array.from(results).slice(0, 5);
};

const buildMeta = (description: string, tone: Tone, audience: Audience) => {
  const trimmed = description.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  const summary = clamp(trimmed, 100);
  const meta = `${summary}. ${tone} taglines for ${audienceShort[audience]}.`;
  return clamp(meta, 160);
};

const parseTone = (value: unknown): Tone =>
  tones.includes(value as Tone) ? (value as Tone) : "Professional";

const parseAudience = (value: unknown): Audience =>
  audiences.includes(value as Audience) ? (value as Audience) : "General";

export async function POST(request: Request) {
  let payload: { description?: string; tone?: string; audience?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
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
  const taglines = buildTaglines(description, tone, audience);
  const metaDescription = buildMeta(description, tone, audience);

  return Response.json({ taglines, metaDescription }, { status: 200 });
}
