import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Ban, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  onBlocked: () => void;
}

export function BlockUserDialog({ 
  open, 
  onOpenChange, 
  userId, 
  username,
  onBlocked 
}: BlockUserDialogProps) {
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    setBlocking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: session.user.id,
          blocked_id: userId,
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("You've already blocked this user");
        } else {
          throw error;
        }
      } else {
        toast.success(`${username} has been blocked`);
        onBlocked();
      }
    } catch (error: any) {
      console.error("Block error:", error);
      toast.error("Failed to block user");
    } finally {
      setBlocking(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Block {username}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            They won't be able to message you or see your profile. You can unblock them later in Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBlock}
            disabled={blocking}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {blocking ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Ban className="w-4 h-4 mr-2" />
            )}
            Block
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
