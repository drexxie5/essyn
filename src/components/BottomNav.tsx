import { useState, useEffect } from "react";
import { Search, MessageCircle, User, Crown, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: Search, label: "Discover", path: "/discover", isPremium: false },
  { icon: Bell, label: "Alerts", path: "/notifications", isPremium: false },
  { icon: MessageCircle, label: "Chats", path: "/chats", isPremium: false },
  { icon: Crown, label: "Premium", path: "/premium", isPremium: true },
  { icon: User, label: "Profile", path: "/profile", isPremium: false },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === "/notifications" && unreadCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 rounded-lg transition-all",
                item.isPremium && "relative",
                isActive
                  ? item.isPremium 
                    ? "text-secondary" 
                    : "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {item.isPremium && (
                <div className="absolute inset-0 bg-gradient-gold opacity-20 rounded-lg" />
              )}
              <div className="relative">
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive && (item.isPremium ? "text-secondary" : "text-primary")
                )} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                item.isPremium && isActive && "text-secondary"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
