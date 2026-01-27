import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
        <h1 className="text-3xl font-display font-bold mb-6">Terms of Service</h1>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          
          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">1. Eligibility</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You must be at least 18 years of age to use SinglezConnect. By creating an account, 
              you confirm that you are of legal age in Nigeria and that you understand this is 
              an adult dating platform. SinglezConnect is exclusively available to users located 
              in Nigeria.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">2. Account Responsibility</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. 
              You agree to provide accurate information and to update it as necessary. You may not 
              create accounts for others or transfer your account without permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">3. User Conduct</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Harass, abuse, or harm other users</li>
              <li>Share explicit content without consent</li>
              <li>Use the platform for illegal activities</li>
              <li>Create fake profiles or impersonate others</li>
              <li>Spam or solicit other users</li>
              <li>Violate any applicable laws</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">4. Premium Subscriptions</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium features require a paid subscription. Payments are processed through 
              Flutterwave. Subscriptions auto-renew unless cancelled. Refunds are subject to 
              our refund policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">5. Content Ownership</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You retain ownership of content you post but grant SinglezConnect a license to 
              display it on the platform. You are responsible for ensuring you have rights 
              to any content you upload.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">6. Termination</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms. 
              You may delete your account at any time through your profile settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">7. Disclaimer</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              SinglezConnect is provided "as is" without warranties. We are not responsible for 
              user interactions or content. Always exercise caution when meeting people online.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">8. Contact</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              For questions about these terms, contact us at support@singlezconnect.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Terms;
