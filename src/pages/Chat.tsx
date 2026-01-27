import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Image as ImageIcon, X, Loader2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { VoiceMessage } from "@/components/chat/VoiceMessage";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { Database } from "@/integrations/supabase/types";

type Message = Database['public']['Tables']['messages']['Row'] & { is_read?: boolean };

interface OtherUser {
  id: string;
  username: string;
  profile_image_url: string | null;
  is_verified?: boolean;
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
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
    // Mark messages as read when viewing
    if (currentUserId && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markMessagesAsRead = async () => {
    const unreadMessages = messages.filter(
      (m) => m.sender_id !== currentUserId && !m.is_read
    );
    
    if (unreadMessages.length === 0) return;

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("chat_id", chatId!)
      .neq("sender_id", currentUserId!)
      .eq("is_read", false);

    if (!error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id !== currentUserId ? { ...m, is_read: true } : m
        )
      );
    }
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
        .select("id, username, profile_image_url, is_verified")
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
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as Message]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const handleVoiceRecorded = async (audioUrl: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId!,
          sender_id: currentUserId,
          message_text: audioUrl,
          message_type: "voice",
        });

      if (error) {
        if (error.message.includes("row-level security")) {
          toast.error("Premium subscription required to send messages");
          navigate("/premium");
        } else {
          throw error;
        }
      } else if (otherUser) {
        await supabase.from("notifications").insert({
          user_id: otherUser.id,
          type: "message",
          title: "Voice message!",
          message: "Someone sent you a voice note 🎤",
          related_user_id: currentUserId,
        });
      }
    } catch (error: any) {
      toast.error("Failed to send voice note");
      console.error(error);
    }
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
      } else if (otherUser) {
        await supabase.from("notifications").insert({
          user_id: otherUser.id,
          type: "message",
          title: "New photo!",
          message: "Someone sent you a photo 📷",
          related_user_id: currentUserId,
        });
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

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ReadReceipt = ({ isRead, isSender }: { isRead: boolean; isSender: boolean }) => {
    if (!isSender) return null;
    
    return isRead ? (
      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <Check className="w-3.5 h-3.5 text-primary-foreground/50" />
    );
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
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{otherUser?.username}</span>
                {otherUser?.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <span className="text-xs text-emerald-500">Online</span>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isSender = message.sender_id === currentUserId;
            const time = formatTime(message.created_at);
            
            if (message.message_type === "voice") {
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                >
                  <VoiceMessage
                    audioUrl={message.message_text}
                    isSender={isSender}
                    timestamp={time}
                    isRead={message.is_read}
                  />
                </div>
              );
            }
            
            if (message.message_type === "image") {
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                >
                  <button
                    onClick={() => setPreviewImage(message.message_text)}
                    className={`max-w-[75%] rounded-2xl overflow-hidden ${
                      isSender ? "rounded-br-sm" : "rounded-bl-sm"
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
                    <div className={`flex items-center justify-end gap-1 px-2 py-1 ${
                      isSender ? "bg-primary" : "bg-muted"
                    }`}>
                      <span className={`text-[10px] ${
                        isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {time}
                      </span>
                      <ReadReceipt isRead={message.is_read || false} isSender={isSender} />
                    </div>
                  </button>
                </div>
              );
            }
            
            return (
              <div
                key={message.id}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isSender
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[10px] ${
                      isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {time}
                    </span>
                    <ReadReceipt isRead={message.is_read || false} isSender={isSender} />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="flex items-center gap-1 max-w-lg mx-auto">
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
          <VoiceRecorder 
            onVoiceRecorded={handleVoiceRecorded}
            disabled={uploadingImage}
          />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
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
