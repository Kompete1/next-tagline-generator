"use client";

import { useMemo, useState } from "react";
import styles from "./TaglineGenerator.module.css";

type Inputs = {
  description: string;
  tone: string;
  audience: string;
};

type ApiResponse = {
  taglines: string[];
  metaDescription: string;
  error?: string;
};

const tones = ["Professional", "Playful", "Premium", "Bold"] as const;
const audiences = [
  "General",
  "Motorsport fans",
  "Finance/banking",
  "Developers",
] as const;

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

  const isValid = description.trim().length >= 20;
  const helperText = useMemo(() => {
    const remaining = 20 - description.trim().length;
    if (remaining <= 0) {
      return "Looks good. Ready to generate.";
    }
    return `Add ${remaining} more character${remaining === 1 ? "" : "s"} to continue.`;
  }, [description]);

  const handleGenerate = async (inputs: Inputs) => {
    if (!inputs.description.trim()) {
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/tagline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | ApiResponse
          | null;
        setError(
          data?.error || "Something went wrong. Please try again in a moment."
        );
        return;
      }

      const data = (await response.json()) as ApiResponse;
      setTaglines(Array.isArray(data.taglines) ? data.taglines : []);
      setMeta(typeof data.metaDescription === "string" ? data.metaDescription : "");
      setLastInputs(inputs);
    } catch {
      setError("We couldn't reach the server. Check your connection and retry.");
    } finally {
      setIsLoading(false);
    }
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
