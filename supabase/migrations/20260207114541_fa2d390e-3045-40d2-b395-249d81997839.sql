-- Add unique constraint for daily_message_counts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_message_counts_user_date_unique'
  ) THEN
    ALTER TABLE public.daily_message_counts 
    ADD CONSTRAINT daily_message_counts_user_date_unique UNIQUE (user_id, date);
  END IF;
END $$;

-- Create scheduled job to delete old notifications (48 hours)
-- This is handled by Supabase's pg_cron extension if available
-- For now, we'll create a function that can be called periodically

CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete notifications older than 48 hours
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '48 hours';
  
  -- Delete messages older than 48 hours
  DELETE FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '48 hours';
  
  -- Reset daily message counts (older than today in WAT timezone)
  DELETE FROM public.daily_message_counts 
  WHERE date < (NOW() AT TIME ZONE 'Africa/Lagos')::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_expired_data TO authenticated;