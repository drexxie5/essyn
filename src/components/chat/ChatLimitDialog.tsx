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
import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingMessages: number;
}

export function ChatLimitDialog({ open, onOpenChange, remainingMessages }: ChatLimitDialogProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-sensual flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            Daily Chat Limit Reached
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {remainingMessages === 0 
              ? "You've used all 5 free messages for today. Upgrade to Premium for unlimited messaging!"
              : `You have ${remainingMessages} free messages left today. Upgrade to Premium for unlimited messaging!`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction 
            onClick={() => navigate("/premium")}
            className="w-full bg-gradient-sensual hover:opacity-90"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </AlertDialogAction>
          <AlertDialogCancel className="w-full mt-0">
            Maybe Later
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
