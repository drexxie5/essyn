import { useState, useEffect } from "react";
import { MessageCircle, Search, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

interface ChatPreview {
  id: string;
  otherUser: {
    id: string;
    username: string;
    profile_image_url: string | null;
    is_premium: boolean;
  };
  lastMessage?: string;
  lastMessageTime?: string;
}

const Chats = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkPremiumAndFetchChats();
  }, []);

  const checkPremiumAndFetchChats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Check if user is premium
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, subscription_expires")
        .eq("id", session.user.id)
        .maybeSingle();

      const premium = profile?.is_premium && 
        profile?.subscription_expires && 
        new Date(profile.subscription_expires) > new Date();
      
      setIsPremium(!!premium);

      if (premium) {
        // Fetch chats
        const { data: chatsData } = await supabase
          .from("chats")
          .select("*")
          .or(`user_one_id.eq.${session.user.id},user_two_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false });

        if (chatsData && chatsData.length > 0) {
          // Get other user IDs
          const otherUserIds = chatsData.map(chat => 
            chat.user_one_id === session.user.id ? chat.user_two_id : chat.user_one_id
          );

          // Fetch other users' profiles
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, profile_image_url, is_premium")
            .in("id", otherUserIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]));

          const chatPreviews: ChatPreview[] = chatsData.map(chat => {
            const otherUserId = chat.user_one_id === session.user.id 
              ? chat.user_two_id 
              : chat.user_one_id;
            const otherUser = profileMap.get(otherUserId);
            
            return {
              id: chat.id,
              otherUser: {
                id: otherUserId,
                username: otherUser?.username || "Unknown",
                profile_image_url: otherUser?.profile_image_url || null,
                is_premium: otherUser?.is_premium || false,
              },
            };
          });

          setChats(chatPreviews);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Messages">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!isPremium) {
    return (
      <AppLayout title="Messages">
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mb-6">
            <Crown className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">
            Unlock Messaging
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Upgrade to Premium to send unlimited messages and connect with matches
          </p>
          <Button
            variant="gold"
            size="lg"
            onClick={() => navigate("/premium")}
          >
            <Crown className="w-4 h-4 mr-2" />
            Get Premium
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Messages">
      <div className="max-w-lg mx-auto">
        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chats List */}
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[40vh] px-6 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">
              No Messages Yet
            </h3>
            <p className="text-muted-foreground text-sm">
              Start discovering people and send your first message!
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/discover")}
            >
              Discover People
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chats
              .filter(chat => 
                chat.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={chat.otherUser.profile_image_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {chat.otherUser.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{chat.otherUser.username}</span>
                      {chat.otherUser.is_premium && (
                        <Crown className="w-3 h-3 text-secondary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {chat.lastMessage || "Start a conversation"}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Chats;
