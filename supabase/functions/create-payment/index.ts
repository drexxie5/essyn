import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  plan_type: 'weekly' | 'monthly';
  user_email: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const flutterwavePublicKey = Deno.env.get('FLUTTERWAVE_PUBLIC_KEY');
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');

    if (!flutterwavePublicKey || !flutterwaveSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Payment configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan_type, user_email, user_id }: PaymentRequest = await req.json();

    const prices = {
      weekly: 1000,
      monthly: 3000,
    };

    const amount = prices[plan_type];
    const tx_ref = `NH_${user_id}_${Date.now()}`;

    // Create Flutterwave payment link
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: `${req.headers.get('origin') || 'https://naughtyhooks.lovable.app'}/premium?payment=complete`,
        customer: {
          email: user_email,
        },
        customizations: {
          title: 'NaughtyHooks Premium',
          description: `${plan_type} subscription`,
          logo: 'https://your-logo-url.com/logo.png',
        },
        meta: {
          user_id,
          plan_type,
        },
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return new Response(
        JSON.stringify({ 
          payment_link: data.data.link,
          tx_ref 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to create payment link', details: data }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
