import { Button } from "@/components/ui/button";
import { Heart, MapPin, Shield, Flame, MessageCircle, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-80 md:h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 p-4 md:p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <span className="text-xl md:text-2xl font-display font-bold text-gradient">NaughtyHooks</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
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
              
              <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                Connect with like-minded adults in your area. Real people, real connections. 18+ only, Nigeria exclusive.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto group">
                    <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Start Your Journey
                  </Button>
                </Link>
                <Link to="/discover" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <MapPin className="w-4 h-4" />
                    Explore Nearby
                  </Button>
                </Link>
              </div>
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

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Why <span className="text-gradient">NaughtyHooks</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We've built the most secure and exciting platform for adult connections in Nigeria
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-8 group hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-sensual flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow duration-300">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-sensual opacity-10" />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Ready to <span className="text-gradient">Ignite</span> Your Night?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
              Join thousands of verified adults finding real connections across Nigeria. 
              Your next adventure is just a click away.
            </p>
            <Link to="/signup">
              <Button variant="gold" size="xl">
                <Flame className="w-5 h-5" />
                Join Now — It's Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" />
              <span className="text-lg font-display font-bold">NaughtyHooks</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 NaughtyHooks. Adults 18+ only. Nigeria only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
