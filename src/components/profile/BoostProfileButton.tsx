import { Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BoostProfileButtonProps {
  userId: string;
  userEmail: string;
  currentBoostExpires: string | null;
}

const BOOST_PLANS = [
  { id: "daily", name: "1 Day Boost", price: 500, duration: 1 },
  { id: "weekly", name: "7 Day Boost", price: 2000, duration: 7 },
];

export function BoostProfileButton({ userId, userEmail, currentBoostExpires }: BoostProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const isCurrentlyBoosted = currentBoostExpires && new Date(currentBoostExpires) > new Date();

  const handleBoost = async (planId: string) => {
    const plan = BOOST_PLANS.find(p => p.id === planId);
    if (!plan) return;

    setLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to boost your profile");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-boost-payment", {
        body: {
          plan_type: planId,
          user_email: userEmail,
          user_id: userId,
        },
      });

      if (error) throw error;

      if (data?.payment_link) {
        window.location.href = data.payment_link;
      } else {
        throw new Error("No payment link received");
      }
    } catch (error: any) {
      console.error("Boost error:", error);
      toast.error("Failed to start boost payment");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={isCurrentlyBoosted ? "secondary" : "default"}
          className={`gap-2 ${isCurrentlyBoosted ? "" : "bg-gradient-sensual hover:opacity-90"}`}
        >
          <Rocket className="w-4 h-4" />
          {isCurrentlyBoosted ? "Boosted!" : "Boost Profile"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Boost Your Profile
          </DialogTitle>
          <DialogDescription>
            Get seen by more singles! Boosted profiles appear at the top of discovery for everyone.
          </DialogDescription>
        </DialogHeader>

        {isCurrentlyBoosted && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <p className="text-sm text-primary font-medium">
              ✨ Your profile is boosted until{" "}
              {new Date(currentBoostExpires!).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
            </p>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {BOOST_PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleBoost(plan.id)}
              disabled={loading !== null}
              className="w-full p-4 rounded-xl border border-border hover:border-primary transition-colors flex items-center justify-between"
            >
              <div className="text-left">
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  Be seen first for {plan.duration} day{plan.duration > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {loading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="font-bold text-primary">₦{plan.price.toLocaleString()}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
