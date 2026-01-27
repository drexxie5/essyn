-- Create function to delete old messages (older than 48 hours)
CREATE OR REPLACE FUNCTION public.delete_expired_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete messages older than 48 hours
  DELETE FROM public.messages
  WHERE created_at < NOW() - INTERVAL '48 hours';
  
  -- Delete empty chats (chats with no messages)
  DELETE FROM public.chats c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.messages m WHERE m.chat_id = c.id
  );
END;
$$;