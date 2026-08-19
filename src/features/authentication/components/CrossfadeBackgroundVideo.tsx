"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CROSSFADE_DURATION_MS = 900;
const CROSSFADE_LEAD_SECONDS = 1.05;

type CrossfadeBackgroundVideoProps = {
  src: string;
  className?: string;
};

export function CrossfadeBackgroundVideo({
  src,
  className = "",
}: CrossfadeBackgroundVideoProps) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const activeVideoRef = useRef(0);
  const isCrossfadingRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const [activeVideo, setActiveVideo] = useState(0);

  const startCrossfade = useCallback(async (fromIndex: number) => {
    if (
      !isMountedRef.current ||
      isCrossfadingRef.current ||
      activeVideoRef.current !== fromIndex
    ) {
      return;
    }

    const nextIndex = fromIndex === 0 ? 1 : 0;
    const currentVideo = videoRefs.current[fromIndex];
    const nextVideo = videoRefs.current[nextIndex];

    if (!currentVideo || !nextVideo) return;

    isCrossfadingRef.current = true;
    nextVideo.currentTime = 0;

    try {
      await nextVideo.play();
    } catch {
      isCrossfadingRef.current = false;
      return;
    }

    if (!isMountedRef.current) return;

    activeVideoRef.current = nextIndex;
    setActiveVideo(nextIndex);

    resetTimerRef.current = window.setTimeout(() => {
      currentVideo.pause();
      currentVideo.currentTime = 0;
      isCrossfadingRef.current = false;
      resetTimerRef.current = null;
    }, CROSSFADE_DURATION_MS);
  }, []);

  const handleTimeUpdate = (index: number) => {
    const video = videoRefs.current[index];
    if (!video || !Number.isFinite(video.duration)) return;

    const fadeLead = Math.min(CROSSFADE_LEAD_SECONDS, video.duration / 3);
    if (video.duration - video.currentTime <= fadeLead) {
      void startCrossfade(index);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const videos = videoRefs.current;

    return () => {
      isMountedRef.current = false;
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      videos.forEach(video => video?.pause());
    };
  }, []);

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden bg-[#061341] ${className}`}>
      {[0, 1].map(index => (
        <video
          key={index}
          ref={video => {
            videoRefs.current[index] = video;
          }}
          autoPlay={index === 0}
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          onTimeUpdate={() => handleTimeUpdate(index)}
          onEnded={() => void startCrossfade(index)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out ${
            activeVideo === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDuration: `${CROSSFADE_DURATION_MS}ms` }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ))}
    </div>
  );
}
