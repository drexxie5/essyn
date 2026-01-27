import { ArrowLeft, Shield, Eye, EyeOff, UserX, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

const PrivacySafety = () => {
  const navigate = useNavigate();
  const [hideProfile, setHideProfile] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [blockScreenshots, setBlockScreenshots] = useState(true);

  return (
    <AppLayout showNav={false} showHeader={false}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-display font-bold">Privacy & Safety</span>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Profile Visibility */}
          <div className="glass rounded-xl p-4 space-y-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Profile Visibility
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hideProfile" className="cursor-pointer">
                    Hide My Profile
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Others won't see you in discovery
                  </p>
                </div>
                <Switch
                  id="hideProfile"
                  checked={hideProfile}
                  onCheckedChange={setHideProfile}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="incognito" className="cursor-pointer">
                    Incognito Mode
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Browse without being seen
                  </p>
                </div>
                <Switch
                  id="incognito"
                  checked={incognitoMode}
                  onCheckedChange={setIncognitoMode}
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="glass rounded-xl p-4 space-y-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Security
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="screenshots" className="cursor-pointer">
                  Block Screenshots
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Prevent screenshots in chat
                </p>
              </div>
              <Switch
                id="screenshots"
                checked={blockScreenshots}
                onCheckedChange={setBlockScreenshots}
              />
            </div>
          </div>

          {/* Blocked Users */}
          <div className="glass rounded-xl overflow-hidden">
            <h2 className="font-display font-semibold flex items-center gap-2 p-4 border-b border-border">
              <UserX className="w-4 h-4 text-primary" />
              Blocked Users
            </h2>
            <div className="p-4 text-center">
              <p className="text-muted-foreground text-sm">
                No blocked users yet
              </p>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="glass rounded-xl p-4 space-y-3">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Safety Tips
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-secondary mt-0.5" />
                <p>Never share your personal information like address or bank details</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-secondary mt-0.5" />
                <p>Always meet in public places for the first time</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-secondary mt-0.5" />
                <p>Report suspicious behavior immediately</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-secondary mt-0.5" />
                <p>Trust your instincts - if something feels wrong, it probably is</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/guidelines")}
          >
            Read Community Guidelines
          </Button>
        </main>
      </div>
    </AppLayout>
  );
};

export default PrivacySafety;
