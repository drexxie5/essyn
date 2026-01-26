import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Eye, EyeOff, ArrowLeft, MapPin, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Form data
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
    agreeTerms: false,
    confirmAge: false,
  });

  // Nigerian cities for fallback
  const nigerianCities = [
    "Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City", 
    "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin", "Oyo", "Enugu", 
    "Abeokuta", "Onitsha", "Warri", "Sokoto", "Calabar", "Uyo", "Kaduna"
  ];

  // Request location on mount
  useEffect(() => {
    if (step === 2) {
      requestLocation();
    }
  }, [step]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, latitude, longitude }));
        
        // Reverse geocode to get city (in production, use a proper API)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          if (data.address?.country_code !== "ng") {
            setLocationError("NaughtyHooks is only available in Nigeria. We detected you're outside Nigeria.");
            return;
          }
          
          const city = data.address?.city || data.address?.town || data.address?.state || "Unknown";
          setFormData(prev => ({ ...prev, city }));
          setLocationError(null);
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      },
      (error) => {
        console.error("Location error:", error);
        setLocationError("Please enable location access to continue. We need to verify you're in Nigeria.");
      }
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeTerms || !formData.confirmAge) {
      toast.error("Please accept the terms and confirm your age");
      return;
    }

    if (parseInt(formData.age) < 18) {
      toast.error("You must be 18 or older to use NaughtyHooks");
      return;
    }

    setLoading(true);

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // Create profile
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
      });

      if (profileError) throw profileError;

      toast.success("Welcome to NaughtyHooks! Your account has been created.");
      navigate("/discover");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="glass rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Flame className="w-8 h-8 text-primary" />
            <span className="text-2xl font-display font-bold text-gradient">NaughtyHooks</span>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  s === step ? "bg-primary w-8" : s < step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {/* Step 1: Account Details */}
            {step === 1 && (
              <>
                <h1 className="text-2xl font-display font-bold text-center mb-2">Create Account</h1>
                <p className="text-muted-foreground text-center mb-6">Let's get you started</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-muted/50 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="bg-muted/50 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
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
                        className="bg-muted/50 border-border/50 focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!formData.email || !formData.username || !formData.password}
                >
                  Continue
                </Button>
              </>
            )}

            {/* Step 2: Location & Profile */}
            {step === 2 && (
              <>
                <h1 className="text-2xl font-display font-bold text-center mb-2">Your Profile</h1>
                <p className="text-muted-foreground text-center mb-6">Tell us about yourself</p>

                {locationError && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm text-destructive font-medium">{locationError}</p>
                      <Button
                        type="button"
                        variant="link"
                        className="text-primary p-0 h-auto text-sm"
                        onClick={requestLocation}
                      >
                        Try again
                      </Button>
                    </div>
                  </div>
                )}

                {formData.city && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 mb-4">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm">Location detected: <strong>{formData.city}, Nigeria</strong></span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
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
                        className="bg-muted/50 border-border/50 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger className="bg-muted/50 border-border/50 focus:border-primary">
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

                  <div className="space-y-2">
                    <Label>Interested In</Label>
                    <Select
                      value={formData.interestedIn}
                      onValueChange={(value) => setFormData({ ...formData, interestedIn: value })}
                    >
                      <SelectTrigger className="bg-muted/50 border-border/50 focus:border-primary">
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
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) => setFormData({ ...formData, city: value })}
                      >
                        <SelectTrigger className="bg-muted/50 border-border/50 focus:border-primary">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
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

            {/* Step 3: Bio & Terms */}
            {step === 3 && (
              <>
                <h1 className="text-2xl font-display font-bold text-center mb-2">Almost Done!</h1>
                <p className="text-muted-foreground text-center mb-6">Add a bio and accept terms</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell potential matches about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="bg-muted/50 border-border/50 focus:border-primary min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="confirmAge"
                        checked={formData.confirmAge}
                        onCheckedChange={(checked) => setFormData({ ...formData, confirmAge: checked as boolean })}
                      />
                      <Label htmlFor="confirmAge" className="text-sm leading-relaxed cursor-pointer">
                        I confirm that I am <strong>18 years or older</strong> and understand this is an adult dating platform
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                      />
                      <Label htmlFor="agreeTerms" className="text-sm leading-relaxed cursor-pointer">
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>,{" "}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and{" "}
                        <Link to="/guidelines" className="text-primary hover:underline">Community Guidelines</Link>
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
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

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
