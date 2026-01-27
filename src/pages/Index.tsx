import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Shield, Flame, MessageCircle, Crown, Sparkles, Users, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const features = [
    {
      icon: MapPin,
      title: "Location-Based",
      description: "Find matches near you across Nigeria with precise location filtering",
    },
    {
      icon: Shield,
      title: "Verified & Secure",
      description: "All users are verified adults. Your privacy is our priority",
    },
    {
      icon: MessageCircle,
      title: "Real-Time Chat",
      description: "Connect instantly with premium messaging features",
    },
  ];

  const testimonials = [
    {
      name: "Ada O.",
      location: "Lagos",
      text: "Finally found someone who gets me! NaughtyHooks made it so easy to connect.",
      rating: 5,
    },
    {
      name: "Chidi K.",
      location: "Abuja", 
      text: "The location feature is amazing. Met my match within a week!",
      rating: 5,
    },
    {
      name: "Ngozi M.",
      location: "Port Harcourt",
      text: "Best dating app in Nigeria. Real people, real connections.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-80 md:h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
          <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-secondary/15 rounded-full blur-2xl animate-pulse-slow delay-500" />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 p-4 md:p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <span className="text-xl md:text-2xl font-display font-bold text-gradient">NaughtyHooks</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {isLoggedIn ? (
                <Link to="/discover">
                  <Button size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Discover
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      Sign In
                    </Button>
                    <Button variant="ghost" size="icon" className="sm:hidden">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6">
                <Crown className="w-3 h-3 text-secondary" />
                <span className="text-xs text-muted-foreground">Nigeria's Premier Adult Dating</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-4 leading-tight">
                Where <span className="text-gradient">Desire</span> Meets{" "}
                <span className="text-gradient-gold">Connection</span>
              </h1>
              
              <p className="text-base md:text-xl text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
                Your next romantic adventure awaits. Meet real, verified adults who share your passions. 
                Life's too short for boring connections. 🔥
              </p>

              <div className="glass rounded-2xl p-4 md:p-6 mb-8 max-w-md mx-auto">
                <p className="text-sm md:text-base font-medium text-foreground mb-2">
                  "Stop scrolling through fake profiles. Find someone real tonight."
                </p>
                <p className="text-xs text-muted-foreground">
                  — Join 10,000+ Nigerians finding love & excitement
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto group">
                    <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Start Your Journey
                  </Button>
                </Link>
                <Link to={isLoggedIn ? "/discover" : "/signup"} className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <MapPin className="w-4 h-4" />
                    Explore Nearby
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                ✨ Free to join • 🔒 100% Private • 🇳🇬 Nigeria Only • 18+
              </p>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator - hidden on mobile */}
        <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-2.5 rounded-full bg-primary" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 relative glass-gradient">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-display font-bold text-gradient">10K+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Active Users</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">500+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Matches Daily</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-display font-bold text-gradient">20</p>
              <p className="text-xs md:text-sm text-muted-foreground">Cities Covered</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Why <span className="text-gradient">NaughtyHooks</span>?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              We've built the most secure and exciting platform for adult connections in Nigeria
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 md:p-8 group hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-sensual flex items-center justify-center mb-4 md:mb-6 group-hover:shadow-glow transition-shadow duration-300">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-display font-semibold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flirty Copy Section */}
      <section className="py-16 md:py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-sensual opacity-5" />
        <div className="container mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Tired of <span className="text-gradient">Lonely Nights</span>?
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We get it. Dating in Nigeria can be... complicated. Between fake profiles, 
                time-wasters, and people who ghost after one message, finding genuine 
                connections feels impossible.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                NaughtyHooks changes everything. Every user is verified. Every profile is real. 
                And our smart matching ensures you only see people who are actually looking for 
                what you want. 💋
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-sensual flex items-center justify-center text-primary-foreground font-bold">A</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-secondary-foreground font-bold">C</div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">N</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Join 10,000+ verified Nigerians
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="glass rounded-2xl p-4 md:p-6">
                <Sparkles className="w-8 h-8 text-secondary mb-3" />
                <h3 className="font-display font-semibold mb-2">Smart Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Our algorithm learns what you like and finds your perfect match
                </p>
              </div>
              <div className="glass rounded-2xl p-4 md:p-6">
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-semibold mb-2">Real People</h3>
                <p className="text-sm text-muted-foreground">
                  Every profile verified. No bots. No fakes.
                </p>
              </div>
              <div className="glass rounded-2xl p-4 md:p-6">
                <Shield className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-display font-semibold mb-2">Your Secret</h3>
                <p className="text-sm text-muted-foreground">
                  Discreet browsing. Your privacy protected.
                </p>
              </div>
              <div className="glass rounded-2xl p-4 md:p-6">
                <Heart className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-semibold mb-2">Free Likes</h3>
                <p className="text-sm text-muted-foreground">
                  See who likes you. Completely free.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Real Stories, Real <span className="text-gradient-gold">Connections</span>
            </h2>
            <p className="text-muted-foreground">
              Hear from Nigerians who found love on NaughtyHooks
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-sensual flex items-center justify-center text-primary-foreground font-bold">
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

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-sensual opacity-10" />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 md:p-16 text-center"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 md:mb-6">
              Ready to <span className="text-gradient">Ignite</span> Your Night?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8 md:mb-10">
              Stop waiting. Start connecting. Your next adventure is just a click away. 
              Join thousands of verified adults finding real connections across Nigeria.
            </p>
            <Link to="/signup">
              <Button variant="gold" size="xl">
                <Flame className="w-5 h-5" />
                Join Now — It's Free
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              No credit card required • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" />
              <span className="text-lg font-display font-bold">NaughtyHooks</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground text-center md:text-right">
              © 2026 NaughtyHooks. Adults 18+ only. Nigeria only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
