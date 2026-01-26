import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Message = Database['public']['Tables']['messages']['Row'];

interface OtherUser {
  id: string;
  username: string;
  profile_image_url: string | null;
}

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (chatId) {
      initializeChat();
      subscribeToMessages();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setCurrentUserId(session.user.id);

      // Get chat info
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .maybeSingle();

      if (chatError || !chat) {
        toast.error("Chat not found");
        navigate("/chats");
        return;
      }

      // Get other user
      const otherUserId = chat.user_one_id === session.user.id 
        ? chat.user_two_id 
        : chat.user_one_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, profile_image_url")
        .eq("id", otherUserId)
        .maybeSingle();

      if (profile) {
        setOtherUser(profile);
      }

      // Get messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId!,
          sender_id: currentUserId,
          message_text: newMessage.trim(),
          message_type: "text",
        });

      if (error) {
        if (error.message.includes("row-level security")) {
          toast.error("Premium subscription required to send messages");
          navigate("/premium");
        } else {
          throw error;
        }
      } else {
        setNewMessage("");
      }
    } catch (error: any) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
          <button onClick={() => navigate("/chats")} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar className="w-8 h-8">
            <AvatarImage src={otherUser?.profile_image_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {otherUser?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{otherUser?.username}</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  message.sender_id === currentUserId
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                <p className="text-sm">{message.message_text}</p>
                <p className={`text-[10px] mt-1 ${
                  message.sender_id === currentUserId 
                    ? "text-primary-foreground/70" 
                    : "text-muted-foreground"
                }`}>
                  {new Date(message.created_at || "").toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button 
            size="icon" 
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
