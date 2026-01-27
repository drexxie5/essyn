import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CLOUDINARY_CLOUD_NAME = "duyvf9jwl";
const CLOUDINARY_UPLOAD_PRESET = "naughtyhooks_unsigned";

interface VoiceRecorderProps {
  onVoiceRecorded: (audioUrl: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder = ({ onVoiceRecorded, disabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        
        if (audioBlob.size > 0) {
          await uploadVoiceNote(audioBlob);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadVoiceNote = async (audioBlob: Blob) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-note.webm");
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "singlez/voice");
      formData.append("resource_type", "video");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        onVoiceRecorded(data.secure_url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Voice upload error:", error);
      toast.error("Failed to upload voice note");
    } finally {
      setIsUploading(false);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isUploading) {
    return (
      <button
        disabled
        className="p-2 text-muted-foreground"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
      </button>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-primary font-medium animate-pulse">
          {formatDuration(recordingDuration)}
        </span>
        <button
          onClick={stopRecording}
          className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};

export default VoiceRecorder;
