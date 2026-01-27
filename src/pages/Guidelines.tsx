import { Heart, ArrowLeft, Shield, AlertTriangle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Guidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" fill="currentColor" />
            <span className="text-xl font-display font-bold">SinglezConnect</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-6">Community Guidelines</h1>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            SinglezConnect is committed to creating a safe, respectful, and enjoyable experience 
            for all users. Please follow these guidelines to help us maintain a positive community.
          </p>

          <section className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-display font-semibold">Respect & Consent</h2>
            </div>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Always respect others' boundaries and preferences</li>
              <li>Never pressure anyone for personal information or explicit content</li>
              <li>Accept rejection gracefully—no means no</li>
              <li>Treat all users with dignity regardless of gender, orientation, or background</li>
            </ul>
          </section>

          <section className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-lg font-display font-semibold">Safety First</h2>
            </div>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Never share personal information (address, workplace, phone) with strangers</li>
              <li>Meet in public places for first dates</li>
              <li>Tell a friend or family member about your plans</li>
              <li>Trust your instincts—if something feels wrong, leave</li>
              <li>Report suspicious behavior immediately</li>
            </ul>
          </section>

          <section className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-lg font-display font-semibold">Communication Standards</h2>
            </div>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Be honest about yourself and your intentions</li>
              <li>Use recent, genuine photos of yourself</li>
              <li>Don't send unsolicited explicit content</li>
              <li>Keep conversations respectful and appropriate</li>
              <li>Don't spam or send repetitive messages</li>
            </ul>
          </section>

          <section className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-lg font-display font-semibold">Prohibited Behavior</h2>
            </div>
            <p className="text-muted-foreground text-sm">The following will result in immediate account suspension:</p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Harassment, threats, or abusive language</li>
              <li>Sharing non-consensual intimate images</li>
              <li>Scamming, fraud, or solicitation</li>
              <li>Creating fake or misleading profiles</li>
              <li>Hate speech or discrimination</li>
              <li>Illegal activities of any kind</li>
              <li>Sharing content involving minors</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">Reporting</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If you encounter someone violating these guidelines, please report them immediately. 
              You can report a user directly from their profile or any chat. All reports are 
              reviewed by our moderation team within 24 hours.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              For urgent safety concerns, please contact local law enforcement in addition to 
              reporting on our platform.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Guidelines;
