-- Allow users to delete their own sent messages
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid());