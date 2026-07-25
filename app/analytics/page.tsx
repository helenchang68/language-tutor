"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LANGUAGES, LanguageCode } from "@/lib/languages";

type Counts = Record<string, Record<string, number>>;

const CATEGORY_LABELS: Record<string, string> = {
  grammar: "Grammar",
  word_order: "Word order",
  vocabulary: "Vocabulary",
  particles_or_classifiers: "Particles / classifiers",
  pronunciation_or_tone: "Pronunciation / tone",
  other: "Other",
};

function BarPanel({
  title,
  color,
  counts,
}: {
  title: string;
  color: string;
  counts: Record<string, number> | undefined;
}) {
  const entries = Object.entries(counts ?? {}).sort((a, b) => b[1] - a[1]);
  const max = entries.length > 0 ? entries[0][1] : 0;

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12, color: "#0b0b0b" }}>{title}</h2>
      {entries.length === 0 ? (
        <p style={{ color: "#898781", fontSize: 14 }}>No mistakes recorded yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map(([category, count]) => (
            <div key={category} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 150,
                  fontSize: 13,
                  color: "#52514e",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {CATEGORY_LABELS[category] ?? category}
              </div>
              <div
                style={{
                  flex: 1,
                  background: "#e1e0d9",
                  borderRadius: 4,
                  height: 16,
                }}
              >
                <div
                  style={{
                    height: 16,
                    width: `${(count / max) * 100}%`,
                    minWidth: 8,
                    background: color,
                    borderRadius: "0 4px 4px 0",
                  }}
                />
              </div>
              <div
                style={{
                  width: 24,
                  fontSize: 13,
                  color: "#52514e",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<{ aggregate: Counts; personal: Counts } | null>(null);
  const [languageFilter, setLanguageFilter] = useState<LanguageCode | "all">("all");

  useEffect(() => {
    setUserId(localStorage.getItem("languageTutorUserId"));
  }, []);

  useEffect(() => {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    fetch(`/api/analytics${params}`)
      .then((res) => res.json())
      .then(setData);
  }, [userId]);

  function countsFor(counts: Counts): Record<string, number> {
    if (languageFilter === "all") {
      const merged: Record<string, number> = {};
      for (const langCounts of Object.values(counts)) {
        for (const [category, count] of Object.entries(langCounts)) {
          merged[category] = (merged[category] ?? 0) + count;
        }
      }
      return merged;
    }
    return counts[languageFilter] ?? {};
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 24 }}>Mistake Analytics</h1>
        <Link href="/" style={{ fontSize: 14, color: "#1976d2" }}>
          Back to practice
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 14, color: "#52514e", marginRight: 8 }}>Language:</label>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value as LanguageCode | "all")}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
        >
          <option value="all">All languages</option>
          {Object.values(LANGUAGES).map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {!data ? (
        <p style={{ color: "#898781" }}>Loading...</p>
      ) : (
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <BarPanel title="Your mistakes" color="#2a78d6" counts={countsFor(data.personal)} />
          <BarPanel title="Everyone's mistakes" color="#eb6834" counts={countsFor(data.aggregate)} />
        </div>
      )}
    </main>
  );
}
