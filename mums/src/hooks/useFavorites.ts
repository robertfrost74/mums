"use client";

import { useEffect, useMemo, useState } from "react";
import type { FavoriteMeal } from "@/lib/types";

const KEY = "recipe_favorites_v1";

type FavMap = Record<string, FavoriteMeal>;

export function useFavorites() {
  const [loaded, setLoaded] = useState(false);
  const [favs, setFavs] = useState<FavMap>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FavMap;
        setFavs(parsed && typeof parsed === "object" ? parsed : {});
      }
    } catch {
      setFavs({});
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(KEY, JSON.stringify(favs));
  }, [favs, loaded]);

  const isFavorite = (id: string) => Boolean(favs[id]);

  const toggleFavorite = (meal: FavoriteMeal) => {
    setFavs((prev) => {
      const next = { ...prev };
      if (next[meal.idMeal]) delete next[meal.idMeal];
      else next[meal.idMeal] = meal;
      return next;
    });
  };

  const clearFavorites = () => setFavs({});

  const list = useMemo(() => Object.values(favs), [favs]);

  return { loaded, favs, list, isFavorite, toggleFavorite, clearFavorites };
}