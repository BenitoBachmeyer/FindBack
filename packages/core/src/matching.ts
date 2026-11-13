import { Report } from "./model";
export const normalize = (text: string) =>
  text
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
const words = (text: string) =>
  new Set(
    normalize(text)
      .split(/[^a-z0-9]+/)
      .filter(
        (w) =>
          w.length > 2 &&
          ![
            "mit",
            "und",
            "der",
            "die",
            "das",
            "eine",
            "einen",
            "einer",
            "am",
            "im",
            "ist",
            "auf",
          ].includes(w),
      ),
  );
export function scoreMatch(
  a: Report,
  b: Report,
): { score: number; reasons: string[] } | null {
  if (
    a.kind === b.kind ||
    a.ownerId === b.ownerId ||
    a.status !== "open" ||
    b.status !== "open" ||
    a.category !== b.category
  )
    return null;
  const lost = a.kind === "lost" ? a : b,
    found = a.kind === "found" ? a : b;
  const delta = Date.parse(found.occurredAt) - Date.parse(lost.occurredAt);
  if (delta < -6 * 3600000 || delta > 30 * 86400000) return null;
  const aw = words(a.title + " " + a.description),
    bw = words(b.title + " " + b.description);
  const shared = [...aw].filter((w) => bw.has(w));
  const overlap = shared.length / Math.max(1, Math.min(aw.size, bw.size));
  // Category alone must never generate a match. Photos are not analyzed.
  if (shared.length < 1 || overlap < 0.15) return null;
  let score = 25 + Math.round(40 * overlap);
  const reasons = [
    "Gleiche Kategorie",
    `Gemeinsame Begriffe: ${shared.slice(0, 4).join(", ")}`,
  ];
  const al = words(a.location),
    bl = words(b.location);
  if ([...al].some((w) => bl.has(w))) {
    score += 20;
    reasons.push("Ähnlicher Ort");
  }
  if (Math.abs(delta) <= 86400000) {
    score += 15;
    reasons.push("Zeitpunkte innerhalb eines Tages");
  } else if (delta <= 7 * 86400000) {
    score += 8;
    reasons.push("Zeitpunkte innerhalb einer Woche");
  }
  return score >= 55 ? { score: Math.min(score, 100), reasons } : null;
}
