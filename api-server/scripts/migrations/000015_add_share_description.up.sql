-- Add description field to public_shares table
ALTER TABLE public_shares
ADD COLUMN description TEXT;

-- Add index for full-text search on descriptions (optional, for future search functionality)
CREATE INDEX idx_public_shares_description ON public_shares USING gin(to_tsvector('english', description))
WHERE description IS NOT NULL;

COMMENT ON COLUMN public_shares.description IS 'Optional description/caption for the shared content, can include AI-generated post text';
