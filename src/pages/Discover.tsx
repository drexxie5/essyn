import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Heart, Filter, Crown, ChevronLeft, ChevronRight, Sparkles, Users
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
import ProfileCard from "@/components/discover/ProfileCard";
import RecommendedUsers from "@/components/discover/RecommendedUsers";
import DiscoverFilters from "@/components/discover/DiscoverFilters";
import MatchCelebration from "@/components/MatchCelebration";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Discover = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const [showRecommended, setShowRecommended] = useState(false);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  
  // Filters - now distance is optional, not applied by default
  const [ageRange, setAgeRange] = useState([18, 50]);
  const [distanceKm, setDistanceKm] = useState(500);
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [useDistanceFilter, setUseDistanceFilter] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Realtime subscription for new profiles
  useEffect(() => {
    const channel = supabase
      .channel('discover-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          if (currentUserProfile) {
            fetchProfiles(currentUserProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserProfile]);

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
      const preferredGender = userProfile.interested_in;
      
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", userProfile.id)
        .eq("is_banned", false)
        .gte("age", ageRange[0])
        .lte("age", ageRange[1])
        .order("last_active", { ascending: false });

      if (preferredGender && preferredGender !== "other") {
        query = query.eq("gender", preferredGender);
      }
      
      if (genderFilter !== "all" && ["male", "female", "non_binary", "other"].includes(genderFilter)) {
        query = query.eq("gender", genderFilter as "male" | "female" | "non_binary" | "other");
      }

      if (cityFilter.trim()) {
        query = query.ilike("city", `%${cityFilter.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredProfiles = data || [];
      
      // Only apply distance filter if user explicitly enabled it
      if (useDistanceFilter && userProfile.latitude && userProfile.longitude) {
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
      const { error } = await supabase
        .from("likes")
        .insert({
          liker_id: session.user.id,
          liked_id: profile.id,
        });

      if (!error) {
        setLikedProfiles(prev => new Set(prev).add(profile.id));
        toast.success(`You liked ${profile.username}!`);
        
        // Check if they already liked us (mutual like = match!)
        const { data: mutualLike } = await supabase
          .from("likes")
          .select("id")
          .eq("liker_id", profile.id)
          .eq("liked_id", session.user.id)
          .maybeSingle();
        
        if (mutualLike) {
          // Create a match!
          const { error: matchError } = await supabase
            .from("matches")
            .insert({
              user_one_id: session.user.id,
              user_two_id: profile.id,
            });
          
          if (!matchError) {
            setMatchedProfile(profile);
            setShowMatchCelebration(true);
            
            // Notify both users
            await supabase.from("notifications").insert([
              {
                user_id: profile.id,
                type: "match",
                title: `You matched with ${currentUserProfile?.username}!`,
                message: "Start chatting now!",
                related_user_id: session.user.id,
              },
              {
                user_id: session.user.id,
                type: "match",
                title: `You matched with ${profile.username}!`,
                message: "Start chatting now!",
                related_user_id: profile.id,
              }
            ]);
          }
        } else {
          // Just a regular like notification
          await supabase.from("notifications").insert({
            user_id: profile.id,
            type: "like",
            title: `${currentUserProfile?.username} likes you!`,
            message: "Like them back to match!",
            related_user_id: session.user.id,
          });
        }
      }
    }
  };

  const handleStartChatFromMatch = async () => {
    if (!matchedProfile) return;
    setShowMatchCelebration(false);
    await handleMessage(matchedProfile);
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

  // Show recommended users view
  if (showRecommended && currentUserProfile) {
    return (
      <RecommendedUsers
        currentUserProfile={currentUserProfile}
        likedProfiles={likedProfiles}
        onBack={() => setShowRecommended(false)}
        onLike={handleLike}
        onMessage={handleMessage}
        calculateDistance={calculateDistance}
      />
    );
  }

  return (
    <AppLayout title="Discover">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Recommendations Button - Replaces Search Bar */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowRecommended(true)}
          className="w-full mb-4 p-4 rounded-2xl bg-gradient-sensual text-primary-foreground flex items-center justify-center gap-3 shadow-glow hover:shadow-lg transition-all"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-display font-semibold">View Recommended Singles</span>
          <Users className="w-5 h-5" />
        </motion.button>

        {/* Header with filters */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {profiles.length} singles {useDistanceFilter ? "nearby" : "available"}
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Singles</SheetTitle>
              </SheetHeader>
              <DiscoverFilters
                ageRange={ageRange}
                setAgeRange={setAgeRange}
                distanceKm={distanceKm}
                setDistanceKm={setDistanceKm}
                cityFilter={cityFilter}
                setCityFilter={setCityFilter}
                genderFilter={genderFilter}
                setGenderFilter={setGenderFilter}
                useDistanceFilter={useDistanceFilter}
                setUseDistanceFilter={setUseDistanceFilter}
                onApply={() => currentUserProfile && fetchProfiles(currentUserProfile)}
              />
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
            <h2 className="text-xl font-display font-bold mb-2">No profiles found nearby</h2>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or check recommended singles</p>
            <Button onClick={() => setShowRecommended(true)} variant="hero">
              <Sparkles className="w-4 h-4 mr-2" />
              View Recommended
            </Button>
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

            {/* Profiles Scroll */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 px-8 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {profiles.map((profile, index) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  index={index}
                  isLiked={likedProfiles.has(profile.id)}
                  isPremium={currentUserProfile?.is_premium || false}
                  currentUserLat={currentUserProfile?.latitude}
                  currentUserLng={currentUserProfile?.longitude}
                  onLike={handleLike}
                  onMessage={handleMessage}
                  calculateDistance={calculateDistance}
                  variant="scroll"
                />
              ))}
            </div>

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

        {/* Match Celebration Modal */}
        <MatchCelebration
          isOpen={showMatchCelebration}
          matchedProfile={matchedProfile}
          currentUserImage={currentUserProfile?.profile_image_url}
          onClose={() => setShowMatchCelebration(false)}
          onStartChat={handleStartChatFromMatch}
        />
      </div>
    </AppLayout>
  );
};

export default Discover;
