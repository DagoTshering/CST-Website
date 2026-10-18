-- Custom SQL migration file, put your code below! --
-- Data: a Dean's title in the Staff Directory now comes from the Executives (the executive
-- linked to the staff record), so it is not also kept on the staff record: the DAA/DSA duties go,
-- and so does their mention in the designation ("Lecturer/DSA (SHD)" -> "Lecturer (SHD)").
UPDATE "staff"
SET "duties" = array_remove(array_remove("duties", 'DAA'), 'DSA'),
    "designation" = regexp_replace("designation", '/(DAA|DSA)\M', '', 'g')
WHERE 'DAA' = ANY("duties") OR 'DSA' = ANY("duties") OR "designation" ~ '/(DAA|DSA)\M';
