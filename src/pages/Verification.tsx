import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Shield, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const Verification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUser(session.user);

    // Check if already verified
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified, verification_expires")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile?.is_verified) {
      const expires = profile.verification_expires ? new Date(profile.verification_expires) : null;
      setIsVerified(!expires || expires > new Date());
    }
  };

  const plans = {
    monthly: {
      price: 2000,
      duration: "30 days",
      pricePerDay: "₦67/day",
    },
    lifetime: {
      price: 10000,
      duration: "Lifetime",
      pricePerDay: "One-time",
      savings: "Best Value",
    },
  };

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("lifetime");

  const features = [
    { icon: BadgeCheck, text: "Blue verified badge on your profile" },
    { icon: Shield, text: "Trusted real person status" },
    { icon: Check, text: "Badge visible everywhere you appear" },
    { icon: Check, text: "Higher visibility in discovery" },
  ];

  const handleVerification = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-verification-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_type: selectedPlan,
            user_email: session.user.email,
            user_id: session.user.id,
          }),
        }
      );

      const data = await response.json();

      if (data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <AppLayout showNav={false} showHeader={false}>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mb-6"
          >
            <BadgeCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold mb-2">You're Verified!</h1>
          <p className="text-muted-foreground text-center mb-6">
            Your account has the trusted badge visible to all users.
          </p>
          <Button onClick={() => navigate("/discover")}>
            Back to Discover
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false} showHeader={false}>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        {/* Header */}
        <header className="relative z-10 p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </header>

        <main className="relative z-10 px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 mb-4 shadow-lg">
              <BadgeCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Get <span className="text-blue-500">Verified</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Show others you're a real, trusted person with a verified badge
            </p>
          </motion.div>

          {/* Plan Selection */}
          <div className="max-w-sm mx-auto mb-8">
            <div className="grid grid-cols-2 gap-3">
              {(["monthly", "lifetime"] as const).map((plan) => (
                <motion.button
                  key={plan}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    selectedPlan === plan
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border bg-card/50"
                  }`}
                >
                  {plan === "lifetime" && plans[plan].savings && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-blue-500 text-[10px] font-bold text-white">
                      {plans[plan].savings}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground capitalize mb-1">{plan}</p>
                  <p className="text-2xl font-bold mb-0.5">₦{plans[plan].price.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{plans[plan].pricePerDay}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="max-w-sm mx-auto mb-8">
            <h2 className="text-sm font-display font-bold mb-4 text-center">What you get</h2>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl glass"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium flex-1">{feature.text}</span>
                  <Check className="w-4 h-4 text-blue-500" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-sm mx-auto text-center">
            <Button
              size="lg"
              className="w-full mb-3 bg-blue-500 hover:bg-blue-600"
              onClick={handleVerification}
              disabled={loading}
            >
              {loading ? "Processing..." : `Get Verified for ₦${plans[selectedPlan].price.toLocaleString()}`}
            </Button>
            <p className="text-xs text-muted-foreground">
              Secure payment powered by Flutterwave.
            </p>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Verification;
