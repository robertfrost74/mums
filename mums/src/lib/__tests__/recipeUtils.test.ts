import { describe, it, expect } from "vitest";
import { scaleAmount, parseSteps } from "../recipeUtils";

describe("scaleAmount", () => {
  it("scales integers", () => {
    expect(scaleAmount("2", 2)).toBe("4");
    expect(scaleAmount("3", 3)).toBe("9");
  });

  it("scales decimals", () => {
    expect(scaleAmount("1.5", 2)).toBe("3");
    expect(scaleAmount("0.5", 4)).toBe("2");
  });

  it("scales unicode fractions", () => {
    expect(scaleAmount("½", 2)).toBe("1");
    expect(scaleAmount("¼", 4)).toBe("1");
    expect(scaleAmount("¾", 2)).toBe("1.5");
    expect(scaleAmount("⅓", 3)).toBe("1");
    expect(scaleAmount("⅔", 3)).toBe("2");
    expect(scaleAmount("⅛", 8)).toBe("1");
  });

  it("returns empty string for null", () => {
    expect(scaleAmount(null, 2)).toBe("");
  });

  it("returns original for non-numeric strings", () => {
    expect(scaleAmount("lite", 2)).toBe("lite");
    expect(scaleAmount("efter smak", 3)).toBe("efter smak");
  });

  it("handles ratio of 1 (no change)", () => {
    expect(scaleAmount("4", 1)).toBe("4");
    expect(scaleAmount("½", 1)).toBe("0.5");
  });

  it("handles fractional ratios", () => {
    expect(scaleAmount("4", 0.5)).toBe("2");
    expect(scaleAmount("3", 0.5)).toBe("1.5");
  });

  it("removes trailing .0 from results", () => {
    expect(scaleAmount("2", 3)).toBe("6");
    expect(scaleAmount("1", 1)).toBe("1");
  });
});

describe("parseSteps", () => {
  it("returns empty array for null", () => {
    expect(parseSteps(null)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseSteps("")).toEqual([]);
  });

  it("parses numbered steps with dots", () => {
    const input = "1. Koka pastan.\n2. Stek löken.\n3. Blanda ihop.";
    const result = parseSteps(input);
    expect(result).toEqual(["Koka pastan.", "Stek löken.", "Blanda ihop."]);
  });

  it("parses numbered steps with parentheses", () => {
    const input = "1) Koka pastan\n2) Stek löken\n3) Blanda ihop";
    const result = parseSteps(input);
    expect(result).toEqual(["Koka pastan", "Stek löken", "Blanda ihop"]);
  });

  it("splits short text (<=3 lines) into sentences", () => {
    const input = "Koka pastan i saltat vatten. Stek löken tills den mjuknar. Blanda ihop allt.";
    const result = parseSteps(input);
    expect(result).toEqual([
      "Koka pastan i saltat vatten.",
      "Stek löken tills den mjuknar.",
      "Blanda ihop allt.",
    ]);
  });

  it("returns lines as-is for >3 unnumbered lines", () => {
    const input = "Koka pastan\nStek löken\nBlanda ihop\nServera varmt";
    const result = parseSteps(input);
    expect(result).toEqual(["Koka pastan", "Stek löken", "Blanda ihop", "Servera varmt"]);
  });

  it("filters out empty lines", () => {
    const input = "1. Koka pastan\n\n2. Stek löken\n\n3. Servera";
    const result = parseSteps(input);
    expect(result).toEqual(["Koka pastan", "Stek löken", "Servera"]);
  });

  it("handles single line with multiple sentences (<=3 lines)", () => {
    const input = "Värm ugnen till 200 grader. Lägg i allt. Grädda i 30 min.";
    const result = parseSteps(input);
    expect(result).toEqual([
      "Värm ugnen till 200 grader.",
      "Lägg i allt.",
      "Grädda i 30 min.",
    ]);
  });

  it("handles single line without sentence breaks as one step", () => {
    const input = "Blanda allt i en skål";
    const result = parseSteps(input);
    expect(result).toEqual(["Blanda allt i en skål"]);
  });
});
