import { Heart, MapPin, MessageCircle, Crown, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileCardProps {
  profile: Profile;
  index: number;
  isLiked: boolean;
  isPremium: boolean;
  currentUserLat?: number | null;
  currentUserLng?: number | null;
  onLike: (profile: Profile) => void;
  onMessage: (profile: Profile) => void;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  variant?: "scroll" | "grid";
}

const ProfileCard = ({
  profile,
  index,
  isLiked,
  isPremium,
  currentUserLat,
  currentUserLng,
  onLike,
  onMessage,
  calculateDistance,
  variant = "scroll",
}: ProfileCardProps) => {
  const navigate = useNavigate();

  const cardClass = variant === "grid" 
    ? "w-full" 
    : "flex-shrink-0 w-[280px] snap-center";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={cardClass}
    >
      <div className="relative rounded-2xl overflow-hidden glass border border-border">
        {/* Profile Image - Clickable to view profile */}
        <div 
          className="aspect-[3/4] relative bg-muted cursor-pointer"
          onClick={() => navigate(`/user/${profile.id}`)}
        >
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

          {/* View Profile Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/${profile.id}`);
            }}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Profile info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-xl font-display font-bold text-foreground">
              {profile.username}, {profile.age}
            </h2>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="w-3 h-3" />
              <span>{profile.city || "Nigeria"}</span>
              {currentUserLat && profile.latitude && (
                <span className="ml-1">
                  • {calculateDistance(
                    currentUserLat,
                    currentUserLng!,
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
            variant={isLiked ? "default" : "outline"}
            className={`flex-1 ${isLiked ? "bg-primary" : ""}`}
            onClick={() => onLike(profile)}
          >
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
            {isLiked ? "Liked" : "Like"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onMessage(profile)}
          >
            {isPremium ? (
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
  );
};

export default ProfileCard;
