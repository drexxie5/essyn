import { useState, useEffect } from "react";
import { Search, MessageCircle, User, Crown, Bell, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: Search, label: "Discover", path: "/discover", isPremium: false, isSpecial: false },
  { icon: Heart, label: "Matches", path: "/matches", isPremium: false, isSpecial: true },
  { icon: Bell, label: "Alerts", path: "/notifications", isPremium: false, isSpecial: false },
  { icon: MessageCircle, label: "Chats", path: "/chats", isPremium: false, isSpecial: false },
  { icon: Crown, label: "Premium", path: "/premium", isPremium: true, isSpecial: false },
  { icon: User, label: "Profile", path: "/profile", isPremium: false, isSpecial: false },
];

export const BottomNav = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    
    // Subscribe to realtime notifications
    const channel = supabase
      .channel('nav-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadCount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === "/notifications" && unreadCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-300",
                "hover:bg-muted/30 active:scale-95",
                isActive && "bg-muted/50"
              )}
            >
              {/* Premium glow effect */}
              {item.isPremium && (
                <div className="absolute inset-0 bg-gradient-gold opacity-10 rounded-xl blur-sm" />
              )}
              
              {/* Special matches glow */}
              {item.isSpecial && isActive && (
                <div className="absolute inset-0 bg-gradient-sensual opacity-15 rounded-xl blur-sm" />
              )}
              
              <div className="relative">
                {/* Icon container with special styling */}
                <div className={cn(
                  "relative p-1.5 rounded-lg transition-all duration-300",
                  isActive && item.isPremium && "bg-gradient-gold",
                  isActive && item.isSpecial && "bg-gradient-sensual",
                  isActive && !item.isPremium && !item.isSpecial && "bg-primary"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive 
                      ? "text-white" 
                      : item.isPremium 
                        ? "text-secondary" 
                        : "text-muted-foreground"
                  )} />
                </div>
                
                {/* Notification badge */}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-lg animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                isActive 
                  ? item.isPremium 
                    ? "text-secondary font-semibold" 
                    : item.isSpecial
                      ? "text-accent font-semibold"
                      : "text-primary font-semibold"
                  : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className={cn(
                  "absolute -bottom-0.5 w-1 h-1 rounded-full",
                  item.isPremium ? "bg-secondary" : item.isSpecial ? "bg-accent" : "bg-primary"
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
