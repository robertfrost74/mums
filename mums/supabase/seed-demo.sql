-- ============================================================
-- Mums – Demo/Test Account with sample recipes
-- Run this in Supabase SQL Editor ONCE to set up the demo user
-- ============================================================

-- 1. Create the demo user (email: demo@mums.app, password: demo1234)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  'dddddddd-demo-demo-demo-dddddddddddd',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@mums.app',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"family_name": "Demofamiljen"}'::jsonb,
  now(),
  now(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Also insert into auth.identities (required for Supabase auth to work)
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'dddddddd-demo-demo-demo-dddddddddddd',
  'dddddddd-demo-demo-demo-dddddddddddd',
  'demo@mums.app',
  'email',
  '{"sub": "dddddddd-demo-demo-demo-dddddddddddd", "email": "demo@mums.app"}'::jsonb,
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- 2. The handle_new_user trigger should auto-create a family,
--    but if it didn't fire, create one manually:
DO $$
DECLARE
  demo_uid UUID := 'dddddddd-demo-demo-demo-dddddddddddd';
  demo_fam UUID;
BEGIN
  SELECT family_id INTO demo_fam
  FROM public.family_members
  WHERE user_id = demo_uid
  LIMIT 1;

  IF demo_fam IS NULL THEN
    INSERT INTO public.families (name, invite_code)
    VALUES ('Demofamiljen', 'demodemo')
    RETURNING id INTO demo_fam;

    INSERT INTO public.family_members (user_id, family_id, role)
    VALUES (demo_uid, demo_fam, 'member');
  END IF;

  -- 3. Insert demo recipes
  INSERT INTO public.recipes (family_id, title, description, instructions, category, servings, prep_time, cook_time, is_active, created_by, image_url)
  VALUES
    (demo_fam, 'Klassiska Köttbullar', 'Mormors svenska köttbullar med gräddsås.', E'1. Blötlägg ströbröd i mjölk.\n2. Blanda färs, ägg, lök, salt och peppar.\n3. Rulla bollar, stek i smör ca 5 min.\n4. Gör gräddsås: stek mjöl i stekskyn, rör i grädde och buljong.\n5. Servera med potatismos och lingon.', 'Husmanskost', 4, 20, 15, true, demo_uid, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800'),

    (demo_fam, 'Pannkakor', 'Tunna svenska pannkakor – perfekt till lunch eller mellis.', E'1. Vispa ihop ägg, mjöl och salt.\n2. Tillsätt mjölken lite i taget.\n3. Rör ner smält smör.\n4. Stek tunna pannkakor i het panna.\n5. Servera med sylt och grädde.', 'Lunch', 4, 5, 15, true, demo_uid, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'),

    (demo_fam, 'Laxfilé med dillsås', 'Enkel ugnsbakad lax med krämig dillsås.', E'1. Ugn 200°C.\n2. Lägg laxfilén i en ugnsform, salta och peppra.\n3. Baka 15–18 min.\n4. Dillsås: blanda crème fraîche, hackad dill, citron, salt och peppar.\n5. Servera med kokt potatis och grönsaker.', 'Fisk', 4, 10, 18, true, demo_uid, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800'),

    (demo_fam, 'Pasta Carbonara', 'Krämig italiensk klassiker med ägg, parmesan och pancetta.', E'1. Koka pasta al dente.\n2. Stek tärnad pancetta knaprig.\n3. Vispa ägg med riven parmesan.\n4. Blanda het pasta med pancetta.\n5. Ta från värmen, rör i äggblandningen snabbt.\n6. Servera direkt med svartpeppar.', 'Pasta', 4, 10, 15, true, demo_uid, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800'),

    (demo_fam, 'Chokladbollar', 'Snabba, no-bake chokladbollar – klara på 15 min!', E'1. Blanda havregryn, socker, kakao, vaniljsocker och kallt kaffe.\n2. Rör ner smält smör.\n3. Rulla bollar och rulla i kokos eller pärlsocker.\n4. Ställ kallt 30 min.', 'Fika', 20, 15, 0, true, demo_uid, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800'),

    (demo_fam, 'Tomatsoppa', 'Värmande tomatsoppa med basilika – perfekt en kall dag.', E'1. Fräs hackad lök och vitlök i olivolja.\n2. Tillsätt krossade tomater, buljong och basilika.\n3. Låt koka 15 min.\n4. Mixa slät.\n5. Smaka av med salt, peppar och en nypa socker.\n6. Servera med osttoast.', 'Soppa', 4, 10, 20, true, demo_uid, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800'),

    (demo_fam, 'Tacos', 'Fredagsmys! Kryddig färs med alla tillbehör.', E'1. Stek köttfärs med tacokrydda.\n2. Skölj och strimla sallad.\n3. Tärna tomater, gurka och lök.\n4. Riv ost.\n5. Värm tortillas.\n6. Duka upp allt i skålar och bygg din egna taco!', 'Fredagsmys', 4, 15, 10, true, demo_uid, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'),

    (demo_fam, 'Kanelbullar', 'Saftiga, hemgjorda kanelbullar med kardemumma.', E'1. Värm mjölk, smält smör i den.\n2. Blanda jäst, socker, kardemumma, salt och mjöl.\n3. Knåda 10 min, jäs 40 min.\n4. Kavla ut, bred på smör-socker-kanelfyllning.\n5. Rulla ihop och skär bitar. Jäs 30 min.\n6. Pensla med ägg, strö pärlsocker. Grädda 225°C i 8–10 min.', 'Fika', 20, 30, 10, true, demo_uid, 'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=800')
  ON CONFLICT DO NOTHING;

  -- 4. Add ingredients for each recipe
  -- Köttbullar
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Köttfärs (blandfärs)', '500', 'g', 1),
    ('Ströbröd', '1', 'dl', 2),
    ('Mjölk', '1', 'dl', 3),
    ('Ägg', '1', 'st', 4),
    ('Lök, finhackad', '1', 'st', 5),
    ('Salt', '1', 'tsk', 6),
    ('Peppar', '', '', 7),
    ('Smör till stekning', '2', 'msk', 8)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Klassiska Köttbullar' AND r.family_id = demo_fam;

  -- Pannkakor
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Ägg', '3', 'st', 1),
    ('Vetemjöl', '3', 'dl', 2),
    ('Mjölk', '6', 'dl', 3),
    ('Salt', '½', 'tsk', 4),
    ('Smör, smält', '2', 'msk', 5)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Pannkakor' AND r.family_id = demo_fam;

  -- Laxfilé med dillsås
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Laxfilé', '4', 'st', 1),
    ('Crème fraîche', '2', 'dl', 2),
    ('Dill, hackad', '3', 'msk', 3),
    ('Citron', '½', 'st', 4),
    ('Salt och peppar', '', '', 5)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Laxfilé med dillsås' AND r.family_id = demo_fam;

  -- Pasta Carbonara
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Spaghetti', '400', 'g', 1),
    ('Pancetta', '150', 'g', 2),
    ('Äggula', '4', 'st', 3),
    ('Parmesan, riven', '1', 'dl', 4),
    ('Svartpeppar', '', '', 5)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Pasta Carbonara' AND r.family_id = demo_fam;

  -- Chokladbollar
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Havregryn', '5', 'dl', 1),
    ('Socker', '2', 'dl', 2),
    ('Kakao', '3', 'msk', 3),
    ('Vaniljsocker', '2', 'tsk', 4),
    ('Kallt kaffe', '3', 'msk', 5),
    ('Smör, smält', '100', 'g', 6),
    ('Kokos', '', '', 7)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Chokladbollar' AND r.family_id = demo_fam;

  -- Tomatsoppa
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Krossade tomater', '2', 'burkar', 1),
    ('Lök', '1', 'st', 2),
    ('Vitlök', '2', 'klyftor', 3),
    ('Grönsaksbuljong', '4', 'dl', 4),
    ('Basilika', '1', 'kruka', 5),
    ('Olivolja', '2', 'msk', 6)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Tomatsoppa' AND r.family_id = demo_fam;

  -- Tacos
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Köttfärs', '500', 'g', 1),
    ('Tacokrydda', '1', 'påse', 2),
    ('Tortillas', '8', 'st', 3),
    ('Sallad', '1', 'st', 4),
    ('Tomat', '3', 'st', 5),
    ('Rödlök', '1', 'st', 6),
    ('Riven ost', '2', 'dl', 7),
    ('Gräddfil', '2', 'dl', 8),
    ('Salsa', '1', 'burk', 9)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Tacos' AND r.family_id = demo_fam;

  -- Kanelbullar
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient, amount, unit, sort_order)
  SELECT r.id, v.ingredient, v.amount, v.unit, v.sort_order
  FROM public.recipes r,
  (VALUES
    ('Vetemjöl', '8', 'dl', 1),
    ('Mjölk', '2.5', 'dl', 2),
    ('Jäst', '25', 'g', 3),
    ('Smör', '75', 'g', 4),
    ('Socker', '¾', 'dl', 5),
    ('Kardemumma', '1', 'tsk', 6),
    ('Kanel (fyllning)', '2', 'msk', 7),
    ('Smör (fyllning)', '75', 'g', 8),
    ('Socker (fyllning)', '¾', 'dl', 9)
  ) AS v(ingredient, amount, unit, sort_order)
  WHERE r.title = 'Kanelbullar' AND r.family_id = demo_fam;
END $$;
