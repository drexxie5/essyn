import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Check, MessageCircle, Heart, Eye, Zap, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const Premium = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

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
  };

  const plans = {
    weekly: {
      price: 1000,
      duration: "7 days",
      pricePerDay: "₦143/day",
    },
    monthly: {
      price: 3000,
      duration: "30 days",
      pricePerDay: "₦100/day",
      savings: "Save 30%",
    },
  };

  const features = [
    { icon: MessageCircle, text: "Unlimited messaging" },
    { icon: Heart, text: "See who likes you" },
    { icon: Eye, text: "View all profile visitors" },
    { icon: Zap, text: "Priority in discovery feed" },
    { icon: Crown, text: "Premium badge on profile" },
  ];

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    
    // In production, this would redirect to Flutterwave checkout
    toast.info("Flutterwave integration coming soon! This is a demo.");
    
    setLoading(false);
  };

  return (
    <AppLayout showNav={false} showHeader={false}>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-gold mb-4 shadow-gold">
              <Crown className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Unlock <span className="text-gradient-gold">Premium</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Get unlimited access to all features and find your perfect match faster
            </p>
          </motion.div>

          {/* Plan Selection */}
          <div className="max-w-sm mx-auto mb-8">
            <div className="grid grid-cols-2 gap-3">
              {(["weekly", "monthly"] as const).map((plan) => (
                <motion.button
                  key={plan}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    selectedPlan === plan
                      ? "border-secondary bg-secondary/10"
                      : "border-border bg-card/50"
                  }`}
                >
                  {plan === "monthly" && plans[plan].savings && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-gold text-[10px] font-bold text-secondary-foreground">
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
            <h2 className="text-sm font-display font-bold mb-4 text-center">What's included</h2>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl glass"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <span className="text-sm font-medium flex-1">{feature.text}</span>
                  <Check className="w-4 h-4 text-accent" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-sm mx-auto text-center">
            <Button
              variant="gold"
              size="lg"
              className="w-full mb-3"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? "Processing..." : `Subscribe for ₦${plans[selectedPlan].price.toLocaleString()}`}
            </Button>
            <p className="text-xs text-muted-foreground">
              Secure payment powered by Flutterwave. Cancel anytime.
            </p>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Premium;
