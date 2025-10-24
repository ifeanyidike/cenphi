-- Remove description field from public_shares table
DROP INDEX IF EXISTS idx_public_shares_description;

ALTER TABLE public_shares
DROP COLUMN IF EXISTS description;
