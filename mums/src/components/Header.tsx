"use client";

import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { useMinimizedHeader } from "@/hooks/useMinimizedHeader";

export default function Header({
  query,
  onQueryChange,
  categories,
  categoryValue,
  onCategoryChange,
  onRandom,
  favoritesCount,
  onOpenFavorites,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  categories: { strCategory: string }[];
  categoryValue: string;
  onCategoryChange: (v: string) => void;
  onRandom: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
}) {
  const { minimized } = useMinimizedHeader({ minimizeAt: 60 });
  const showBadge = favoritesCount > 0;

  const buttonBase =
    "border border-zinc-200 bg-white shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  const containerPad = minimized ? "py-2" : "py-4";
  const controlHeight = minimized ? "h-9" : "h-10";

  // logo wrapper collapses
  const logoWrap = minimized
    ? "max-h-0 opacity-0 -translate-y-4"
    : "max-h-28 opacity-100 translate-y-0";

  // Mobile: hide whole header when minimized; desktop stays visible
  const mobileHideAll = minimized
    ? "max-h-0 opacity-0 -translate-y-3 pointer-events-none"
    : "max-h-[560px] opacity-100 translate-y-0 pointer-events-auto";

  // Responsive logo size: a bit smaller mobile, bigger desktop
  const logoSize = minimized ? "h-8 md:h-9" : "h-16 md:h-20";

  return (
    <header
      className={[
        "sticky top-0 z-40 bg-white/80 backdrop-blur dark:bg-zinc-950/70",
        "overflow-hidden transition-all duration-200",
        mobileHideAll,
        "md:max-h-none md:opacity-100 md:translate-y-0 md:pointer-events-auto md:overflow-visible",
        minimized
          ? "border-b-0 md:border-b md:border-zinc-200 md:dark:border-zinc-800"
          : "border-b border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
    >
      <div className={`mx-auto max-w-6xl px-4 transition-all duration-200 ${containerPad}`}>
        {/* Logo block – remove padding when minimized to avoid empty space */}
        <div
          className={[
            "flex items-center justify-center overflow-hidden transition-all duration-200",
            minimized ? "py-0" : "pt-4 pb-6",
            logoWrap,
          ].join(" ")}
          aria-hidden={minimized}
        >
          <Image
            src="/mums-logo.svg"
            alt="Mums"
            width={360}
            height={90}
            priority
            className={`${logoSize} w-auto object-contain transition-all duration-200 dark:hidden`}
          />
          <Image
            src="/mums-logo-dark.svg"
            alt="Mums"
            width={360}
            height={90}
            priority
            className={`hidden ${logoSize} w-auto object-contain transition-all duration-200 dark:block`}
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 gap-2 transition-all duration-200 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          {/* Search + clear */}
          <div className="relative w-full">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Sök recept…"
              className={[
                controlHeight,
                "w-full rounded-2xl border border-zinc-200 bg-white pl-4 pr-10 text-sm shadow-sm outline-none transition",
                "focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600",
              ].join(" ")}
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Rensa sökfält"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category select */}
          <div className="relative w-full md:w-[200px]">
            <select
              value={categoryValue}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={[
                controlHeight,
                "w-full appearance-none rounded-2xl border border-zinc-200 bg-white pl-4 pr-12 text-sm shadow-sm outline-none transition",
                "focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600",
              ].join(" ")}
            >
              <option value="">Alla kategorier</option>
              {categories.map((c) => (
                <option key={c.strCategory} value={c.strCategory}>
                  {c.strCategory}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="block"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>

          {/* Random */}
          <button
            onClick={onRandom}
            className={`${controlHeight} rounded-2xl px-3 text-sm ${buttonBase}`}
            type="button"
          >
            🎲 Random
          </button>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            <button
              onClick={onOpenFavorites}
              className={`relative ${controlHeight} rounded-2xl px-3 text-sm ${buttonBase}`}
              type="button"
              aria-label="Öppna favoriter"
            >
              ★
              <span
                aria-hidden={!showBadge}
                className={[
                  "ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border px-1 text-[11px]",
                  "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
                  "transition-opacity duration-150",
                  showBadge ? "opacity-100" : "opacity-0",
                ].join(" ")}
              >
                {showBadge ? favoritesCount : ""}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}