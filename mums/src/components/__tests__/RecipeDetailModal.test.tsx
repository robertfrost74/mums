import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RecipeDetailModal from "../RecipeDetailModal";
import type { RecipeWithIngredients } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      className,
      role,
    }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} role={role}>{children}</div>
    ),
  },
}));

const baseRecipe: RecipeWithIngredients = {
  id: "r1",
  family_id: "f1",
  title: "Pannkakor",
  description: "Klassiska pannkakor",
  instructions: "1. Vispa ihop mjöl och mjölk\n2. Tillsätt ägg\n3. Stek i smör",
  category: "Dessert",
  image_url: null,
  source: "Mormor",
  servings: 4,
  prep_time: 10,
  cook_time: 20,
  is_active: true,
  created_by: "u1",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  recipe_ingredients: [
    { id: "i1", recipe_id: "r1", ingredient: "Mjöl", amount: "3", unit: "dl", sort_order: 0 },
    { id: "i2", recipe_id: "r1", ingredient: "Mjölk", amount: "6", unit: "dl", sort_order: 1 },
    { id: "i3", recipe_id: "r1", ingredient: "Ägg", amount: "3", unit: "st", sort_order: 2 },
    { id: "i4", recipe_id: "r1", ingredient: "Salt", amount: null, unit: null, sort_order: 3 },
  ],
};

describe("RecipeDetailModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders recipe title when open", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Pannkakor")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    const { container } = render(
      <RecipeDetailModal open={true} recipe={null} loading={true} onClose={vi.fn()} />,
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <RecipeDetailModal open={false} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows portion scaler when servings exist", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Portioner:")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows estimated portion scaler when servings are null", () => {
    const noServings = { ...baseRecipe, servings: null };
    render(
      <RecipeDetailModal open={true} recipe={noServings} loading={false} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Portioner:")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("uppsk.")).toBeInTheDocument();
  });

  it("scales portions up when + is clicked", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );

    const plusButton = screen.getByText("+");
    fireEvent.click(plusButton);

    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("scales portions down when − is clicked", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );

    const minusButton = screen.getByText("−");
    fireEvent.click(minusButton);

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("scales ingredient amounts when portions change", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );

    const plusButton = screen.getByText("+");
    fireEvent.click(plusButton);

    expect(screen.getByText("4.5 dl")).toBeInTheDocument();
    expect(screen.getByText("9 dl")).toBeInTheDocument();
    expect(screen.getByText("4.5 st")).toBeInTheDocument();
  });

  it("shows the cooking tab when instructions have multiple steps", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );
    expect(screen.getByText(/Laga/)).toBeInTheDocument();
  });

  it("does not show cooking tab when instructions have a single step", () => {
    const singleStep = { ...baseRecipe, instructions: "Blanda allt" };
    render(
      <RecipeDetailModal open={true} recipe={singleStep} loading={false} onClose={vi.fn()} />,
    );
    expect(screen.queryByText(/Laga/)).not.toBeInTheDocument();
  });

  it("navigates through cooking steps", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByText(/Laga/));

    expect(screen.getByText("Steg 1 av 3")).toBeInTheDocument();
    expect(screen.getByText("Vispa ihop mjöl och mjölk")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Nästa →"));
    expect(screen.getByText("Steg 2 av 3")).toBeInTheDocument();
    expect(screen.getByText("Tillsätt ägg")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Nästa →"));
    expect(screen.getByText("Steg 3 av 3")).toBeInTheDocument();
    expect(screen.getByText("Stek i smör")).toBeInTheDocument();
  });

  it("shows Återställ button when portions are changed", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );

    expect(screen.queryByText("Återställ")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("Återställ")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Återställ"));
    expect(screen.queryByText("Återställ")).not.toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows ingredients list", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Mjöl")).toBeInTheDocument();
    expect(screen.getByText("Mjölk")).toBeInTheDocument();
    expect(screen.getByText("Ägg")).toBeInTheDocument();
    expect(screen.getByText("Salt")).toBeInTheDocument();
  });

  it("shows meta chips", () => {
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Dessert")).toBeInTheDocument();
    expect(screen.getByText("Förb: 10 min")).toBeInTheDocument();
    expect(screen.getByText("Tillagning: 20 min")).toBeInTheDocument();
  });

  it("calls onClose when Stäng is clicked", () => {
    const onClose = vi.fn();
    render(
      <RecipeDetailModal open={true} recipe={baseRecipe} loading={false} onClose={onClose} />,
    );

    fireEvent.click(screen.getByText("Stäng"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
