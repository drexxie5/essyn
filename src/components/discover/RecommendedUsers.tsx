import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Sparkles, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileCard from "./ProfileCard";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface RecommendedUsersProps {
  currentUserProfile: Profile;
  likedProfiles: Set<string>;
  onBack: () => void;
  onLike: (profile: Profile) => void;
  onMessage: (profile: Profile) => void;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const RecommendedUsers = ({
  currentUserProfile,
  likedProfiles,
  onBack,
  onLike,
  onMessage,
  calculateDistance,
}: RecommendedUsersProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  useEffect(() => {
    fetchRecommendedUsers();
    
    const channel = supabase
      .channel('recommended-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchRecommendedUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stateFilter]);

  const fetchRecommendedUsers = async () => {
    setLoading(true);
    try {
      // Show opposite gender by default (males see females, females see males)
      const oppositeGender = currentUserProfile.gender === "male" ? "female" : 
                             currentUserProfile.gender === "female" ? "male" : null;
      
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserProfile.id)
        .eq("is_banned", false)
        .order("created_at", { ascending: false });

      // Apply opposite gender filter
      if (oppositeGender) {
        query = query.eq("gender", oppositeGender);
      }

      if (stateFilter.trim()) {
        query = query.ilike("city", `%${stateFilter.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error("Failed to load recommended users");
    } finally {
      setLoading(false);
    }
  };

  const filteredStates = NIGERIAN_STATES.filter(state =>
    state.toLowerCase().includes(stateFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Recommended Singles</h1>
          </div>
        </div>

        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by state (e.g. Lagos, Abuja)"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setShowStateDropdown(true);
              }}
              onFocus={() => setShowStateDropdown(true)}
              className="pl-10 h-11 rounded-xl bg-muted/50 border-0"
            />
            {stateFilter && (
              <button
                onClick={() => {
                  setStateFilter("");
                  setShowStateDropdown(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {showStateDropdown && stateFilter && filteredStates.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-30">
              {filteredStates.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setStateFilter(state);
                    setShowStateDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {state} State
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          {profiles.length} singles {stateFilter ? `in ${stateFilter}` : "waiting to connect"}
        </p>

        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-display font-bold mb-2">No singles found</h2>
            <p className="text-muted-foreground text-sm">
              {stateFilter ? `No singles in ${stateFilter} yet` : "Check back later!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {profiles.map((profile, index) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                index={index}
                isLiked={likedProfiles.has(profile.id)}
                isPremium={currentUserProfile.is_premium || false}
                currentUserLat={currentUserProfile.latitude}
                currentUserLng={currentUserProfile.longitude}
                onLike={onLike}
                onMessage={onMessage}
                calculateDistance={calculateDistance}
                variant="grid"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedUsers;
