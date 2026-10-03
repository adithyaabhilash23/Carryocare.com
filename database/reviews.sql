-- ============================================================
-- CarryO Care — Customer Reviews Table & Moderation Schema
-- Compatible with Neon PostgreSQL (Serverless)
-- ============================================================

-- 1. Create table if it doesn't already exist
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT NOT NULL,
    name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Safely add columns if the table already existed with the initial minimal schema
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- 3. Add constraint for valid moderation statuses if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_reviews_status'
    ) THEN
        ALTER TABLE reviews ADD CONSTRAINT chk_reviews_status
            CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- 4. Create index for fast public query of approved reviews (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_reviews_status_created_at
    ON reviews (status, created_at DESC);

-- ============================================================
-- Helpful queries for moderation in Neon SQL Editor:
--
-- View all pending reviews:
-- SELECT id, rating, name, feedback, created_at FROM reviews WHERE status = 'pending' ORDER BY created_at DESC;
--
-- Approve a review:
-- UPDATE reviews SET status = 'approved' WHERE id = '<UUID>';
--
-- Reject a review:
-- UPDATE reviews SET status = 'rejected' WHERE id = '<UUID>';
-- ============================================================
