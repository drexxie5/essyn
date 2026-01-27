import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, LogOut, MapPin, Calendar, 
  Shield, Crown, Edit2, Check, X, Image as ImageIcon,
  Heart, Sparkles, Target, User, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ImageUpload from "@/components/ImageUpload";
import MultiImageUpload from "@/components/MultiImageUpload";
import StateSelector from "@/components/StateSelector";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  hobbies?: string[];
  interests?: string[];
  looking_for?: string;
};

const HOBBY_OPTIONS = [
  "Reading", "Gaming", "Cooking", "Traveling", "Music", "Movies", 
  "Fitness", "Dancing", "Photography", "Art", "Sports", "Writing"
];

const INTEREST_OPTIONS = [
  "Technology", "Fashion", "Food", "Nature", "Cars", "Business",
  "Health", "Education", "Entertainment", "Spirituality", "Politics", "Science"
];

const LOOKING_FOR_OPTIONS = [
  "Serious Relationship", "Casual Dating", "Friendship", "Marriage", "Not Sure Yet"
];

// Component to update location from live geolocation
const UpdateLocationButton = ({ onLocationUpdate }: { onLocationUpdate: (city: string) => void }) => {
  const { state, loading, fetchLocation, hasLocation } = useGeolocation();
  
  useEffect(() => {
    if (state) {
      onLocationUpdate(state);
    }
  }, [state, onLocationUpdate]);

  return (
    <Button 
      type="button" 
      variant="outline" 
      size="sm" 
      onClick={fetchLocation}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          Detecting...
        </>
      ) : (
        <>
          <MapPin className="w-3 h-3 mr-2" />
          {hasLocation ? "Update from Live Location" : "Use Live Location"}
        </>
      )}
    </Button>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    city: "",
    age: 18,
    gender: "male" as "male" | "female" | "non_binary" | "other",
    hobbies: [] as string[],
    interests: [] as string[],
    looking_for: "",
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
        const profileData = data as Profile;
        setProfile(profileData);
        setFormData({
          username: profileData.username || "",
          bio: profileData.bio || "",
          city: profileData.city || "",
          age: profileData.age || 18,
          gender: profileData.gender || "male",
          hobbies: profileData.hobbies || [],
          interests: profileData.interests || [],
          looking_for: profileData.looking_for || "",
        });
        
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roleData);
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
          age: formData.age,
          gender: formData.gender,
          hobbies: formData.hobbies,
          interests: formData.interests,
          looking_for: formData.looking_for,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setProfile(prev => prev ? { 
        ...prev, 
        ...formData 
      } : null);
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

  const toggleArrayItem = (array: string[], item: string, field: 'hobbies' | 'interests') => {
    const newArray = array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
    setFormData({ ...formData, [field]: newArray });
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
            <ImageUpload
              currentImage={profile?.profile_image_url}
              onUpload={async (url) => {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) return;
                  
                  await supabase
                    .from("profiles")
                    .update({ profile_image_url: url })
                    .eq("id", session.user.id);
                  
                  setProfile(prev => prev ? { ...prev, profile_image_url: url } : null);
                  toast.success("Profile picture updated!");
                } catch (error) {
                  console.error("Failed to update profile image:", error);
                  toast.error("Failed to update profile picture");
                }
              }}
            />
            
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

            {/* Online Status */}
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-emerald-500 font-medium">Online</span>
            </div>

            {profile?.is_premium && (
              <div className="mt-2 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-gold text-secondary-foreground text-xs font-medium">
                <Crown className="w-3 h-3" />
                Premium Member
              </div>
            )}
          </div>
        </div>

        {/* Additional Photos */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold">Your Photos</h2>
          </div>
          <MultiImageUpload
            images={profile?.profile_images || []}
            maxImages={3}
            onUpload={async (urls) => {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const { error } = await supabase
                  .from("profiles")
                  .update({ profile_images: urls })
                  .eq("id", session.user.id);

                if (error) throw error;
                setProfile(prev => prev ? { ...prev, profile_images: urls } : null);
                toast.success("Photos updated!");
              } catch (error) {
                console.error("Failed to update photos:", error);
                toast.error("Failed to update photos");
              }
            }}
          />
        </div>

        {/* Profile Info */}
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

          <div className="space-y-4">
            {/* Username */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <User className="w-3 h-3" /> Username
              </Label>
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

            {/* Age */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Age
              </Label>
              {editing ? (
                <Input
                  type="number"
                  min={18}
                  max={100}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">{profile?.age} years old</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label className="text-muted-foreground text-xs">Gender</Label>
              {editing ? (
                <Select
                  value={formData.gender}
                  onValueChange={(value: "male" | "female" | "non_binary" | "other") => 
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm capitalize">{profile?.gender}</p>
              )}
            </div>

            {/* City/State */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" /> State
              </Label>
              {editing ? (
                <div className="mt-1 space-y-2">
                  <StateSelector
                    value={formData.city}
                    onChange={(value) => setFormData({ ...formData, city: value })}
                    placeholder="Select your state"
                  />
                  <UpdateLocationButton 
                    onLocationUpdate={(city) => setFormData({ ...formData, city })}
                  />
                </div>
              ) : (
                <p className="text-sm">{profile?.city || "Not set"}</p>
              )}
            </div>

            {/* Bio */}
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

            {/* Looking For */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <Target className="w-3 h-3" /> Looking For
              </Label>
              {editing ? (
                <Select
                  value={formData.looking_for}
                  onValueChange={(value) => setFormData({ ...formData, looking_for: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select what you're looking for" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOOKING_FOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">{(profile as Profile)?.looking_for || "Not specified"}</p>
              )}
            </div>

            {/* Hobbies */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <Heart className="w-3 h-3" /> Hobbies
              </Label>
              {editing ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {HOBBY_OPTIONS.map((hobby) => (
                    <Badge
                      key={hobby}
                      variant={formData.hobbies.includes(hobby) ? "default" : "outline"}
                      className="cursor-pointer transition-all"
                      onClick={() => toggleArrayItem(formData.hobbies, hobby, 'hobbies')}
                    >
                      {hobby}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {((profile as Profile)?.hobbies || []).length > 0 ? (
                    ((profile as Profile)?.hobbies || []).map((hobby) => (
                      <Badge key={hobby} variant="secondary" className="text-xs">
                        {hobby}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hobbies added</p>
                  )}
                </div>
              )}
            </div>

            {/* Interests */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Interests
              </Label>
              {editing ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer transition-all"
                      onClick={() => toggleArrayItem(formData.interests, interest, 'interests')}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {((profile as Profile)?.interests || []).length > 0 ? (
                    ((profile as Profile)?.interests || []).map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No interests added</p>
                  )}
                </div>
              )}
            </div>

            {/* Email (read-only) */}
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
          {isAdmin && (
            <Link to="/admin" className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors border-b border-border">
              <Shield className="w-5 h-5 text-primary" />
              <span className="flex-1 text-left font-medium text-primary">Admin Panel</span>
            </Link>
          )}
          <button 
            onClick={() => navigate("/settings")}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors border-b border-border"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">Settings</span>
          </button>
          <button 
            onClick={() => navigate("/privacy-safety")}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors border-b border-border"
          >
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
