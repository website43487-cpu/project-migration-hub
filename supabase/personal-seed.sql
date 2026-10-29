-- ObjektHaus starter data for your PERSONAL Supabase project.
-- Run this AFTER personal-schema.sql. Safe to re-run: rows that already
-- exist are left untouched.
--
-- Blank text/image fields are deliberate — the app fills them in from its
-- built-in copy, so you can edit the names, prices and weights here and
-- everything else keeps working.

insert into public.products
  (slug, no, name, latin, note, product, edition, price, weight_kg,
   represents, why, story, card_url, images, specs, sort_order)
values
  ('queen-annes-lace', '041', 'Queen Anne''s Lace', 'Daucus carota', '',
   'Object No.01 — Halo Pendant', 'Edition 001 / 101', 420, 2.4,
   '', '', '', '', '[]'::jsonb, '[]'::jsonb, 1),
  ('cow-parsley', '042', 'Cow Parsley', 'Anthriscus sylvestris', '',
   'Object No.12 — Card Holder', 'Edition 042 / 200', 60, 0.4,
   '', '', '', '', '[]'::jsonb, '[]'::jsonb, 2)
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('hero', '{"videoUrl":"","eyebrow":"","caption":""}'::jsonb),
  ('manifesto', '{"body":"Objects shape\nthe spaces\nwe inhabit.\n\nSpaces shape\nthe moments\nwe remember.\n\nWe create\nobjects that\ninvite you\nto notice."}'::jsonb),
  ('featured', '{"slug":"queen-annes-lace"}'::jsonb),
  ('delivery', '{"perKg":80,"base":60,"freeAbove":0}'::jsonb),
  ('checkout', '{"noteEnabled":true,"noteLabel":"Special note (optional)","noteHint":"Anything we should know — delivery timing, gift wrapping, a dedication.","notePlaceholder":""}'::jsonb),
  ('panel5', '{"eyebrow":"","title":"","body":"","videoUrl":"","caption":""}'::jsonb),
  ('contact', '{"facebook":"https://www.facebook.com/profile.php?id=61577360109655","instagram":"https://www.instagram.com/objekthaus_studio_","whatsapp":"+8801635592323","email":"objekthaus.studio@gmail.com","address":"Mirpur-12, Block-D, Road-09, Dhaka-1216, Bangladesh","hours":"Thursday – Saturday, by appointment"}'::jsonb),
  ('hidden', '{"slugs":[]}'::jsonb)
on conflict (key) do nothing;
