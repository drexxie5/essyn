import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
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

const CLOUDINARY_CLOUD_NAME = "duyvf9jwl";
const CLOUDINARY_UPLOAD_PRESET = "naughtyhooks_unsigned";

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "singlez/chat");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        // Send image message
        await sendImageMessage(data.secure_url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId!,
          sender_id: currentUserId,
          message_text: imageUrl,
          message_type: "image",
        });

      if (error) {
        if (error.message.includes("row-level security")) {
          toast.error("Premium subscription required to send messages");
          navigate("/premium");
        } else {
          throw error;
        }
      } else {
        // Create notification for the other user
        if (otherUser) {
          await supabase.from("notifications").insert({
            user_id: otherUser.id,
            type: "message",
            title: "New photo!",
            message: "Someone sent you a photo 📷",
            related_user_id: currentUserId,
          });
        }
      }
    } catch (error: any) {
      toast.error("Failed to send image");
      console.error(error);
    }
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
        
        // Create notification for the other user
        if (otherUser) {
          await supabase.from("notifications").insert({
            user_id: otherUser.id,
            type: "message",
            title: "New message!",
            message: newMessage.trim().slice(0, 50) + (newMessage.length > 50 ? "..." : ""),
            related_user_id: currentUserId,
          });
        }
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
          <button 
            onClick={() => navigate(`/user/${otherUser?.id}`)}
            className="flex items-center gap-3 flex-1"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherUser?.profile_image_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {otherUser?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <span className="font-medium block">{otherUser?.username}</span>
              <span className="text-xs text-green-500">Online</span>
            </div>
          </button>
        </div>
      </header>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

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
              {message.message_type === "image" ? (
                <button
                  onClick={() => setPreviewImage(message.message_text)}
                  className={`max-w-[75%] rounded-2xl overflow-hidden ${
                    message.sender_id === currentUserId
                      ? "rounded-br-sm"
                      : "rounded-bl-sm"
                  }`}
                >
                  <img 
                    src={message.message_text} 
                    alt="Shared image"
                    className="w-full max-w-[250px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <p className={`text-[10px] px-2 py-1 ${
                    message.sender_id === currentUserId 
                      ? "bg-primary text-primary-foreground/70" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {new Date(message.created_at || "").toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ) : (
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
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploadingImage}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {uploadingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
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
