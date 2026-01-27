import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface MatchCelebrationProps {
  isOpen: boolean;
  matchedProfile: Profile | null;
  currentUserImage?: string | null;
  onClose: () => void;
  onStartChat: () => void;
}

const MatchCelebration = ({
  isOpen,
  matchedProfile,
  currentUserImage,
  onClose,
  onStartChat,
}: MatchCelebrationProps) => {
  if (!matchedProfile) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative w-full max-w-sm bg-card rounded-3xl p-6 text-center overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 300 - 150,
                    y: 400,
                    rotate: Math.random() * 360,
                    scale: 0
                  }}
                  animate={{ 
                    y: -100,
                    rotate: Math.random() * 720,
                    scale: [0, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                  className="absolute text-2xl"
                  style={{ left: `${Math.random() * 100}%` }}
                >
                  {["❤️", "💕", "✨", "🎉", "💫"][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4"
            >
              <div className="flex justify-center items-center gap-[-20px]">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-20 h-20 rounded-full border-4 border-primary overflow-hidden shadow-glow"
                >
                  <img
                    src={currentUserImage || "/placeholder.svg"}
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="w-12 h-12 rounded-full bg-gradient-sensual flex items-center justify-center -mx-3 z-10 shadow-glow"
                >
                  <Heart className="w-6 h-6 text-white" fill="white" />
                </motion.div>
                
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-20 h-20 rounded-full border-4 border-accent overflow-hidden shadow-glow"
                >
                  <img
                    src={matchedProfile.profile_image_url || "/placeholder.svg"}
                    alt={matchedProfile.username}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-2xl font-display font-bold text-gradient mb-2">
                It's a Match!
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                You and {matchedProfile.username} like each other! Start chatting now and make a connection.
              </p>

              <div className="space-y-3">
                <Button onClick={onStartChat} className="w-full h-12" size="lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send a Message
                </Button>
                <Button onClick={onClose} variant="ghost" className="w-full">
                  Keep Browsing
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchCelebration;
