import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header, { type SortOption } from "../Header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useMinimizedHeader", () => ({
  useMinimizedHeader: () => ({ minimized: false }),
}));

vi.mock("../ThemeToggle", () => ({
  default: () => <button type="button">Theme</button>,
}));

const defaultProps = {
  query: "",
  onQueryChange: vi.fn(),
  categories: ["Husmanskost", "Dessert"],
  categoryValue: "",
  onCategoryChange: vi.fn(),
  showAll: false,
  onToggleShowAll: vi.fn(),
  onAddRecipe: vi.fn(),
  onSignOut: vi.fn(),
  sort: "title" as SortOption,
  onSortChange: vi.fn(),
};

describe("Header", () => {
  it("renders the search input", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByPlaceholderText("Sök recept eller ingrediens…")).toBeInTheDocument();
  });

  it("renders category options", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText("Alla kategorier")).toBeInTheDocument();
    expect(screen.getByText("Husmanskost")).toBeInTheDocument();
    expect(screen.getByText("Dessert")).toBeInTheDocument();
  });

  it("renders sort dropdown with all options", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText("A–Ö")).toBeInTheDocument();
    expect(screen.getByText("Nyast")).toBeInTheDocument();
    expect(screen.getByText("Äldst")).toBeInTheDocument();
    expect(screen.getByText("Senast ändrad")).toBeInTheDocument();
  });

  it("calls onSortChange when sort is changed", () => {
    const onSortChange = vi.fn();
    render(<Header {...defaultProps} onSortChange={onSortChange} />);

    const sortSelect = screen.getByDisplayValue("A–Ö");
    fireEvent.change(sortSelect, { target: { value: "created_at_desc" } });

    expect(onSortChange).toHaveBeenCalledWith("created_at_desc");
  });

  it("calls onQueryChange when typing in search", () => {
    const onQueryChange = vi.fn();
    render(<Header {...defaultProps} onQueryChange={onQueryChange} />);

    const input = screen.getByPlaceholderText("Sök recept eller ingrediens…");
    fireEvent.change(input, { target: { value: "pasta" } });

    expect(onQueryChange).toHaveBeenCalledWith("pasta");
  });

  it("shows clear button when query is set", () => {
    render(<Header {...defaultProps} query="pasta" />);
    expect(screen.getByLabelText("Rensa sökfält")).toBeInTheDocument();
  });

  it("does not show clear button when query is empty", () => {
    render(<Header {...defaultProps} query="" />);
    expect(screen.queryByLabelText("Rensa sökfält")).not.toBeInTheDocument();
  });

  it("calls onAddRecipe when add button is clicked", () => {
    const onAddRecipe = vi.fn();
    render(<Header {...defaultProps} onAddRecipe={onAddRecipe} />);

    fireEvent.click(screen.getByText("+ Nytt recept"));
    expect(onAddRecipe).toHaveBeenCalledOnce();
  });

  it("calls onSignOut when sign-out button is clicked via hamburger menu", () => {
    const onSignOut = vi.fn();
    render(<Header {...defaultProps} onSignOut={onSignOut} />);

    fireEvent.click(screen.getByLabelText("Meny"));
    fireEvent.click(screen.getByText("Logga ut"));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("shows family and theme options inside hamburger menu", () => {
    render(<Header {...defaultProps} />);

    expect(screen.queryByText("Familj & inbjudan")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Meny"));

    expect(screen.getByText("Familj & inbjudan")).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });
});
