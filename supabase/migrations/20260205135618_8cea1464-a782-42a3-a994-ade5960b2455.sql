-- Add new columns for profile boost, video status, daily message limits
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS boost_expires_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_status_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_status_expires_at timestamp with time zone DEFAULT NULL;

-- Create blocked_users table for user blocking
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
CREATE POLICY "Users can view own blocks" ON public.blocked_users
  FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock" ON public.blocked_users
  FOR DELETE USING (blocker_id = auth.uid());

-- Create daily_message_counts table for free user limits
CREATE TABLE IF NOT EXISTS public.daily_message_counts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message_count integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on daily_message_counts
ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_message_counts
CREATE POLICY "Users can view own message counts" ON public.daily_message_counts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own message counts" ON public.daily_message_counts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own message counts" ON public.daily_message_counts
  FOR UPDATE USING (user_id = auth.uid());

-- Create boost_payments table
CREATE TABLE IF NOT EXISTS public.boost_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('daily', 'weekly')),
  amount numeric NOT NULL,
  flutterwave_transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

-- Enable RLS on boost_payments
ALTER TABLE public.boost_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boost_payments
CREATE POLICY "Users can view own boost payments" ON public.boost_payments
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own boost payments" ON public.boost_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create admin_broadcasts table for admin to send notifications to all users
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_broadcasts
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_broadcasts
CREATE POLICY "Admins can manage broadcasts" ON public.admin_broadcasts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view broadcasts" ON public.admin_broadcasts
  FOR SELECT USING (true);

-- Add policy to allow matched users to chat (free users with matches)
DROP POLICY IF EXISTS "Premium users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (
    (user_one_id = auth.uid() OR user_two_id = auth.uid()) 
    AND (
      -- Premium users can create any chat
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_premium = true AND subscription_expires > now())
      OR
      -- Or there's a mutual match
      EXISTS (
        SELECT 1 FROM matches 
        WHERE (user_one_id = auth.uid() AND user_two_id = CASE WHEN user_one_id = auth.uid() THEN user_two_id ELSE user_one_id END)
           OR (user_two_id = auth.uid() AND user_one_id = CASE WHEN user_one_id = auth.uid() THEN user_two_id ELSE user_one_id END)
      )
    )
  );

-- Update messages policy to allow matched users to send messages
DROP POLICY IF EXISTS "Premium users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM chats 
      WHERE id = chat_id 
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
    AND (
      -- Premium users can send unlimited messages
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_premium = true AND subscription_expires > now())
      OR
      -- Free users with mutual match can send up to 5 messages per day
      (
        EXISTS (
          SELECT 1 FROM matches m
          JOIN chats c ON c.id = chat_id
          WHERE (m.user_one_id = auth.uid() AND m.user_two_id = CASE WHEN c.user_one_id = auth.uid() THEN c.user_two_id ELSE c.user_one_id END)
             OR (m.user_two_id = auth.uid() AND m.user_one_id = CASE WHEN c.user_one_id = auth.uid() THEN c.user_two_id ELSE c.user_one_id END)
        )
        AND COALESCE(
          (SELECT message_count FROM daily_message_counts WHERE user_id = auth.uid() AND date = CURRENT_DATE),
          0
        ) < 5
      )
    )
  );

-- Allow users to delete their chats (conversations)
CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (user_one_id = auth.uid() OR user_two_id = auth.uid());

-- Allow deleting notifications after 48 hours automatically (we'll use a cron job)
-- Function to delete old notifications
CREATE OR REPLACE FUNCTION public.delete_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '48 hours';
  
  -- Also delete expired video statuses
  UPDATE public.profiles
  SET video_status_url = NULL, video_status_expires_at = NULL
  WHERE video_status_expires_at IS NOT NULL AND video_status_expires_at < NOW();
END;
$$;

-- Function to reset daily message counts at midnight (Nigerian time - WAT UTC+1)
CREATE OR REPLACE FUNCTION public.reset_daily_message_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete records from previous days
  DELETE FROM public.daily_message_counts
  WHERE date < CURRENT_DATE;
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_message_counts;