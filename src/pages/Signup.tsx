import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Eye, EyeOff, ArrowLeft, MapPin, AlertTriangle, Camera, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nigerianCities = [
  "Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City", 
  "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin", "Oyo", "Enugu", 
  "Abeokuta", "Onitsha", "Warri", "Sokoto", "Calabar", "Uyo", "Kaduna"
];

const CLOUDINARY_CLOUD_NAME = "duyvf9jwl";
const CLOUDINARY_UPLOAD_PRESET = "naughtyhooks_unsigned";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    age: "",
    gender: "",
    interestedIn: "",
    bio: "",
    city: "",
    latitude: 0,
    longitude: 0,
    profileImageUrl: "",
    agreeTerms: false,
    confirmAge: false,
  });

  useEffect(() => {
    if (step === 2) {
      requestLocation();
    }
  }, [step]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, latitude, longitude }));
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          if (data.address?.country_code !== "ng") {
            setLocationError("NaughtyHooks is only available in Nigeria.");
            return;
          }
          
          const city = data.address?.city || data.address?.town || data.address?.state || "Unknown";
          setFormData(prev => ({ ...prev, city }));
          setLocationError(null);
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      },
      () => {
        setLocationError("Please enable location access.");
      }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingPhoto(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formDataUpload.append("folder", "naughtyhooks/profiles");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormData(prev => ({ ...prev, profileImageUrl: data.secure_url }));
        toast.success("Photo uploaded!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeTerms || !formData.confirmAge) {
      toast.error("Please accept the terms and confirm your age");
      return;
    }

    if (parseInt(formData.age) < 18) {
      toast.error("You must be 18 or older");
      return;
    }

    if (!formData.profileImageUrl) {
      toast.error("Please upload a profile photo");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: formData.email,
        username: formData.username,
        age: parseInt(formData.age),
        gender: formData.gender as "male" | "female" | "non_binary" | "other",
        interested_in: formData.interestedIn as "male" | "female" | "non_binary" | "other",
        bio: formData.bio,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        profile_image_url: formData.profileImageUrl,
      });

      if (profileError) throw profileError;

      toast.success("Welcome to NaughtyHooks!");
      navigate("/discover");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Flame className="w-6 h-6 text-primary" />
          <span className="text-xl font-display font-bold text-gradient">NaughtyHooks</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "bg-primary w-8" : s < step ? "bg-primary w-4" : "bg-muted w-4"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {step === 1 && (
            <>
              <h1 className="text-xl font-display font-bold text-center">Create Account</h1>
              <p className="text-muted-foreground text-center text-sm mb-4">Let's get started</p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!formData.email || !formData.username || !formData.password}
              >
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-xl font-display font-bold text-center">Your Profile</h1>
              <p className="text-muted-foreground text-center text-sm mb-4">Tell us about yourself</p>

              {locationError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-xs text-destructive">{locationError}</p>
                    <button type="button" onClick={requestLocation} className="text-xs text-primary">
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {formData.city && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="text-xs">Location: <strong>{formData.city}, Nigeria</strong></span>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="18+"
                      min={18}
                      max={100}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non_binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Interested In</Label>
                  <Select
                    value={formData.interestedIn}
                    onValueChange={(value) => setFormData({ ...formData, interestedIn: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Men</SelectItem>
                      <SelectItem value="female">Women</SelectItem>
                      <SelectItem value="non_binary">Non-binary</SelectItem>
                      <SelectItem value="other">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!formData.city && (
                  <div className="space-y-1">
                    <Label>City</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {nigerianCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={!formData.age || !formData.gender || !formData.interestedIn || (!formData.city && locationError !== null)}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-xl font-display font-bold text-center">Add Your Photo</h1>
              <p className="text-muted-foreground text-center text-sm mb-4">A profile photo is required</p>

              <div className="flex flex-col items-center">
                <label className="relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  <div className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-colors ${
                    formData.profileImageUrl ? "border-primary" : "border-dashed border-muted-foreground/30"
                  }`}>
                    {formData.profileImageUrl ? (
                      <img
                        src={formData.profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Add Photo</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.profileImageUrl && (
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </label>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Tap to upload • Max 5MB • JPG, PNG
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(4)}
                  disabled={!formData.profileImageUrl}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-xl font-display font-bold text-center">Almost Done!</h1>
              <p className="text-muted-foreground text-center text-sm mb-4">Add a bio and accept terms</p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell potential matches about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="confirmAge"
                      checked={formData.confirmAge}
                      onCheckedChange={(checked) => setFormData({ ...formData, confirmAge: checked as boolean })}
                    />
                    <Label htmlFor="confirmAge" className="text-xs leading-relaxed cursor-pointer">
                      I confirm that I am <strong>18 years or older</strong>
                    </Label>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                    />
                    <Label htmlFor="agreeTerms" className="text-xs leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary">Terms</Link>,{" "}
                      <Link to="/privacy" className="text-primary">Privacy Policy</Link>, and{" "}
                      <Link to="/guidelines" className="text-primary">Guidelines</Link>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  disabled={loading || !formData.confirmAge || !formData.agreeTerms}
                >
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
