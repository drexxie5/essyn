import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface CallUIProps {
  otherUser: {
    username: string;
    profile_image_url: string | null;
  } | null;
  callState: {
    isInCall: boolean;
    isRinging: boolean;
    isConnecting: boolean;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    callType: "voice" | "video" | null;
    caller: "self" | "other" | null;
  };
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onAnswerCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

export const CallUI = ({
  otherUser,
  callState,
  localVideoRef,
  remoteVideoRef,
  onStartVoiceCall,
  onStartVideoCall,
  onAnswerCall,
  onRejectCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
}: CallUIProps) => {
  const showCallScreen = callState.isInCall || callState.isRinging || callState.isConnecting;

  return (
    <>
      {/* Call Buttons in Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onStartVoiceCall}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          disabled={showCallScreen}
        >
          <Phone className="w-5 h-5 text-primary" />
        </button>
        <button
          onClick={onStartVideoCall}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          disabled={showCallScreen}
        >
          <Video className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* Call Screen Overlay */}
      <AnimatePresence>
        {showCallScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Video Background for video calls */}
            {callState.callType === "video" && callState.isInCall && (
              <>
                {/* Remote Video (fullscreen) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Local Video (picture-in-picture) */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute top-20 right-4 w-32 h-44 object-cover rounded-xl border-2 border-border shadow-lg"
                />
              </>
            )}

            {/* Voice Call or Connecting Screen */}
            {(callState.callType === "voice" || !callState.isInCall) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-dark">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="relative mb-6">
                    <Avatar className="w-32 h-32 border-4 border-primary shadow-glow">
                      <AvatarImage src={otherUser?.profile_image_url || ""} />
                      <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                        {otherUser?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Ringing animation */}
                    {(callState.isRinging || callState.isConnecting) && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-primary"
                          animate={{ scale: [1, 1.3, 1.3], opacity: [1, 0, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-primary"
                          animate={{ scale: [1, 1.5, 1.5], opacity: [1, 0, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        />
                      </>
                    )}
                  </div>

                  <h2 className="text-2xl font-display font-bold mb-2">
                    {otherUser?.username}
                  </h2>
                  
                  <p className="text-muted-foreground mb-8">
                    {callState.isRinging && callState.caller === "other" && "Incoming call..."}
                    {callState.isConnecting && callState.caller === "self" && "Calling..."}
                    {callState.isConnecting && callState.caller === "other" && "Connecting..."}
                    {callState.isInCall && "In call"}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Call Controls */}
            <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-6 safe-area-bottom">
              {/* Incoming call - Answer/Reject */}
              {callState.isRinging && callState.caller === "other" && (
                <>
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={onRejectCall}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </motion.button>
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={onAnswerCall}
                    className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                  >
                    <Phone className="w-7 h-7 text-white" />
                  </motion.button>
                </>
              )}

              {/* In call or calling - Controls */}
              {(callState.isInCall || (callState.isConnecting && callState.caller === "self")) && (
                <>
                  <button
                    onClick={onToggleAudio}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                      callState.isAudioEnabled ? "bg-muted" : "bg-destructive"
                    }`}
                  >
                    {callState.isAudioEnabled ? (
                      <Mic className="w-6 h-6" />
                    ) : (
                      <MicOff className="w-6 h-6 text-white" />
                    )}
                  </button>

                  {callState.callType === "video" && (
                    <button
                      onClick={onToggleVideo}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                        callState.isVideoEnabled ? "bg-muted" : "bg-destructive"
                      }`}
                    >
                      {callState.isVideoEnabled ? (
                        <Video className="w-6 h-6" />
                      ) : (
                        <VideoOff className="w-6 h-6 text-white" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={onEndCall}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Close button for connecting state */}
            {callState.isConnecting && callState.caller === "self" && (
              <button
                onClick={onEndCall}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CallUI;
