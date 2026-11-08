import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AUDIO_VOLUME, PLAYLIST } from "../config";

const AudioPlayerContext = createContext(null);

/**
 * Owns the single <audio> element for the whole app. Because this provider is
 * mounted above the router, switching views never touches playback.
 */
export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const prevTrackRef = useRef(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = AUDIO_VOLUME;
  }, []);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      await el.play();
    } catch (err) {
      // Autoplay policy or a src swap interrupting the promise.
      console.warn("Playback was blocked or interrupted:", err);
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) play();
    else pause();
  }, [play, pause]);

  const next = useCallback(() => {
    if (PLAYLIST.length <= 1) {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        play();
      }
      return;
    }
    setTrackIndex((i) => (i + 1) % PLAYLIST.length);
  }, [play]);

  // After the src changes (skip or track end), start the new track.
  useEffect(() => {
    if (prevTrackRef.current === trackIndex) return;
    prevTrackRef.current = trackIndex;
    play();
  }, [trackIndex, play]);

  const value = useMemo(
    () => ({ isPlaying, trackIndex, play, pause, toggle, next }),
    [isPlaying, trackIndex, play, pause, toggle, next]
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={PLAYLIST[trackIndex]}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={next}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used inside <AudioPlayerProvider>");
  }
  return ctx;
}
