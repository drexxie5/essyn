import { Clock } from "lucide-react";

interface OfflineNoticeProps {
  username: string;
}

export function OfflineNotice({ username }: OfflineNoticeProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/50 rounded-xl mx-4 mb-4">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center">
        {username} is currently offline. They will reply once they're back online.
      </p>
    </div>
  );
}
