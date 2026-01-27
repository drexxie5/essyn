import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Check, MessageCircle, Heart, Zap, ArrowLeft, BadgeCheck, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Premium = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPremiumPlan, setSelectedPremiumPlan] = useState<"weekly" | "monthly">("monthly");
  const [selectedVerifyPlan, setSelectedVerifyPlan] = useState<"monthly" | "lifetime">("lifetime");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const verifiedReturnRef = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user || verifiedReturnRef.current) return;
    void maybeVerifyPaymentReturn();
  }, [user, location.search]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, subscription_expires, is_verified, verification_expires")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile) {
      const premiumActive = profile.is_premium && 
        profile.subscription_expires && 
        new Date(profile.subscription_expires) > new Date();
      setIsPremium(!!premiumActive);

      const verifiedActive = profile.is_verified && 
        (!profile.verification_expires || new Date(profile.verification_expires) > new Date());
      setIsVerified(!!verifiedActive);
    }
  };

  const maybeVerifyPaymentReturn = async () => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    const paymentFlag = params.get("payment");
    const transactionId = params.get("transaction_id");
    const txRef = params.get("tx_ref");

    const looksLikeReturn =
      status === "successful" ||
      (paymentFlag === "complete" && (transactionId || txRef));

    if (!looksLikeReturn) return;
    if (!transactionId) {
      toast.error("Payment completed but missing transaction id.");
      return;
    }

    verifiedReturnRef.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction_id: transactionId,
            tx_ref: txRef || undefined,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Payment verification failed");
      }

      toast.success("Payment verified — Subscription activated!");
      navigate("/discover", { replace: true });
    } catch (error: any) {
      console.error("verify-payment failed:", error);
      toast.error(error?.message || "Could not verify payment yet. Please try again.");
    }
  };

  const premiumPlans = {
    weekly: { price: 1000, duration: "7 days", pricePerDay: "₦143/day" },
    monthly: { price: 3000, duration: "30 days", pricePerDay: "₦100/day", savings: "Save 30%" },
  };

  const verifyPlans = {
    monthly: { price: 2000, duration: "30 days", pricePerDay: "₦67/day" },
    lifetime: { price: 10000, duration: "Lifetime", pricePerDay: "One-time", savings: "Best Value" },
  };

  const premiumFeatures = [
    { icon: MessageCircle, text: "Unlimited messaging" },
    { icon: Zap, text: "Priority in discovery feed" },
    { icon: Crown, text: "Premium badge on profile" },
    { icon: Heart, text: "Super likes - stand out more" },
  ];

  const verifyFeatures = [
    { icon: BadgeCheck, text: "Blue verified badge on profile" },
    { icon: Shield, text: "Trusted real person status" },
    { icon: Check, text: "Badge visible everywhere" },
    { icon: Check, text: "Higher visibility in discovery" },
  ];

  const handlePremiumSubscribe = async () => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_type: selectedPremiumPlan,
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
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubscribe = async () => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-verification-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_type: selectedVerifyPlan,
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
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-bold mb-2">
              Upgrade Your Experience
            </h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Choose a subscription to unlock exclusive features
            </p>
          </div>

          <Tabs defaultValue="premium" className="max-w-sm mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="premium" className="gap-2">
                <Crown className="w-4 h-4" />
                Premium
              </TabsTrigger>
              <TabsTrigger value="verified" className="gap-2">
                <BadgeCheck className="w-4 h-4" />
                Verified
              </TabsTrigger>
            </TabsList>

            {/* Premium Tab */}
            <TabsContent value="premium">
              {isPremium ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <h2 className="text-xl font-display font-bold mb-2">You're Premium!</h2>
                  <p className="text-muted-foreground text-sm">Enjoy unlimited messaging and all premium features.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                      <Crown className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <span className="text-lg font-display font-bold text-gradient-gold">Premium</span>
                  </div>

                  {/* Plan Selection */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {(["weekly", "monthly"] as const).map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setSelectedPremiumPlan(plan)}
                        className={`relative p-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
                          selectedPremiumPlan === plan
                            ? "border-secondary bg-secondary/10"
                            : "border-border bg-card/50"
                        }`}
                      >
                        {plan === "monthly" && premiumPlans[plan].savings && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-gold text-[9px] font-bold text-secondary-foreground">
                            {premiumPlans[plan].savings}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground capitalize">{plan}</p>
                        <p className="text-xl font-bold">₦{premiumPlans[plan].price.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">{premiumPlans[plan].pricePerDay}</p>
                      </button>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {premiumFeatures.map((feature) => (
                      <div
                        key={feature.text}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50"
                      >
                        <div className="w-7 h-7 rounded-md bg-gradient-gold flex items-center justify-center">
                          <feature.icon className="w-3.5 h-3.5 text-secondary-foreground" />
                        </div>
                        <span className="text-xs font-medium flex-1">{feature.text}</span>
                        <Check className="w-4 h-4 text-secondary" />
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={handlePremiumSubscribe}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : `Subscribe for ₦${premiumPlans[selectedPremiumPlan].price.toLocaleString()}`}
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Verified Tab */}
            <TabsContent value="verified">
              {isVerified ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                    <BadgeCheck className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h2 className="text-xl font-display font-bold mb-2">You're Verified!</h2>
                  <p className="text-muted-foreground text-sm">Your trusted badge is visible to all users.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
                      <BadgeCheck className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <span className="text-lg font-display font-bold text-accent">Verified Badge</span>
                  </div>

                  {/* Plan Selection */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {(["monthly", "lifetime"] as const).map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setSelectedVerifyPlan(plan)}
                        className={`relative p-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
                          selectedVerifyPlan === plan
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card/50"
                        }`}
                      >
                        {plan === "lifetime" && verifyPlans[plan].savings && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            {verifyPlans[plan].savings}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground capitalize">{plan}</p>
                        <p className="text-xl font-bold">₦{verifyPlans[plan].price.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">{verifyPlans[plan].pricePerDay}</p>
                      </button>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {verifyFeatures.map((feature) => (
                      <div
                        key={feature.text}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50"
                      >
                        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                          <feature.icon className="w-3.5 h-3.5 text-accent-foreground" />
                        </div>
                        <span className="text-xs font-medium flex-1">{feature.text}</span>
                        <Check className="w-4 h-4 text-accent" />
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleVerificationSubscribe}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : `Get Verified for ₦${verifyPlans[selectedVerifyPlan].price.toLocaleString()}`}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Secure payment powered by Flutterwave. Cancel anytime.
          </p>
        </main>
      </div>
    </AppLayout>
  );
});

Premium.displayName = "Premium";

export default Premium;
