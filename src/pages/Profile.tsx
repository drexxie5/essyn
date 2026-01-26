import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, LogOut, Camera, MapPin, Calendar, 
  Shield, Crown, Edit2, Check, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    city: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          username: data.username || "",
          bio: data.bio || "",
          city: data.city || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          bio: formData.bio,
          city: formData.city,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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

  return (
    <AppLayout title="Profile">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="relative">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={profile?.profile_image_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {profile?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <h1 className="mt-4 text-xl font-display font-bold">
              {profile?.username}
            </h1>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <MapPin className="w-3 h-3" />
              <span>{profile?.city || "Nigeria"}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{profile?.age} years</span>
            </div>

            {profile?.is_premium && (
              <div className="mt-2 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-gold text-secondary-foreground text-xs font-medium">
                <Crown className="w-3 h-3" />
                Premium Member
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Profile Info</h2>
            {editing ? (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleUpdate}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">Username</Label>
              {editing ? (
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">{profile?.username}</p>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Bio</Label>
              {editing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <p className="text-sm">{profile?.bio || "No bio yet"}</p>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">City</Label>
              {editing ? (
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">{profile?.city || "Not set"}</p>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-sm">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Premium Status */}
        {!profile?.is_premium && (
          <button
            onClick={() => navigate("/premium")}
            className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:border-secondary transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center">
              <Crown className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-semibold">Upgrade to Premium</h3>
              <p className="text-sm text-muted-foreground">
                Unlock messaging & see who likes you
              </p>
            </div>
          </button>
        )}

        {/* Settings Links */}
        <div className="glass rounded-2xl overflow-hidden">
          <button className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors border-b border-border">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">Settings</span>
          </button>
          <button className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors border-b border-border">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">Privacy & Safety</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left">Log Out</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
