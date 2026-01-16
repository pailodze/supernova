-- Add open_positions column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS open_positions INTEGER DEFAULT NULL;

-- Optional: Add a comment explaining the column
COMMENT ON COLUMN jobs.open_positions IS 'Number of open positions for this job posting. NULL means unspecified.';
