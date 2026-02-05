import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareProfileButtonProps {
  userId: string;
  username: string;
}

export function ShareProfileButton({ userId, username }: ShareProfileButtonProps) {
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/user/${userId}`;
    const shareData = {
      title: `Check out ${username}'s profile on SinglezConnect`,
      text: `Meet ${username} on SinglezConnect - Nigeria's premier dating platform!`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Profile link copied to clipboard!");
      }
    } catch (error) {
      // User cancelled or error
      if ((error as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Profile link copied to clipboard!");
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleShare}
      className="w-10 h-10 rounded-full"
    >
      <Share2 className="w-4 h-4" />
    </Button>
  );
}
