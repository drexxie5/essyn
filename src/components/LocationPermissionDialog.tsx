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
import { MapPin, Navigation } from "lucide-react";

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnableLocation: () => void;
  onSkip: () => void;
}

const LocationPermissionDialog = ({
  open,
  onOpenChange,
  onEnableLocation,
  onSkip,
}: LocationPermissionDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-4">
        <AlertDialogHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-8 h-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-xl font-display">
            Enable Location Access
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              To find singles in your area, we need access to your location.
            </p>
            <p className="text-sm flex items-center justify-center gap-2 text-primary">
              <MapPin className="w-4 h-4" />
              We'll detect your town, city & state
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={onEnableLocation}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Enable Location
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onSkip}
            className="w-full"
          >
            Maybe Later
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LocationPermissionDialog;
