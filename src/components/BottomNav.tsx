import { useState, useEffect, memo, useCallback } from "react";
import { Search, MessageCircle, User, Crown, Bell, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: Heart, label: "Matches", path: "/matches" },
  { icon: Bell, label: "Alerts", path: "/notifications" },
  { icon: MessageCircle, label: "Chats", path: "/chats" },
  { icon: Crown, label: "Premium", path: "/premium", isPremium: true },
  { icon: User, label: "Profile", path: "/profile" },
];

export const BottomNav = memo(() => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
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
  }, [fetchUnreadCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-stretch justify-between h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === "/notifications" && unreadCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
                "active:bg-muted/20",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  "w-5 h-5 transition-all",
                  isActive && item.isPremium && "text-secondary",
                  isActive && !item.isPremium && "text-primary"
                )} />
                
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-medium",
                isActive && item.isPremium && "text-secondary",
                isActive && !item.isPremium && "text-primary"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator line */}
              {isActive && (
                <div className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full",
                  item.isPremium ? "bg-secondary" : "bg-primary"
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";

export default BottomNav;
