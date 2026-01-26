import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Heart, MapPin, MessageCircle, Crown, Filter, Lock, ChevronLeft, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  
  // Filters
  const [ageRange, setAgeRange] = useState([18, 50]);
  const [distanceKm, setDistanceKm] = useState(100);
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    
    if (profile) {
      setCurrentUserProfile(profile);
      fetchProfiles(profile);
      fetchLikedProfiles(session.user.id);
    }
  };

  const fetchLikedProfiles = async (userId: string) => {
    const { data } = await supabase
      .from("likes")
      .select("liked_id")
      .eq("liker_id", userId);
    
    if (data) {
      setLikedProfiles(new Set(data.map(l => l.liked_id)));
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
        .limit(50);

      if (genderFilter !== "all" && ["male", "female", "non_binary", "other"].includes(genderFilter)) {
        query = query.eq("gender", genderFilter as "male" | "female" | "non_binary" | "other");
      }

      if (cityFilter.trim()) {
        query = query.ilike("city", `%${cityFilter.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter by distance if user has location
      let filteredProfiles = data || [];
      if (userProfile.latitude && userProfile.longitude) {
        filteredProfiles = filteredProfiles.filter(p => {
          if (!p.latitude || !p.longitude) return true;
          const distance = calculateDistance(
            userProfile.latitude!,
            userProfile.longitude!,
            p.latitude,
            p.longitude
          );
          return distance <= distanceKm;
        });
      }
      
      setProfiles(filteredProfiles);
    } catch (error: any) {
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (profile: Profile) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (likedProfiles.has(profile.id)) {
      // Unlike
      await supabase
        .from("likes")
        .delete()
        .eq("liker_id", session.user.id)
        .eq("liked_id", profile.id);
      
      setLikedProfiles(prev => {
        const next = new Set(prev);
        next.delete(profile.id);
        return next;
      });
      toast.success("Removed like");
    } else {
      // Like
      const { error } = await supabase
        .from("likes")
        .insert({
          liker_id: session.user.id,
          liked_id: profile.id,
        });

      if (!error) {
        setLikedProfiles(prev => new Set(prev).add(profile.id));
        toast.success(`You liked ${profile.username}!`);
        
        // Create notification for the liked user
        await supabase.from("notifications").insert({
          user_id: profile.id,
          type: "like",
          title: `${currentUserProfile?.username} liked you!`,
          message: "Check out their profile",
          related_user_id: session.user.id,
        });
      }
    }
  };

  const handleMessage = async (profile: Profile) => {
    if (!currentUserProfile?.is_premium) {
      toast.error("Upgrade to Premium to send messages!");
      navigate("/premium");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: existingChat } = await supabase
      .from("chats")
      .select("id")
      .or(`and(user_one_id.eq.${session.user.id},user_two_id.eq.${profile.id}),and(user_one_id.eq.${profile.id},user_two_id.eq.${session.user.id})`)
      .maybeSingle();

    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
    } else {
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert({
          user_one_id: session.user.id,
          user_two_id: profile.id,
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

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
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
          max={500}
          step={5}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Location / City</label>
        <Input
          placeholder="e.g. Lagos, Abuja, Onitsha"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
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
      <div className="max-w-4xl mx-auto px-4 py-4">
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
        ) : (
          <div className="relative">
            {/* Scroll Navigation */}
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Profiles Grid */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 px-8 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {profiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex-shrink-0 w-[280px] snap-center"
                >
                  <div className="relative rounded-2xl overflow-hidden glass border border-border">
                    {/* Profile Image */}
                    <div className="aspect-[3/4] relative bg-muted">
                      <img
                        src={profile.profile_image_url || "/placeholder.svg"}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                      {/* Premium badge */}
                      {profile.is_premium && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-gold text-secondary-foreground text-xs font-medium">
                          <Crown className="w-3 h-3" />
                          Premium
                        </div>
                      )}

                      {/* Profile info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h2 className="text-xl font-display font-bold text-foreground">
                          {profile.username}, {profile.age}
                        </h2>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{profile.city || "Nigeria"}</span>
                          {currentUserProfile?.latitude && profile.latitude && (
                            <span className="ml-1">
                              • {calculateDistance(
                                currentUserProfile.latitude,
                                currentUserProfile.longitude!,
                                profile.latitude,
                                profile.longitude!
                              )} km
                            </span>
                          )}
                        </div>
                        {profile.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-2 p-3 bg-card">
                      <Button
                        size="sm"
                        variant={likedProfiles.has(profile.id) ? "default" : "outline"}
                        className={`flex-1 ${likedProfiles.has(profile.id) ? "bg-primary" : ""}`}
                        onClick={() => handleLike(profile)}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${likedProfiles.has(profile.id) ? "fill-current" : ""}`} />
                        {likedProfiles.has(profile.id) ? "Liked" : "Like"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleMessage(profile)}
                      >
                        {currentUserProfile?.is_premium ? (
                          <>
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-1" />
                            Chat
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Profile count */}
            <p className="text-center text-muted-foreground text-sm mt-2">
              Scroll to see more profiles
            </p>
          </div>
        )}

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
