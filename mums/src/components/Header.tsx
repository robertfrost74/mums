"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { useMinimizedHeader } from "@/hooks/useMinimizedHeader";

export type SortOption = "title" | "created_at_desc" | "created_at_asc" | "updated_at_desc";

export default function Header({
  query,
  onQueryChange,
  categories,
  categoryValue,
  onCategoryChange,
  showAll,
  onToggleShowAll,
  onAddRecipe,
  onSignOut,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  categories: string[];
  categoryValue: string;
  onCategoryChange: (v: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
  onAddRecipe: () => void;
  onSignOut: () => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
}) {
  const headerRouter = useRouter();
  const { minimized } = useMinimizedHeader({ minimizeAt: 60 });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const buttonBase =
    "border border-zinc-200 bg-white shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  const containerPad = minimized ? "py-2" : "py-4";
  const controlHeight = minimized ? "h-9" : "h-10";

  const logoWrap = minimized
    ? "max-h-0 opacity-0 -translate-y-4"
    : "max-h-28 opacity-100 translate-y-0";

  const mobileHideAll = minimized
    ? "max-h-0 opacity-0 -translate-y-3 pointer-events-none"
    : "max-h-[560px] opacity-100 translate-y-0 pointer-events-auto";

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

        <div className="grid grid-cols-1 gap-2 transition-all duration-200 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
          {/* Search */}
          <div className="relative w-full">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Sök recept eller ingrediens…"
              aria-label="Sök recept eller ingrediens"
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

          {/* Category */}
          <div className="relative w-full md:w-[180px]">
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
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>

          {/* Sort */}
          <div className="relative w-full md:w-[150px]">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className={[
                controlHeight,
                "w-full appearance-none rounded-2xl border border-zinc-200 bg-white pl-4 pr-10 text-sm shadow-sm outline-none transition",
                "focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600",
              ].join(" ")}
            >
              <option value="title">A–Ö</option>
              <option value="created_at_desc">Nyast</option>
              <option value="created_at_asc">Äldst</option>
              <option value="updated_at_desc">Senast ändrad</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>

          {/* Add recipe */}
          <button
            type="button"
            onClick={onAddRecipe}
            className={`${controlHeight} rounded-2xl border border-zinc-900 bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`}
          >
            + Nytt recept
          </button>

          {/* Hamburger menu */}
          <div className="relative flex items-center justify-end" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`${controlHeight} rounded-2xl px-3 text-sm ${buttonBase}`}
              aria-label="Meny"
              aria-expanded={menuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => { headerRouter.push("/family"); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span>👨‍👩‍👧‍👦</span>
                  <span>Familj & inbjudan</span>
                </button>
                <div className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5">
                  <ThemeToggle />
                </div>
                <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
                <button
                  type="button"
                  onClick={() => { onSignOut(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Logga ut
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
