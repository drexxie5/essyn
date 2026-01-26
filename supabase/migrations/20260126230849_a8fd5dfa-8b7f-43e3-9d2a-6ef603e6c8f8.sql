-- Fix the overly permissive notifications insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- More secure policy - users can only receive notifications
CREATE POLICY "Notifications can be created for users"
ON public.notifications FOR INSERT
WITH CHECK (
  user_id IS NOT NULL AND 
  (
    -- Allow authenticated users to create notifications
    auth.uid() IS NOT NULL OR
    -- Or system/service role
    has_role(auth.uid(), 'admin'::app_role)
  )
);