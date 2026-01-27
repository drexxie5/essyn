-- Create matches table for mutual likes
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_one_id UUID NOT NULL,
  user_two_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_one_id, user_two_id)
);

-- Enable Row Level Security
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own matches
CREATE POLICY "Users can view own matches"
ON public.matches
FOR SELECT
USING (user_one_id = auth.uid() OR user_two_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Users can create matches (system creates when mutual like detected)
CREATE POLICY "Authenticated users can create matches"
ON public.matches
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;