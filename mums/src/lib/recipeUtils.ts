export function scaleAmount(original: string | null, ratio: number): string {
  if (!original) return "";
  const cleaned = original
    .replace("½", "0.5")
    .replace("¼", "0.25")
    .replace("¾", "0.75")
    .replace("⅓", "0.333")
    .replace("⅔", "0.667")
    .replace("⅛", "0.125");

  const num = parseFloat(cleaned);
  if (isNaN(num)) return original;

  const scaled = num * ratio;
  if (scaled === Math.round(scaled)) return String(Math.round(scaled));
  return scaled.toFixed(1).replace(/\.0$/, "");
}

export function parseSteps(instructions: string | null): string[] {
  if (!instructions) return [];
  const lines = instructions.split("\n").map((l) => l.trim()).filter(Boolean);

  const numbered = lines.every((l) => /^\d+[\.\)]\s/.test(l));
  if (numbered) {
    return lines.map((l) => l.replace(/^\d+[\.\)]\s*/, ""));
  }

  if (lines.length <= 3) {
    return lines.flatMap((l) => {
      const sentences = l.match(/[^.!?]+[.!?]+/g);
      if (sentences && sentences.length > 1) return sentences.map((s) => s.trim());
      return [l];
    });
  }

  return lines;
}
