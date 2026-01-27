import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    fetchRecommendedUsers();
    
    // Subscribe to realtime changes for new profiles
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
  }, []);

  const fetchRecommendedUsers = async () => {
    setLoading(true);
    try {
      // Fetch ALL users regardless of location - recommended users
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserProfile.id)
        .eq("is_banned", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error("Failed to load recommended users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Recommended For You</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          {profiles.length} singles waiting to connect
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-16 w-full mt-1" />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">No users found</h2>
            <p className="text-muted-foreground text-sm">Check back later for new singles!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
