-- Each announcement gets a web address made from its title (its id added where two would be
-- the same, worked out in one statement so no two rows ever share one), and its plain-text
-- summary becomes the editor's document: one paragraph per block of text separated by a blank
-- line, in order.
UPDATE "announcements" AS a
SET "slug" = CASE WHEN n.dup = 1 THEN n.base ELSE n.base || '-' || a."id" END
FROM (
  SELECT "id",
         base,
         row_number() OVER (PARTITION BY base ORDER BY "id") AS dup
  FROM (
    SELECT "id",
           coalesce(
             nullif(trim(both '-' from left(lower(regexp_replace("title", '[^a-zA-Z0-9]+', '-', 'g')), 120)), ''),
             'notice'
           ) AS base
    FROM "announcements"
  ) AS b
) AS n
WHERE n."id" = a."id" AND a."slug" IS NULL;--> statement-breakpoint
UPDATE "announcements"
SET "content" = jsonb_build_object(
  'type', 'doc',
  'content', coalesce(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', trim(p.text)))
        )
        ORDER BY p.n
      )
      FROM regexp_split_to_table(coalesce("summary", ''), E'\\n\\s*\\n') WITH ORDINALITY AS p(text, n)
      WHERE trim(p.text) <> ''
    ),
    '[{"type": "paragraph"}]'::jsonb
  )
)
WHERE "content" IS NULL;
