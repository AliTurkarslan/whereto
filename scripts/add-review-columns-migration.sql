-- Migration: Add publishTime and relativePublishTimeDescription columns to reviews table

-- Check if columns exist, if not add them
DO $$
BEGIN
    -- Add publish_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'publish_time'
    ) THEN
        ALTER TABLE reviews ADD COLUMN publish_time TIMESTAMP;
        RAISE NOTICE 'Added publish_time column';
    ELSE
        RAISE NOTICE 'publish_time column already exists';
    END IF;

    -- Add relative_publish_time_description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'relative_publish_time_description'
    ) THEN
        ALTER TABLE reviews ADD COLUMN relative_publish_time_description TEXT;
        RAISE NOTICE 'Added relative_publish_time_description column';
    ELSE
        RAISE NOTICE 'relative_publish_time_description column already exists';
    END IF;
END $$;
