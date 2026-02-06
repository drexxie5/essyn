import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseChatLimitOptions {
  userId: string;
  isPremium: boolean;
}

export const useChatLimit = ({ userId, isPremium }: UseChatLimitOptions) => {
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const DAILY_LIMIT = 5;

  const fetchMessageCount = useCallback(async () => {
    if (isPremium || !userId) {
      setLoading(false);
      return;
    }

    try {
      // Get today's date in Nigerian time (WAT = UTC+1)
      const now = new Date();
      const watOffset = 1 * 60; // WAT is UTC+1
      const localOffset = now.getTimezoneOffset();
      const watTime = new Date(now.getTime() + (watOffset + localOffset) * 60 * 1000);
      const todayWAT = watTime.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("daily_message_counts")
        .select("message_count")
        .eq("user_id", userId)
        .eq("date", todayWAT)
        .maybeSingle();

      if (error) throw error;
      setMessageCount(data?.message_count || 0);
    } catch (error) {
      console.error("Error fetching message count:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, isPremium]);

  const incrementMessageCount = useCallback(async () => {
    if (isPremium || !userId) return true;

    try {
      // Get today's date in Nigerian time (WAT = UTC+1)
      const now = new Date();
      const watOffset = 1 * 60;
      const localOffset = now.getTimezoneOffset();
      const watTime = new Date(now.getTime() + (watOffset + localOffset) * 60 * 1000);
      const todayWAT = watTime.toISOString().split("T")[0];

      // Check current count
      const { data: existing } = await supabase
        .from("daily_message_counts")
        .select("message_count")
        .eq("user_id", userId)
        .eq("date", todayWAT)
        .maybeSingle();

      const currentCount = existing?.message_count || 0;

      if (currentCount >= DAILY_LIMIT) {
        setShowLimitDialog(true);
        return false;
      }

      // Upsert the count
      const { error } = await supabase
        .from("daily_message_counts")
        .upsert({
          user_id: userId,
          date: todayWAT,
          message_count: currentCount + 1,
        }, {
          onConflict: "user_id,date",
        });

      if (error) throw error;

      setMessageCount(currentCount + 1);
      
      // Show warning when approaching limit
      if (currentCount + 1 >= DAILY_LIMIT) {
        setShowLimitDialog(true);
      }

      return true;
    } catch (error) {
      console.error("Error incrementing message count:", error);
      return true; // Allow message on error
    }
  }, [userId, isPremium]);

  const canSendMessage = useCallback(() => {
    if (isPremium) return true;
    if (messageCount >= DAILY_LIMIT) {
      setShowLimitDialog(true);
      return false;
    }
    return true;
  }, [isPremium, messageCount]);

  useEffect(() => {
    fetchMessageCount();
  }, [fetchMessageCount]);

  return {
    messageCount,
    remainingMessages: Math.max(0, DAILY_LIMIT - messageCount),
    loading,
    showLimitDialog,
    setShowLimitDialog,
    incrementMessageCount,
    canSendMessage,
  };
};

export default useChatLimit;
