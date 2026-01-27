import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface VoiceMessageProps {
  audioUrl: string;
  isSender: boolean;
  timestamp: string;
  isRead?: boolean;
}

export const VoiceMessage = ({ audioUrl, isSender, timestamp, isRead }: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[180px] ${
        isSender
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-muted rounded-bl-sm"
      }`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isSender
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
            : "bg-background hover:bg-background/80"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        {/* Waveform visualization (simplified) */}
        <div className="relative h-6 flex items-center gap-0.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                i < (progress / 100) * 20
                  ? isSender
                    ? "bg-primary-foreground"
                    : "bg-primary"
                  : isSender
                    ? "bg-primary-foreground/40"
                    : "bg-muted-foreground/40"
              }`}
              style={{
                height: `${Math.random() * 60 + 40}%`,
              }}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] ${isSender ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {formatDuration(duration)}
          </span>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${isSender ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {timestamp}
            </span>
            {isSender && (
              <span className={`text-[10px] ${isRead ? "text-blue-400" : "text-primary-foreground/50"}`}>
                ✓✓
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessage;
