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
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');

    if (!flutterwaveSecretKey) {
      console.error('Flutterwave secret key not configured');
      return new Response('Configuration error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload));

    // Verify the webhook signature
    const secretHash = Deno.env.get('FLUTTERWAVE_ENCRYPTION_KEY');
    const signature = req.headers.get('verif-hash');
    
    if (secretHash && signature !== secretHash) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { tx_ref, amount, customer, meta } = payload.data;
      
      const user_id = meta?.user_id;
      const plan_type = meta?.plan_type || (amount >= 3000 ? 'monthly' : 'weekly');
      
      if (!user_id) {
        console.error('No user_id in payment metadata');
        return new Response('Missing user_id', { status: 400 });
      }

      const durationDays = plan_type === 'monthly' ? 30 : 7;
      const subscription_expires = new Date();
      subscription_expires.setDate(subscription_expires.getDate() + durationDays);

      // Update user profile to premium
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          subscription_plan: plan_type,
          subscription_start: new Date().toISOString(),
          subscription_expires: subscription_expires.toISOString(),
        })
        .eq('id', user_id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        return new Response('Profile update failed', { status: 500 });
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id,
          flutterwave_transaction_id: tx_ref,
          amount,
          currency: 'NGN',
          status: 'successful',
          plan_type,
        });

      if (paymentError) {
        console.error('Payment record error:', paymentError);
      }

      console.log(`User ${user_id} upgraded to ${plan_type} premium`);
      return new Response('Success', { status: 200 });
    }

    return new Response('Event received', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});
