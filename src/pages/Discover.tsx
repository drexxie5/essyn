import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Heart, X, MapPin, MessageCircle, Crown, Filter, Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AppLayout from "@/components/AppLayout";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Discover = () => {
  const navigate = useNavigate();
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
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
    
    // Get current user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    
    if (profile) {
      setCurrentUserProfile(profile);
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

  const handleLike = () => {
    if (!currentUserProfile?.is_premium) {
      toast.error("Upgrade to Premium to like and message users!");
      navigate("/premium");
      return;
    }
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

  const handleMessage = async () => {
    if (!currentUserProfile?.is_premium) {
      toast.error("Upgrade to Premium to send messages!");
      navigate("/premium");
      return;
    }

    const profileToMessage = profiles[currentIndex];
    if (!profileToMessage) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Create or find chat
    const { data: existingChat } = await supabase
      .from("chats")
      .select("id")
      .or(`and(user_one_id.eq.${session.user.id},user_two_id.eq.${profileToMessage.id}),and(user_one_id.eq.${profileToMessage.id},user_two_id.eq.${session.user.id})`)
      .maybeSingle();

    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
    } else {
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert({
          user_one_id: session.user.id,
          user_two_id: profileToMessage.id,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("row-level security")) {
          navigate("/premium");
        } else {
          toast.error("Failed to start chat");
        }
      } else {
        navigate(`/chat/${newChat.id}`);
      }
    }
  };

  const displayProfile = profiles[currentIndex];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const FiltersContent = () => (
    <div className="space-y-6 p-4">
      <div className="space-y-3">
        <label className="text-sm font-medium">Age Range: {ageRange[0]} - {ageRange[1]}</label>
        <Slider
          value={ageRange}
          onValueChange={setAgeRange}
          min={18}
          max={70}
          step={1}
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

      <Button
        className="w-full"
        onClick={() => currentUserProfile && fetchProfiles(currentUserProfile)}
      >
        Apply Filters
      </Button>
    </div>
  );

  return (
    <AppLayout title="Discover">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Header with filters */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {profiles.length} people nearby
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Filter Matches</SheetTitle>
              </SheetHeader>
              <FiltersContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-pulse text-center">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Finding matches near you...</p>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">No profiles found</h2>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters</p>
          </div>
        ) : displayProfile ? (
          <div>
            {/* Profile Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={displayProfile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative rounded-3xl overflow-hidden glass"
              >
                {/* Profile Image */}
                <div className="aspect-[3/4] relative bg-muted">
                  <img
                    src={displayProfile.profile_image_url || "/placeholder.svg"}
                    alt={displayProfile.username}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                  {/* Premium badge */}
                  {displayProfile.is_premium && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-gold text-secondary-foreground text-xs font-medium">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}

                  {/* Profile info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-2xl font-display font-bold mb-1">
                      {displayProfile.username}, {displayProfile.age}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{displayProfile.city || "Nigeria"}</span>
                      {currentUserProfile?.latitude && displayProfile.latitude && (
                        <span>
                          • {calculateDistance(
                            currentUserProfile.latitude,
                            currentUserProfile.longitude!,
                            displayProfile.latitude,
                            displayProfile.longitude!
                          )} km
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
              </motion.div>
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14 p-0"
                onClick={handlePass}
              >
                <X className="w-6 h-6" />
              </Button>

              <Button
                size="lg"
                className="rounded-full w-16 h-16 p-0 bg-gradient-sensual hover:opacity-90"
                onClick={handleLike}
              >
                <Heart className="w-7 h-7 text-white" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14 p-0 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                onClick={handleMessage}
              >
                {currentUserProfile?.is_premium ? (
                  <MessageCircle className="w-6 h-6" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Profile counter */}
            <p className="text-center text-muted-foreground mt-3 text-xs">
              {currentIndex + 1} of {profiles.length}
            </p>
          </div>
        ) : null}

        {/* Premium CTA for non-premium users */}
        {!currentUserProfile?.is_premium && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <button
              onClick={() => navigate("/premium")}
              className="w-full glass rounded-2xl p-4 flex items-center gap-4 border-secondary/30 hover:border-secondary transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-display font-bold">Unlock Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Send messages & see who likes you
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Discover;
