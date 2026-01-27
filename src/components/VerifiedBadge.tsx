import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

export const VerifiedBadge = ({ 
  size = "md", 
  className,
  showTooltip = true 
}: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const badge = (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-blue-500 text-white",
        sizeClasses[size],
        className
      )}
    >
      <BadgeCheck className="w-full h-full p-0.5" />
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Verified Account</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default VerifiedBadge;
