import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Heart, X, MapPin, MessageCircle, Crown, Filter, 
  Flame, ChevronRight, Lock, LogOut, User, Settings
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Discover = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filters
  const [ageRange, setAgeRange] = useState([18, 50]);
  const [distanceKm, setDistanceKm] = useState(50);
  const [genderFilter, setGenderFilter] = useState<string>("all");

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
    
    // Get current user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    
    if (profile) {
      setCurrentProfile(profile);
      fetchProfiles(profile);
    }
  };

  const fetchProfiles = async (userProfile: Profile) => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", userProfile.id)
        .eq("is_banned", false)
        .gte("age", ageRange[0])
        .lte("age", ageRange[1])
        .order("last_active", { ascending: false })
        .limit(20);

      if (genderFilter !== "all" && ["male", "female", "non_binary", "other"].includes(genderFilter)) {
        query = query.eq("gender", genderFilter as "male" | "female" | "non_binary" | "other");
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfiles(data || []);
      setCurrentIndex(0);
    } catch (error: any) {
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleLike = () => {
    if (!currentProfile?.is_premium) {
      toast.error("Upgrade to Premium to like and message users!");
      return;
    }
    // In real app, save like to database
    toast.success("Profile liked!");
    nextProfile();
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.info("You've seen all available profiles. Check back later!");
    }
  };

  const handleMessage = () => {
    if (!currentProfile?.is_premium) {
      toast.error("Upgrade to Premium to send messages!");
      return;
    }
    // Navigate to chat
    navigate(`/chat/${profiles[currentIndex]?.id}`);
  };

  const displayProfile = profiles[currentIndex];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <span className="text-xl font-display font-bold text-gradient">NaughtyHooks</span>
          </Link>

          <div className="flex items-center gap-2">
            {!currentProfile?.is_premium && (
              <Link to="/premium">
                <Button variant="gold" size="sm" className="hidden sm:flex">
                  <Crown className="w-4 h-4" />
                  Go Premium
                </Button>
              </Link>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
            </Button>

            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Age Range: {ageRange[0]} - {ageRange[1]}</label>
                  <Slider
                    value={ageRange}
                    onValueChange={setAgeRange}
                    min={18}
                    max={70}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Distance: {distanceKm} km</label>
                  <Slider
                    value={[distanceKm]}
                    onValueChange={([val]) => setDistanceKm(val)}
                    min={5}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Show me</label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="male">Men</SelectItem>
                      <SelectItem value="female">Women</SelectItem>
                      <SelectItem value="non_binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="hero"
                size="sm"
                className="mt-4"
                onClick={() => currentProfile && fetchProfiles(currentProfile)}
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-pulse text-center">
              <Flame className="w-12 h-12 text-primary mx-auto mb-4 animate-glow" />
              <p className="text-muted-foreground">Finding matches near you...</p>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">No profiles found</h2>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or check back later</p>
            <Button variant="hero" onClick={() => setShowFilters(true)}>
              Adjust Filters
            </Button>
          </div>
        ) : displayProfile ? (
          <div className="max-w-md mx-auto">
            {/* Profile Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={displayProfile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-3xl overflow-hidden glass"
              >
                {/* Profile Image */}
                <div className="aspect-[3/4] relative">
                  <img
                    src={displayProfile.profile_image_url || "/placeholder.svg"}
                    alt={displayProfile.username}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                  {/* Premium badge */}
                  {displayProfile.is_premium && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-gold text-secondary-foreground text-sm font-medium">
                      <Crown className="w-4 h-4" />
                      Premium
                    </div>
                  )}

                  {/* Profile info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-3xl font-display font-bold mb-1">
                      {displayProfile.username}, {displayProfile.age}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{displayProfile.city}</span>
                      {currentProfile?.latitude && displayProfile.latitude && (
                        <span className="text-sm">
                          • {calculateDistance(
                            currentProfile.latitude,
                            currentProfile.longitude!,
                            displayProfile.latitude,
                            displayProfile.longitude!
                          )} km away
                        </span>
                      )}
                    </div>
                    {displayProfile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {displayProfile.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-4 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="xl"
                    className="rounded-full w-16 h-16"
                    onClick={handlePass}
                  >
                    <X className="w-7 h-7" />
                  </Button>

                  <Button
                    variant="hero"
                    size="xl"
                    className="rounded-full w-20 h-20"
                    onClick={handleLike}
                  >
                    <Heart className="w-9 h-9" />
                  </Button>

                  <Button
                    variant="gold"
                    size="xl"
                    className="rounded-full w-16 h-16"
                    onClick={handleMessage}
                  >
                    {currentProfile?.is_premium ? (
                      <MessageCircle className="w-7 h-7" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Profile counter */}
            <p className="text-center text-muted-foreground mt-4 text-sm">
              {currentIndex + 1} of {profiles.length} profiles
            </p>
          </div>
        ) : null}

        {/* Premium CTA for non-premium users */}
        {!currentProfile?.is_premium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-8"
          >
            <div className="glass rounded-2xl p-6 border-secondary/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg mb-1">Unlock Premium</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send unlimited messages, see who likes you, and more!
                  </p>
                  <Link to="/premium">
                    <Button variant="gold" size="sm" className="group">
                      View Plans
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Discover;
