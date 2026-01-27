-- Add new profile fields for hobbies, interests, and looking_for
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS looking_for TEXT DEFAULT NULL;