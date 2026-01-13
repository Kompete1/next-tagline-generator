"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./TaglineGenerator.module.css";

type Inputs = {
  description: string;
  tone: string;
  audience: string;
};

const tones = ["Professional", "Playful", "Premium", "Bold"] as const;
const audiences = [
  "General",
  "Motorsport fans",
  "Finance/banking",
  "Developers",
] as const;

const toneOpeners: Record<string, string[]> = {
  Professional: ["Precision for", "Built to help", "A smarter edge for"],
  Playful: ["Make room for", "Spark some fun for", "Turn up the energy for"],
  Premium: ["Elevate every mile for", "Designed with finesse for", "The luxury choice for"],
  Bold: ["Unleash power for", "Drive harder with", "Make a statement for"],
};

const audienceFocus: Record<string, string> = {
  General: "everyday brands",
  "Motorsport fans": "race-day stories",
  "Finance/banking": "modern finance teams",
  Developers: "product builders",
};

const clampMeta = (value: string) =>
  value.length <= 160 ? value : value.slice(0, 157).trimEnd() + "...";

const buildTaglines = (inputs: Inputs) => {
  const { tone, audience, description } = inputs;
  const openers = toneOpeners[tone] ?? toneOpeners.Professional;
  const focus = audienceFocus[audience] ?? "ambitious teams";
  const trimmed = description.trim().replace(/\.$/, "");

  const taglines = [
    `${openers[0]} ${focus}.`,
    `${openers[1]} ${focus}.`,
    `${openers[2]} ${focus}.`,
    `${trimmed} — tuned for ${focus}.`,
    `${tone} impact for ${focus}.`,
  ];

  const meta = clampMeta(
    `${trimmed}. Generate five fresh taglines in a ${tone.toLowerCase()} voice for ${focus}.`
  );

  return { taglines, meta };
};

export default function TaglineGenerator() {
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("Professional");
  const [audience, setAudience] =
    useState<(typeof audiences)[number]>("General");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [taglines, setTaglines] = useState<string[]>([]);
  const [meta, setMeta] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastInputs, setLastInputs] = useState<Inputs | null>(null);
  const timerRef = useRef<number | null>(null);

  const isValid = description.trim().length >= 20;
  const helperText = useMemo(() => {
    const remaining = 20 - description.trim().length;
    if (remaining <= 0) {
      return "Looks good. Ready to generate.";
    }
    return `Add ${remaining} more character${remaining === 1 ? "" : "s"} to continue.`;
  }, [description]);

  const handleGenerate = (inputs: Inputs) => {
    if (!inputs.description.trim()) {
      return;
    }
    setError("");
    setIsLoading(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      const output = buildTaglines(inputs);
      setTaglines(output.taglines);
      setMeta(output.meta);
      setLastInputs(inputs);
      setIsLoading(false);
    }, 500);
  };

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setError("Copy failed. Please select the text and copy manually.");
    }
  };

  const currentInputs: Inputs = { description, tone, audience };
  const canRegenerate = Boolean(lastInputs);

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.kicker}>Tagline Generator v1</div>
          <h1>Shape a voice that sounds ready for launch.</h1>
          <p>
            Draft five brand-ready taglines and a concise meta description in a
            tone that fits your audience.
          </p>
        </header>

        <section className={styles.panel}>
          <div className={styles.form}>
            <label className={styles.label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              placeholder="Describe the product, brand, or campaign in one or two sentences."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={() => setTouched(true)}
              rows={5}
              minLength={20}
              required
            />
            <div
              className={`${styles.helper} ${
                touched && !isValid ? styles.helperError : ""
              }`}
              role={touched && !isValid ? "alert" : undefined}
            >
              {helperText}
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="tone">
                  Tone
                </label>
                <select
                  id="tone"
                  className={styles.select}
                  value={tone}
                  onChange={(event) =>
                    setTone(event.target.value as (typeof tones)[number])
                  }
                >
                  {tones.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="audience">
                  Audience
                </label>
                <select
                  id="audience"
                  className={styles.select}
                  value={audience}
                  onChange={(event) =>
                    setAudience(event.target.value as (typeof audiences)[number])
                  }
                >
                  {audiences.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!isValid || isLoading}
                onClick={() => handleGenerate(currentInputs)}
              >
                {isLoading ? "Generating..." : "Generate taglines"}
              </button>
              <button
                type="button"
                className={styles.ghostButton}
                disabled={!canRegenerate || isLoading}
                onClick={() => lastInputs && handleGenerate(lastInputs)}
              >
                Regenerate
              </button>
            </div>
          </div>

          <aside className={styles.results}>
            <div className={styles.resultsHeader}>
              <h2>Results</h2>
              <span className={styles.badge}>
                {taglines.length ? "Ready" : "Awaiting input"}
              </span>
            </div>

            <div className={styles.banner} role="status">
              {error || "No errors yet. You are good to go."}
            </div>

            <div className={styles.cards}>
              {(taglines.length ? taglines : Array.from({ length: 5 })).map(
                (item, index) => {
                  const value =
                    typeof item === "string"
                      ? item
                      : "Generated taglines will appear here.";
                  const id = `tagline-${index}`;
                  return (
                    <div key={id} className={styles.card}>
                      <div className={styles.cardText}>{value}</div>
                      <button
                        type="button"
                        className={styles.copyButton}
                        onClick={() => handleCopy(value, id)}
                        disabled={!taglines.length}
                      >
                        {copiedId === id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  );
                }
              )}
            </div>

            <div className={styles.meta}>
              <div className={styles.metaHeader}>
                <h3>Meta description</h3>
                <span className={styles.metaCount}>
                  {meta.length}/160
                </span>
              </div>
              <p>{meta || "Your meta description will show up here."}</p>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => handleCopy(meta, "meta")}
                disabled={!meta}
              >
                {copiedId === "meta" ? "Copied" : "Copy"}
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
