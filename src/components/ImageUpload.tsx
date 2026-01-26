import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  currentImage?: string | null;
  onUpload: (url: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ImageUpload = ({ 
  currentImage, 
  onUpload, 
  className = "",
  size = "md"
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cloudinary configuration
  const cloudName = "duyvf9jwl";
  const uploadPreset = "naughtyhooks_unsigned";

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "naughtyhooks/profiles");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error("Cloudinary error:", data.error);
        
        // More helpful error message
        if (data.error.message?.includes("upload preset")) {
          toast.error(
            "Upload preset not configured. Please create 'naughtyhooks_unsigned' in Cloudinary settings.",
            { duration: 6000 }
          );
        } else {
          toast.error(`Upload failed: ${data.error.message}`);
        }
        setPreview(null);
        return;
      }

      if (data.secure_url) {
        onUpload(data.secure_url);
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const displayImage = preview || currentImage;
  const isPlaceholder = !displayImage || displayImage === "/placeholder.svg";

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        capture="environment"
      />
      
      <div 
        onClick={() => !uploading && inputRef.current?.click()}
        className={`${sizeClasses[size]} rounded-full bg-muted border-4 border-background cursor-pointer overflow-hidden relative group shadow-lg`}
      >
        {!isPlaceholder ? (
          <img 
            src={displayImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-sensual">
            <Camera className="w-8 h-8 text-white" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* Upload hint */}
      {isPlaceholder && !uploading && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Tap to upload photo
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
