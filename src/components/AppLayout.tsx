import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "./BottomNav";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showHeader?: boolean;
  title?: string;
}

export const AppLayout = ({ 
  children, 
  showNav = true, 
  showHeader = true,
  title 
}: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Pages that don't require auth
  const publicPaths = ['/', '/login', '/signup', '/terms', '/privacy', '/guidelines'];
  const isPublicPath = publicPaths.includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary" fill="currentColor" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated and not on public path
  if (!user && !isPublicPath) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
            <Link to="/discover" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-sensual flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="text-lg font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SinglezConnect
              </span>
            </Link>
          </div>
        </header>
      )}
      
      <main className={`flex-1 ${showNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {showNav && user && <BottomNav />}
    </div>
  );
};

export default AppLayout;
