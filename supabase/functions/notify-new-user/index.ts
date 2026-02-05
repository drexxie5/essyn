import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, username, profile_image_url } = await req.json();

    if (!user_id || !username) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all user IDs (except the new user)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .neq("id", user_id)
      .eq("is_banned", false);

    if (profilesError) throw profilesError;

    // Create notifications for all users
    const notifications = (profiles || []).map(profile => ({
      user_id: profile.id,
      type: "new_user",
      title: "New Single Just Joined! 👀",
      message: `${username} just joined SinglezConnect. Check out their profile!`,
      related_user_id: user_id,
    }));

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await supabase.from("notifications").insert(batch);
    }

    return new Response(
      JSON.stringify({ success: true, notified: notifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('New user notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
