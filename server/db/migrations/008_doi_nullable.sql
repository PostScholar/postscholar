-- 008_doi_nullable.sql
-- Makes the doi column on papers nullable to support manual paper entries
-- where no DOI exists. The UNIQUE constraint is kept but only applies to
-- non-null values in PostgreSQL.

ALTER TABLE papers ALTER COLUMN doi DROP NOT NULL;