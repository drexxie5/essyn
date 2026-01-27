import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Shield, MessageCircle, Crown, Users, Star, Check, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/discover");
    }
  };

  const features = [
    {
      icon: MapPin,
      title: "Find Love Nearby",
      description: "Discover singles in your city. Real people, real connections.",
    },
    {
      icon: Shield,
      title: "Safe & Private",
      description: "Your identity stays protected. Connect with verified adults only.",
    },
    {
      icon: MessageCircle,
      title: "Chat Instantly",
      description: "Match and start meaningful conversations right away.",
    },
  ];

  const testimonials = [
    {
      name: "Chioma A.",
      location: "Lagos",
      text: "I was tired of empty promises. SinglezConnect brought me someone real. We are planning our future together!",
      rating: 5,
    },
    {
      name: "Emeka J.",
      location: "Abuja",
      text: "Met my queen here! The location feature is perfect. She was right in my area. Best decision ever.",
      rating: 5,
    },
    {
      name: "Blessing O.",
      location: "Port Harcourt",
      text: "Finally, a dating app that works! No time wasters, just genuine people looking for real love.",
      rating: 5,
    },
  ];

  const premiumFeatures = [
    "Unlimited messages to all matches",
    "See everyone who likes your profile",
    "Priority visibility in searches",
    "Advanced location filters",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col">
        <div className="absolute inset-0 bg-gradient-dark">
          <div className="absolute top-20 left-4 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-32 right-4 w-40 h-40 bg-accent/20 rounded-full blur-[80px]" />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-sensual flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="text-lg font-display font-bold">SinglezConnect</span>
            </div>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="h-9">
                Sign In
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center px-4 py-6">
          <div className="w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-muted-foreground">1,000+ singles online now</span>
              </div>
              
              <h1 className="text-3xl font-display font-bold mb-3 leading-tight">
                Stop Searching.{" "}
                <span className="text-gradient">Start Connecting.</span>
              </h1>
              
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Your person is waiting. Join thousands of Nigerians finding love and real connections every day. No games, no fakes.
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/signup" className="w-full">
                  <Button size="lg" className="w-full h-12 text-base">
                    <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                    Find Your Match
                  </Button>
                </Link>
                <Link to="/signup" className="w-full">
                  <Button variant="outline" size="lg" className="w-full h-11">
                    <MapPin className="w-4 h-4 mr-2" />
                    Browse Singles Near Me
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-3 mt-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Free to join
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  18+ only
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Private
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 px-4 border-y border-border bg-card/50">
        <div className="grid grid-cols-3 gap-3 text-center max-w-md mx-auto">
          <div>
            <p className="text-xl font-display font-bold text-gradient">50K+</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active Singles</p>
          </div>
          <div>
            <p className="text-xl font-display font-bold text-gradient-gold">2K+</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Matches Daily</p>
          </div>
          <div>
            <p className="text-xl font-display font-bold text-gradient">36</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">States Covered</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-display font-bold mb-6 text-center">
            Why Singles Choose Us
          </h2>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-sensual flex-shrink-0 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flirty CTA */}
      <section className="py-10 px-4 bg-card/50">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-display font-bold mb-3 text-center">
            Tired of Being <span className="text-gradient">Single</span>?
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-5">
            Your DMs are dry. Your friends are getting married. And you are still swiping through fakes?
          </p>

          <div className="glass rounded-xl p-5">
            <p className="text-center mb-3">
              <span className="text-xl">🔥</span> <strong>Na your time now!</strong>
            </p>
            <p className="text-xs text-muted-foreground text-center leading-relaxed mb-4">
              SinglezConnect is different. Every profile is real. Our smart matching connects you with singles who are actually ready for something real.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {["Lagos", "Abuja", "PH", "Ibadan", "Kano", "+31 more"].map((city) => (
                <span key={city} className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px]">
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium */}
      <section className="py-10 px-4">
        <div className="max-w-md mx-auto">
          <div className="glass rounded-xl p-5 border-secondary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Crown className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-bold">Go Premium</h3>
                <p className="text-xs text-muted-foreground">Unlock all features</p>
              </div>
            </div>

            <ul className="space-y-2.5 mb-5">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-secondary" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link to="/signup">
              <Button variant="gold" className="w-full h-11">
                <Zap className="w-4 h-4 mr-2" />
                Start Free, Upgrade Anytime
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-4 bg-card/50">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-display font-bold mb-5 text-center">
            Real Love Stories
          </h2>
          <div className="space-y-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm mb-3 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-sensual flex items-center justify-center text-xs font-bold text-white">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-[10px] text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-10 px-4">
        <div className="max-w-md mx-auto">
          <div className="glass rounded-xl p-6 text-center">
            <h2 className="text-xl font-display font-bold mb-3">
              Your <span className="text-gradient">Person</span> Is Waiting
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Join SinglezConnect today and start your love story. Free to sign up!
            </p>
            <Link to="/signup">
              <Button size="lg" className="w-full h-12">
                <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                Create Free Account
              </Button>
            </Link>
            <p className="text-[10px] text-muted-foreground mt-3">
              Nigeria Only • 18+ • No credit card needed
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-sensual flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-sm">SinglezConnect</span>
          </div>

          <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} SinglezConnect. Adults 18+ only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
