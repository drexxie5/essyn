import { useState } from "react";
import { ArrowLeft, Bell, Eye, Shield, Lock, HelpCircle, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";

const Settings = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
            <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <span>Change Password</span>
            </button>
            <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span>Two-Factor Authentication</span>
            </button>
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
            NaughtyHooks v1.0.0 • Adults 18+ Only
          </p>
        </main>
      </div>
    </AppLayout>
  );
};

export default Settings;
