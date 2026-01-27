import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VerifyPaymentRequest = {
  transaction_id: string | number;
  tx_ref?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

    if (!flutterwaveSecretKey) {
      return new Response(JSON.stringify({ error: "Payment configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { transaction_id, tx_ref }: VerifyPaymentRequest = await req.json();

    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "Missing transaction_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyJson = await verifyRes.json();
    const fw = verifyJson?.data;

    if (verifyJson?.status !== "success" || !fw) {
      return new Response(JSON.stringify({ error: "Verification failed", details: verifyJson }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Safety checks
    if (fw.status !== "successful") {
      return new Response(JSON.stringify({ error: "Payment not successful", details: fw }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tx_ref && fw.tx_ref && tx_ref !== fw.tx_ref) {
      return new Response(JSON.stringify({ error: "tx_ref mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metaUserId = fw?.meta?.user_id;
    if (metaUserId && metaUserId !== userId) {
      return new Response(JSON.stringify({ error: "Payment does not belong to this user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = Number(fw.amount ?? 0);
    const plan_type = (fw?.meta?.plan_type as "weekly" | "monthly" | undefined) ||
      (amount >= 3000 ? "monthly" : "weekly");

    const durationDays = plan_type === "monthly" ? 30 : 7;

    // Extend from current expiry if still active
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_expires")
      .eq("id", userId)
      .maybeSingle();

    const now = new Date();
    const currentExpiry = profile?.subscription_expires ? new Date(profile.subscription_expires) : null;
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;

    const subscription_expires = new Date(base);
    subscription_expires.setDate(subscription_expires.getDate() + durationDays);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        subscription_plan: plan_type,
        subscription_start: now.toISOString(),
        subscription_expires: subscription_expires.toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      return new Response(JSON.stringify({ error: "Profile update failed", details: profileError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        flutterwave_transaction_id: String(fw.id ?? fw.tx_ref ?? transaction_id),
        amount,
        currency: String(fw.currency ?? "NGN"),
        status: "successful",
        plan_type,
      });

    // Don't block premium activation if payment insert fails
    if (paymentError) {
      console.error("Payment insert error:", paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan_type,
        subscription_expires: subscription_expires.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-payment error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
