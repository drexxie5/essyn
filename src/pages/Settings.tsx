import { useState } from "react";
import { ArrowLeft, Bell, Eye, Shield, Lock, HelpCircle, FileText, LogOut, Loader2, Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AppLayout showNav={false} showHeader={false}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-display font-bold">Settings</span>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Theme Toggle */}
          <div className="glass rounded-xl p-4 space-y-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme" className="cursor-pointer flex items-center gap-2">
                {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Dark Mode
              </Label>
              <Switch
                id="theme"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="glass rounded-xl p-4 space-y-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="cursor-pointer">
                Push Notifications
              </Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="glass rounded-xl p-4 space-y-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Privacy
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="showOnline" className="cursor-pointer">
                  Show Online Status
                </Label>
                <Switch
                  id="showOnline"
                  checked={showOnline}
                  onCheckedChange={setShowOnline}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showDistance" className="cursor-pointer">
                  Show Distance
                </Label>
                <Switch
                  id="showDistance"
                  checked={showDistance}
                  onCheckedChange={setShowDistance}
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="glass rounded-xl overflow-hidden">
            <h2 className="font-display font-semibold flex items-center gap-2 p-4 border-b border-border">
              <Shield className="w-4 h-4 text-primary" />
              Security
            </h2>
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <span>Change Password</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your new password below. It must be at least 8 characters.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Help & Legal */}
          <div className="glass rounded-xl overflow-hidden">
            <h2 className="font-display font-semibold flex items-center gap-2 p-4 border-b border-border">
              <HelpCircle className="w-4 h-4 text-primary" />
              Help & Legal
            </h2>
            <Link
              to="/guidelines"
              className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border"
            >
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span>Community Guidelines</span>
            </Link>
            <Link
              to="/terms"
              className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border"
            >
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span>Terms of Service</span>
            </Link>
            <Link
              to="/privacy"
              className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
            >
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span>Privacy Policy</span>
            </Link>
          </div>

          {/* Logout */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            SinglezConnect v1.0.0 • Adults 18+ Only
          </p>
        </main>
      </div>
    </AppLayout>
  );
};

export default Settings;
