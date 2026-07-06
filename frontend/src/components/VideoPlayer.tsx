"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface VideoPlayerProps {
  videoId: string;
  prompts: Array<{ id: number; timestamp_seconds: number; question_text: string; options: string[]; correct_option_index: number }>;
  onTriggerPrompt: (prompt: any) => void;
  onTimeUpdate: (seconds: number) => void;
  onVideoEnd: () => void;
  resumePosition: number;
}

export default function VideoPlayer({ videoId, prompts, onTriggerPrompt, onTimeUpdate, onVideoEnd, resumePosition }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const triggeredPromptsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // 1. Load YouTube IFrame API script
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // 2. Setup player creator callback
    const createPlayer = () => {
      playerRef.current = new (window as any).YT.Player("bhartx-player", {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          start: resumePosition || 0
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1
            if (event.data === 1) {
              startTracking();
            } else {
              stopTracking();
            }
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              onVideoEnd();
            }
          }
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      stopTracking();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const startTracking = () => {
    stopTracking();
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = Math.floor(playerRef.current.getCurrentTime());
        onTimeUpdate(currentTime);

        // Check if any MCQ prompt matches current time
        prompts.forEach((pr) => {
          if (currentTime >= pr.timestamp_seconds && !triggeredPromptsRef.current.has(pr.id)) {
            // Trigger prompt: Pause player and raise callback
            playerRef.current.pauseVideo();
            triggeredPromptsRef.current.add(pr.id);
            onTriggerPrompt(pr);
          }
        });
      }
    }, 1000);
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Expose player controller methods to parent through window hooks or standard patterns
  useEffect(() => {
    (window as any).bhartxResumeVideo = () => {
      if (playerRef.current && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-border">
      {!playerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-card-dark z-10">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      )}
      <div id="bhartx-player" className="w-full h-full" />
    </div>
  );
}
