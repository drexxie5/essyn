-- Add policy to allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to delete from chats (for cleanup)
CREATE POLICY "Admins can delete chats"
ON public.chats
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to delete messages (for cleanup)
CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to delete matches (for cleanup)
CREATE POLICY "Admins can delete matches"
ON public.matches
FOR DELETE
USING (has_role(auth.uid(), 'admin'));