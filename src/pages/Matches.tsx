import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, Target, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import AppLayout from "@/components/AppLayout";

interface MatchProfile {
  id: string;
  username: string;
  age: number;
  city: string | null;
  profile_image_url: string | null;
  interests: string[] | null;
  hobbies: string[] | null;
  looking_for: string | null;
  is_verified: boolean;
  is_premium: boolean;
}

const Matches = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [interestMatches, setInterestMatches] = useState<MatchProfile[]>([]);
  const [lookingForMatches, setLookingForMatches] = useState<MatchProfile[]>([]);
  const [hobbyMatches, setHobbyMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Get current user profile
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!myProfile) return;
      setCurrentUser(myProfile);

      // Get all potential matches (opposite gender, not banned)
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, username, age, city, profile_image_url, interests, hobbies, looking_for, is_verified, is_premium")
        .neq("id", session.user.id)
        .eq("is_banned", false)
        .eq("gender", myProfile.interested_in);

      if (!allProfiles) return;

      // Filter by shared interests
      if (myProfile.interests?.length) {
        const interestMatched = allProfiles.filter((p) => 
          p.interests?.some((i: string) => myProfile.interests?.includes(i))
        );
        setInterestMatches(interestMatched);
      }

      // Filter by same "looking for"
      if (myProfile.looking_for) {
        const lookingForMatched = allProfiles.filter((p) => 
          p.looking_for === myProfile.looking_for
        );
        setLookingForMatches(lookingForMatched);
      }

      // Filter by shared hobbies
      if (myProfile.hobbies?.length) {
        const hobbyMatched = allProfiles.filter((p) => 
          p.hobbies?.some((h: string) => myProfile.hobbies?.includes(h))
        );
        setHobbyMatches(hobbyMatched);
      }

    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const ProfileCard = ({ profile }: { profile: MatchProfile }) => (
    <button
      onClick={() => navigate(`/user/${profile.id}`)}
      className="flex items-center gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors w-full text-left"
    >
      <Avatar className="w-14 h-14 border-2 border-primary/20">
        <AvatarImage src={profile.profile_image_url || ""} className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary">
          {profile.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate">{profile.username}</span>
          {profile.is_verified && <VerifiedBadge size="sm" />}
          {profile.is_premium && (
            <span className="text-secondary text-xs">👑</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {profile.age} • {profile.city || "Nigeria"}
        </p>
        {profile.looking_for && (
          <Badge variant="outline" className="mt-1 text-[10px]">
            {profile.looking_for}
          </Badge>
        )}
      </div>
      <Heart className="w-5 h-5 text-primary/50" />
    </button>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground text-sm">{message}</p>
      <p className="text-muted-foreground/70 text-xs mt-1">
        Update your profile to find more matches!
      </p>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Finding matches...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Your Matches">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-bold mb-1">
            Your <span className="text-gradient">Matches</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            People who share your interests and goals
          </p>
        </div>

        <Tabs defaultValue="interests" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-card/50">
            <TabsTrigger value="interests" className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Interests
            </TabsTrigger>
            <TabsTrigger value="looking" className="text-xs">
              <Target className="w-3.5 h-3.5 mr-1" />
              Looking For
            </TabsTrigger>
            <TabsTrigger value="hobbies" className="text-xs">
              <Heart className="w-3.5 h-3.5 mr-1" />
              Hobbies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interests" className="space-y-3">
            {interestMatches.length > 0 ? (
              interestMatches.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            ) : (
              <EmptyState message="No matches with shared interests yet" />
            )}
          </TabsContent>

          <TabsContent value="looking" className="space-y-3">
            {lookingForMatches.length > 0 ? (
              lookingForMatches.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            ) : (
              <EmptyState message="No matches looking for the same thing" />
            )}
          </TabsContent>

          <TabsContent value="hobbies" className="space-y-3">
            {hobbyMatches.length > 0 ? (
              hobbyMatches.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            ) : (
              <EmptyState message="No matches with shared hobbies yet" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Matches;
