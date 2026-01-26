import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, Check, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_user_id: string | null;
  is_read: boolean;
  created_at: string;
  related_profile?: {
    username: string;
    profile_image_url: string | null;
  };
}

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch related profiles for notifications with related_user_id
      const enrichedNotifications = await Promise.all(
        (data || []).map(async (notif) => {
          if (notif.related_user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, profile_image_url")
              .eq("id", notif.related_user_id)
              .maybeSingle();
            return { ...notif, related_profile: profile };
          }
          return notif;
        })
      );

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-primary" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "match":
        return <Heart className="w-5 h-5 text-secondary" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout title="Notifications">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3 p-4 rounded-xl bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground text-sm">
              When someone likes you, you'll see it here!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.related_user_id) {
                    navigate("/discover");
                  }
                }}
                className={`w-full flex items-start gap-3 p-4 rounded-xl transition-colors text-left ${
                  notif.is_read ? "bg-muted/30" : "bg-primary/10 border border-primary/20"
                }`}
              >
                {/* Avatar or Icon */}
                {notif.related_profile?.profile_image_url ? (
                  <img
                    src={notif.related_profile.profile_image_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    {getNotificationIcon(notif.type)}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.is_read ? "" : "font-medium"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
