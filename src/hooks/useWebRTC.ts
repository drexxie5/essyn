import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseWebRTCOptions {
  chatId: string;
  currentUserId: string;
  otherUserId: string;
  onCallEnded?: () => void;
}

interface CallState {
  isInCall: boolean;
  isRinging: boolean;
  isConnecting: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  callType: "voice" | "video" | null;
  caller: "self" | "other" | null;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

export const useWebRTC = ({ chatId, currentUserId, otherUserId, onCallEnded }: UseWebRTCOptions) => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isRinging: false,
    isConnecting: false,
    isVideoEnabled: false,
    isAudioEnabled: true,
    callType: null,
    caller: null,
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Create ringtone audio
  useEffect(() => {
    ringtoneRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2telejiMkqpqU0ZHWYKWo5RQKB8xWHuMlIdJJx4tVHiJi4BCKSAoT3ODg3gzKSQrTG19eW8uKyYoSmh0cWgqLCclR2RxbWQoLSgmRWFuamIoLyolQ19saWEoMC0lQl1qZ18pMi8lQFtnZV0qNDElP1llY1srNjQlPldkYlktODYkPVViX1gvOjgkPFNgXVcxPDoiO1FdW1UzPjwgOk9bWVQ1QD4fOUxZV1I3Qj8dN0pXVVE6REEbNkhVU085RkMaN0ZTUFE7SEUYNURRTk8+SkYWM0JPTM0/TEcTMUBMT0lBS0gRLz5LSEhDTUoOLTtJR0dGT0wMKzlHRUZIUU4JKTdFQ0VKU1AHJzNDQkRMVVIEJTFBQENOV1QCIy8/P0NQWVYAIi0+Pz9RW1j+Hz07Pj5SXVr8HTk5PT1UYFL6Gzc3PD1VYlP4GTU1Oz1WZFXzFzM0OjxXZ1jxFDExOT1ZaVvtEi8wOD1aa13rDy0uNz1cbl/nDSssNj1dcGHlCigqNT1fdWTiByYnMz5gd2bgBSQlMT5ieGndAyIjLz9keGrbAB8hLT9memt4EB0fLD5nfHN2Nh0dKT1pe3Z3ODUcJz1rf3l9PD0bJT1rf31/QEEaIz5sgIGARkcYIEBug4SDSUoWHUJwhYeHTU4UG0VziomLUFIRGUh2jIuPVFYPF0t4jo2SV1kMFU57kI+VW1wJEVF+kpKYX18HEFOBlZWbYmIEDlaDl5ednmYCAFiGmJugamb9/VqImZyjbGf5+12KmZ2lbmjz9l+Lmp6ncGju82GLm5+pcmnn72KLm5+qc2rj7GOKmp6qdGrd6WSJmZ6qdm3Y5GWHmJyoeW/T4GeFl5qlfXHP3GiDlZikf3LK12h/kpahgnbF0ml9kZSdhnq/zWt6j5GZiX27yWx3jY+WjIGyxG50i42Tj4etv3Fxi4uQko6ou3NvioqOlJCkt3VsiIiNlZKgtXdph4aMlpScr3pphoWLl5adq3xnhYOKmJieqH5lg4GImpmgpYFlgoCHmZqhoYRjf4CGmZuhoYVifX+Fl5yho4Zhe36EmJyfoohhfH2CmJ2eo4Rhend/lZyCl3RbeXqDl5ybo4FZd3mBm5+bn4FYdXeBnJ+anaFYdHaDn5+dnaFZcnWCnp+dn6FYcXWDn5+coKBacHOBnqCboaBbbnKAnaCcn6BcbXB/naCdnp9ebG9+nKCenp9fbG5+nKCen5xha2x8m6Cfn5t0aG16m6Cgn5t4Z2t5maGhnpt7ZWl2mKCgn559YWd0lp+hnKB/XmRylZ+gnKKAW2FwlJ+fnKKBWF5ulJ+gnaGCV1xslZ+gnaGDVFpqlp+hn6CEU1hokZ+ioKCFT1Zmkp+ioZ+HT1VjkZ+ioZ+JTFNhkJ6hoZ+KS1Ffj56ioJ+MTFBcj52joaCNSk5aj52jop+OS0xYjp2kop+QSEJ");
    return () => {
      ringtoneRef.current?.pause();
    };
  }, []);

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => {});
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const cleanup = useCallback(() => {
    stopRingtone();
    
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setCallState({
      isInCall: false,
      isRinging: false,
      isConnecting: false,
      isVideoEnabled: false,
      isAudioEnabled: true,
      callType: null,
      caller: null,
    });
    
    onCallEnded?.();
  }, [onCallEnded]);

  const setupSignaling = useCallback(() => {
    const channel = supabase.channel(`call-${chatId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "call-signal" }, async ({ payload }) => {
      if (payload.from === currentUserId) return;

      switch (payload.type) {
        case "offer":
          setCallState(prev => ({
            ...prev,
            isRinging: true,
            callType: payload.callType,
            caller: "other",
          }));
          playRingtone();
          
          // Store the offer for when user answers
          sessionStorage.setItem("pendingOffer", JSON.stringify(payload.offer));
          sessionStorage.setItem("pendingCallType", payload.callType);
          break;

        case "answer":
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(payload.answer)
            );
            setCallState(prev => ({
              ...prev,
              isConnecting: false,
              isInCall: true,
            }));
          }
          break;

        case "ice-candidate":
          if (peerConnection.current && payload.candidate) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(payload.candidate)
            );
          }
          break;

        case "end-call":
          cleanup();
          break;

        case "reject-call":
          cleanup();
          break;
      }
    });

    channel.subscribe();
    channelRef.current = channel;
  }, [chatId, currentUserId, cleanup]);

  const sendSignal = useCallback((type: string, data: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call-signal",
        payload: { type, from: currentUserId, ...data },
      });
    }
  }, [currentUserId]);

  const createPeerConnection = useCallback(async (callType: "voice" | "video") => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanup();
      }
    };

    // Get local media
    const constraints = {
      audio: true,
      video: callType === "video",
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.current = stream;
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setCallState(prev => ({
        ...prev,
        isVideoEnabled: callType === "video",
        isAudioEnabled: true,
      }));
    } catch (error) {
      console.error("Failed to get media:", error);
      throw error;
    }

    peerConnection.current = pc;
    return pc;
  }, [sendSignal, cleanup]);

  const startCall = useCallback(async (callType: "voice" | "video") => {
    try {
      setCallState(prev => ({
        ...prev,
        isConnecting: true,
        callType,
        caller: "self",
      }));

      setupSignaling();
      const pc = await createPeerConnection(callType);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal("offer", { offer, callType });
      
      // Notify user about incoming call
      await supabase.from("notifications").insert({
        user_id: otherUserId,
        type: "call",
        title: `Incoming ${callType} call`,
        message: `Someone is calling you!`,
        related_user_id: currentUserId,
      });
    } catch (error) {
      console.error("Failed to start call:", error);
      cleanup();
    }
  }, [setupSignaling, createPeerConnection, sendSignal, otherUserId, currentUserId, cleanup]);

  const answerCall = useCallback(async () => {
    try {
      stopRingtone();
      
      const pendingOffer = sessionStorage.getItem("pendingOffer");
      const callType = sessionStorage.getItem("pendingCallType") as "voice" | "video";
      
      if (!pendingOffer) return;

      setCallState(prev => ({
        ...prev,
        isRinging: false,
        isConnecting: true,
      }));

      const pc = await createPeerConnection(callType);
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(pendingOffer)));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal("answer", { answer });

      sessionStorage.removeItem("pendingOffer");
      sessionStorage.removeItem("pendingCallType");

      setCallState(prev => ({
        ...prev,
        isConnecting: false,
        isInCall: true,
      }));
    } catch (error) {
      console.error("Failed to answer call:", error);
      cleanup();
    }
  }, [createPeerConnection, sendSignal, cleanup]);

  const rejectCall = useCallback(() => {
    stopRingtone();
    sendSignal("reject-call", {});
    cleanup();
  }, [sendSignal, cleanup]);

  const endCall = useCallback(() => {
    sendSignal("end-call", {});
    cleanup();
  }, [sendSignal, cleanup]);

  const toggleAudio = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, []);

  // Setup signaling when component mounts
  useEffect(() => {
    setupSignaling();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupSignaling]);

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
};

export default useWebRTC;
