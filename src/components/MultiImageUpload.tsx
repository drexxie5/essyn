import { useState } from "react";
import { Camera, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MultiImageUploadProps {
  images: string[];
  maxImages?: number;
  onUpload: (urls: string[]) => void;
}

const CLOUDINARY_CLOUD_NAME = "duyvf9jwl";
const CLOUDINARY_UPLOAD_PRESET = "naughtyhooks_unsigned";

const MultiImageUpload = ({ images, maxImages = 3, onUpload }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "naughtyhooks/profiles");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        const newImages = [...images, data.secure_url];
        onUpload(newImages);
        toast.success("Photo uploaded!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onUpload(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {images.map((url, index) => (
          <div key={index} className="aspect-square relative rounded-xl overflow-hidden bg-muted">
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add Photo</span>
              </>
            )}
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {images.length}/{maxImages} photos • Tap to add
      </p>
    </div>
  );
};

export default MultiImageUpload;
