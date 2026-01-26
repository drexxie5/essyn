import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  currentImage?: string | null;
  onUpload: (url: string) => void;
  className?: string;
}

export const ImageUpload = ({ currentImage, onUpload, className = "" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName = "duyvf9jwl";
  const uploadPreset = "naughtyhooks_unsigned"; // Create this in Cloudinary dashboard

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

    // Show preview
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

      if (data.secure_url) {
        onUpload(data.secure_url);
        toast.success("Image uploaded!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div 
        onClick={() => !uploading && inputRef.current?.click()}
        className="w-24 h-24 rounded-full bg-muted border-4 border-background cursor-pointer overflow-hidden relative group"
      >
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Camera className="w-8 h-8" />
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
    </div>
  );
};

export default ImageUpload;
