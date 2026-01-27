import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
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
        <h1 className="text-3xl font-display font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          
          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We collect information you provide directly, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Account information (email, username, age, gender)</li>
              <li>Profile data (photos, bio, preferences)</li>
              <li>Location data (with your permission)</li>
              <li>Messages and communications</li>
              <li>Payment information (processed securely by Flutterwave)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">2. How We Use Your Information</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Provide and improve our services</li>
              <li>Match you with other users based on preferences</li>
              <li>Show you users near your location</li>
              <li>Process payments and subscriptions</li>
              <li>Send important notifications</li>
              <li>Ensure safety and prevent fraud</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">3. Location Privacy</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Location data is used only to show you nearby users and calculate distances. 
              We never share your exact location with other users—only your city and 
              approximate distance are displayed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">4. Data Sharing</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We do not sell your personal data. We may share information with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Service providers who help operate our platform</li>
              <li>Law enforcement when required by law</li>
              <li>Other users (only your public profile information)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">5. Data Security</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We use industry-standard encryption and security measures to protect your data. 
              Passwords are hashed and never stored in plain text. Payment information is 
              processed securely through Flutterwave.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">6. Your Rights</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">7. Cookies</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We use cookies and similar technologies to improve your experience, 
              remember your preferences, and analyze usage patterns.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">8. Contact</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              For privacy concerns, contact our Data Protection Officer at privacy@singlezconnect.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
