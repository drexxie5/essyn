-- Add profile_images array column for multiple photos (up to 3)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_images text[] DEFAULT ARRAY[]::text[];