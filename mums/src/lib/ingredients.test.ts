import { describe, expect, it } from "vitest";
import { getIngredients } from "./ingredients";
import type { Meal } from "./types";

describe("getIngredients", () => {
  it("extracts non-empty ingredients with measures", () => {
    const meal = {
      idMeal: "1",
      strMeal: "Test",
      strMealThumb: "x",
      strIngredient1: "Chicken",
      strMeasure1: "200g",
      strIngredient2: " ",
      strMeasure2: "1 tsp",
    } as unknown as Meal;

    const out = getIngredients(meal);
    expect(out).toEqual([{ ingredient: "Chicken", measure: "200g" }]);
  });
});