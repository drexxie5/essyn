import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, MapPin, Calendar, Crown, Flag, Lock, Sparkles, User, Target, BadgeCheck } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import type { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  hobbies?: string[];
  interests?: string[];
  looking_for?: string;
};

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportCategory, setReportCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Get current user profile
      const { data: currentUserData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      
      setCurrentUser(currentUserData);

      // Get viewed user profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error || !profileData) {
        toast.error("Profile not found");
        navigate(-1);
        return;
      }

      setProfile(profileData);

      // Check if already liked
      const { data: likeData } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", session.user.id)
        .eq("liked_id", userId)
        .maybeSingle();

      setIsLiked(!!likeData);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile) return;

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("liker_id", session.user.id)
        .eq("liked_id", profile.id);
      
      setIsLiked(false);
      toast.success("Like removed");
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({
          liker_id: session.user.id,
          liked_id: profile.id,
        });

      if (!error) {
        setIsLiked(true);
        toast.success(`You liked ${profile.username}!`);
        
        // Create notification
        await supabase.from("notifications").insert({
          user_id: profile.id,
          type: "like",
          title: `${currentUser?.username} liked you!`,
          message: "Check out their profile",
          related_user_id: session.user.id,
        });
      }
    }
  };

  const handleMessage = async () => {
    if (!currentUser?.is_premium) {
      toast.error("Upgrade to Premium to send messages!");
      navigate("/premium");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile) return;

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

      if (!error && newChat) {
        navigate(`/chat/${newChat.id}`);
      }
    }
  };

  const handleReport = async () => {
    if (!reportCategory || !reportReason.trim()) {
      toast.error("Please select a reason and provide details");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile) return;

    const { error } = await supabase.from("reports").insert({
      reporter_id: session.user.id,
      reported_user_id: profile.id,
      reason: `${reportCategory}: ${reportReason}`,
    });

    if (!error) {
      toast.success("Report submitted. Our team will review it.");
      setReportOpen(false);
      setReportReason("");
      setReportCategory("");
    } else {
      toast.error("Failed to submit report");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </AppLayout>
    );
  }

  const allImages = [
    profile.profile_image_url,
    ...(profile.profile_images || []),
  ].filter(Boolean) as string[];

  return (
    <AppLayout showNav={false} showHeader={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-display font-bold">{profile.username}</span>
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <button className="p-2 -mr-2 text-muted-foreground hover:text-destructive">
                  <Flag className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report {profile.username}</DialogTitle>
                  <DialogDescription>
                    Help us keep SinglezConnect safe by reporting inappropriate behavior.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Select value={reportCategory} onValueChange={setReportCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fake_profile">Fake Profile</SelectItem>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="underage">Suspected Underage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Details</Label>
                    <Textarea
                      placeholder="Tell us more about what happened..."
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleReport} className="w-full">
                    Submit Report
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Main Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted relative">
            <img
              src={selectedImage || profile.profile_image_url || "/placeholder.svg"}
              alt={profile.username}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Online
              </span>
            </div>
            {profile.is_premium && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-gold text-secondary-foreground text-sm font-medium">
                <Crown className="w-4 h-4" />
                Premium
              </div>
            )}
          </div>

          {/* Image Gallery */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    (selectedImage || allImages[0]) === img
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold">
                {profile.username}, {profile.age}
              </h1>
              {profile.is_verified && <VerifiedBadge size="lg" />}
            </div>
              <div className="flex items-center gap-4 text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.city || "Nigeria"}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {profile.gender === "male" ? "Man" : profile.gender === "female" ? "Woman" : profile.gender?.replace("_", " ")}
                </span>
              </div>
            </div>

            {profile.bio && (
              <div className="glass rounded-xl p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  About Me
                </h2>
                <p className="text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div className="glass rounded-xl p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Profile Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Age</span>
                  <p className="font-medium">{profile.age} years</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Gender</span>
                  <p className="font-medium capitalize">{profile.gender?.replace("_", " ")}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Interested In</span>
                  <p className="font-medium capitalize">
                    {profile.interested_in === "male" ? "Men" : 
                     profile.interested_in === "female" ? "Women" : 
                     profile.interested_in?.replace("_", " ")}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Location</span>
                  <p className="font-medium">{profile.city || "Nigeria"}</p>
                </div>
              </div>
            </div>

            {/* Looking For */}
            {(profile as Profile).looking_for && (
              <div className="glass rounded-xl p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Looking For
                </h2>
                <p className="text-sm font-medium">{(profile as Profile).looking_for}</p>
              </div>
            )}

            {/* Hobbies */}
            {((profile as Profile).hobbies || []).length > 0 && (
              <div className="glass rounded-xl p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Hobbies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {((profile as Profile).hobbies || []).map((hobby) => (
                    <Badge key={hobby} variant="secondary">{hobby}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {((profile as Profile).interests || []).length > 0 && (
              <div className="glass rounded-xl p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {((profile as Profile).interests || []).map((interest) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="glass rounded-xl p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </h2>
              <p className="text-sm">
                {profile.created_at 
                  ? new Date(profile.created_at).toLocaleDateString("en-NG", { 
                      month: "long", 
                      year: "numeric" 
                    })
                  : "Recently joined"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-6">
            <Button
              size="lg"
              variant={isLiked ? "default" : "outline"}
              className="flex-1 h-14"
              onClick={handleLike}
            >
              <Heart className={`w-5 h-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {isLiked ? "Liked" : "Like"}
            </Button>
            <Button
              size="lg"
              className="flex-1 h-14"
              onClick={handleMessage}
            >
              {currentUser?.is_premium ? (
                <>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Message
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserProfile;
