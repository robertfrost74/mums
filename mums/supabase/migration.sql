-- ============================================================
-- Mums – Family Recipe App – Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tables

CREATE TABLE public.families (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.family_members (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_id  UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  role       TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'member')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, family_id)
);

CREATE TABLE public.recipes (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id    UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  instructions TEXT,
  category     TEXT,
  image_url    TEXT,
  source       TEXT,
  servings     INT,
  prep_time    INT,
  cook_time    INT,
  is_active    BOOLEAN DEFAULT true NOT NULL,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_ingredients (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id  UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient TEXT NOT NULL,
  amount     TEXT,
  unit       TEXT,
  sort_order INT DEFAULT 0 NOT NULL
);

-- 3. Indexes

CREATE INDEX idx_family_members_user_id        ON public.family_members(user_id);
CREATE INDEX idx_recipes_family_id             ON public.recipes(family_id);
CREATE INDEX idx_recipes_category              ON public.recipes(category);
CREATE INDEX idx_recipes_is_active             ON public.recipes(is_active);
CREATE INDEX idx_recipe_ingredients_recipe_id  ON public.recipe_ingredients(recipe_id);

-- 4. Row Level Security

ALTER TABLE public.families           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- families
CREATE POLICY "Users can view own families"
  ON public.families FOR SELECT
  USING (id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

-- family_members
CREATE POLICY "Users can view own memberships"
  ON public.family_members FOR SELECT
  USING (user_id = auth.uid());

-- recipes – SELECT
CREATE POLICY "Users can view family recipes"
  ON public.recipes FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

-- recipes – INSERT
CREATE POLICY "Users can insert family recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

-- recipes – UPDATE
CREATE POLICY "Users can update family recipes"
  ON public.recipes FOR UPDATE
  USING (family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

-- recipes – DELETE (admin only)
CREATE POLICY "Admins can delete family recipes"
  ON public.recipes FOR DELETE
  USING (family_id IN (
    SELECT family_id FROM public.family_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- recipe_ingredients – SELECT
CREATE POLICY "Users can view family recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  USING (recipe_id IN (
    SELECT id FROM public.recipes
    WHERE family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  ));

-- recipe_ingredients – INSERT
CREATE POLICY "Users can insert recipe ingredients"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (recipe_id IN (
    SELECT id FROM public.recipes
    WHERE family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  ));

-- recipe_ingredients – UPDATE
CREATE POLICY "Users can update recipe ingredients"
  ON public.recipe_ingredients FOR UPDATE
  USING (recipe_id IN (
    SELECT id FROM public.recipes
    WHERE family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  ));

-- recipe_ingredients – DELETE
CREATE POLICY "Users can delete recipe ingredients"
  ON public.recipe_ingredients FOR DELETE
  USING (recipe_id IN (
    SELECT id FROM public.recipes
    WHERE family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  ));

-- 5. Triggers

-- Auto-update updated_at on recipes
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Auto-create a family when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
BEGIN
  INSERT INTO public.families (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'family_name', 'Min familj'))
  RETURNING id INTO new_family_id;

  INSERT INTO public.family_members (user_id, family_id, role)
  VALUES (NEW.id, new_family_id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Helper RPC

CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
