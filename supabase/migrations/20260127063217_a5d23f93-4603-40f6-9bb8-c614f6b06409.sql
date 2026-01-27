-- Add is_read column to messages for read receipts
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Add is_verified column to profiles for verified badge
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Add verification_expires column for auto-verification subscription
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_expires timestamp with time zone;

-- Add voice message type to message_type enum
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'voice';

-- Create index for faster read status queries
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(chat_id, is_read);

-- Allow users to update their own messages (for marking as read by recipient)
CREATE POLICY "Users can mark messages as read in their chats" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id 
    AND (chats.user_one_id = auth.uid() OR chats.user_two_id = auth.uid())
    AND messages.sender_id != auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id 
    AND (chats.user_one_id = auth.uid() OR chats.user_two_id = auth.uid())
    AND messages.sender_id != auth.uid()
  )
);