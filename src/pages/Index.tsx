import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Shield, MessageCircle, Crown, Sparkles, Users, Star, Check, Zap } from "lucide-react";
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
      description: "Discover singles in your city. Real people, real connections, right where you are.",
    },
    {
      icon: Shield,
      title: "Safe & Private",
      description: "Your identity stays protected. Connect confidently with verified adults only.",
    },
    {
      icon: MessageCircle,
      title: "Chat Instantly",
      description: "No waiting games. Match and start meaningful conversations right away.",
    },
  ];

  const testimonials = [
    {
      name: "Chioma A.",
      location: "Lagos",
      text: "I was tired of empty promises. SinglezConnect brought me someone real. We're planning our future together! 💕",
      rating: 5,
    },
    {
      name: "Emeka J.",
      location: "Abuja",
      text: "Met my queen here! The location feature is perfect—she was right in my area. Best decision ever.",
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-dark">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-32 right-10 w-60 h-60 bg-accent/15 rounded-full blur-[100px]" />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 py-4 px-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-sensual flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-display font-bold">SinglezConnect</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/premium">
                <Button variant="gold" size="sm" className="hidden sm:flex">
                  <Crown className="w-3.5 h-3.5 mr-1" />
                  Premium
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-muted-foreground">1,000+ singles online now</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 leading-[1.1]">
                Stop Searching.{" "}
                <span className="text-gradient">Start Connecting.</span>
              </h1>
              
              <p className="text-base text-muted-foreground mb-6 leading-relaxed max-w-md mx-auto">
                Your person is waiting. Join thousands of Nigerians finding love, companionship, and 
                real connections every day. No games, no fakes—just genuine singles ready to meet you. 💫
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/signup" className="w-full">
                  <Button size="lg" className="w-full h-14 text-base">
                    <Heart className="w-5 h-5 mr-2" fill="currentColor" />
                    Find Your Match Now
                  </Button>
                </Link>
                <Link to="/signup" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Browse Singles Near Me
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
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
                  100% private
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 px-4 border-y border-border bg-card/50">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-2xl sm:text-3xl font-display font-bold text-gradient">50K+</p>
              <p className="text-xs text-muted-foreground mt-1">Active Singles</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">2K+</p>
              <p className="text-xs text-muted-foreground mt-1">Matches Daily</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-2xl sm:text-3xl font-display font-bold text-gradient">36</p>
              <p className="text-xs text-muted-foreground mt-1">States Covered</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              Why Singles Choose Us
            </h2>
            <p className="text-muted-foreground text-sm">
              Built for Nigerians who are done with the dating games
            </p>
          </motion.div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-4 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-sensual flex-shrink-0 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flirty Copy Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
              Tired of Being <span className="text-gradient">Single</span>?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your DMs are dry. Your ex moved on. Your friends are getting married. 
              And you're still swiping through fakes and catfish? 😩
            </p>
          </motion.div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <p className="text-center leading-relaxed">
              <span className="text-2xl">🔥</span> <strong>Na your time now!</strong>
            </p>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              SinglezConnect is different. Every profile is real. Every person is verified. 
              Our smart matching connects you with singles who are <em>actually ready</em> for 
              something real—not just another "hey" that goes nowhere.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">Lagos</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">Abuja</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">PH</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">Ibadan</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">Kano</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">+31 more</span>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-6 border-secondary/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Crown className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Go Premium</h3>
                <p className="text-xs text-muted-foreground">Unlock all features</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-secondary" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link to="/signup">
              <Button variant="gold" className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Start Free, Upgrade Anytime
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
              Real Love Stories 💕
            </h2>
            <p className="text-muted-foreground text-sm">
              From our Nigerian singles community
            </p>
          </motion.div>

          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm mb-3 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-sensual flex items-center justify-center text-sm font-bold text-white">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
              Your <span className="text-gradient">Person</span> Is Waiting
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Don't spend another night scrolling alone. Join SinglezConnect today 
              and start your love story. It's free to sign up! 🥰
            </p>
            <Link to="/signup">
              <Button size="lg" className="w-full h-14 text-base">
                <Heart className="w-5 h-5 mr-2" fill="currentColor" />
                Create Free Account
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              🇳🇬 Nigeria Only • 18+ • No credit card needed
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-sensual flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-bold">SinglezConnect</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SinglezConnect. Adults 18+ only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
