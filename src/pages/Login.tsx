import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/discover");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 py-6">
      {/* Header */}
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Flame className="w-8 h-8 text-primary" />
          <span className="text-2xl font-display font-bold text-gradient">NaughtyHooks</span>
        </div>

        <h1 className="text-2xl font-display font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">Sign in to continue your adventure</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium">
            Sign up
          </Link>
        </p>
      </div>

      {/* Age disclaimer */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        By signing in, you confirm you are 18+ and agree to our{" "}
        <Link to="/terms" className="text-primary">Terms</Link>
      </p>
    </div>
  );
};

export default Login;
