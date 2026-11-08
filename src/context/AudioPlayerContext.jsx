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

const VOLUME_KEY = "nutdope:volume";
const clamp01 = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

function readStoredVolume() {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw !== null) {
      const n = parseFloat(raw);
      if (Number.isFinite(n)) return clamp01(n);
    }
  } catch {
    // storage unavailable (private mode, blocked cookies) - use the default
  }
  return AUDIO_VOLUME;
}

/**
 * Owns the single <audio> element for the whole app. Because this provider is
 * mounted above the router, switching views never touches playback.
 *
 * Audio graph (built lazily on the first play, which is a user gesture):
 *   <audio> -> AnalyserNode (feeds the visualizer) -> GainNode (volume) -> speakers
 * Volume goes through a GainNode instead of audio.volume because iOS Safari
 * ignores audio.volume. The analyser sits before the gain, so the visualizer
 * keeps its full shape when you turn the volume down.
 */
export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const graphRef = useRef(null);
  const analyserRef = useRef(null);
  const prevTrackRef = useRef(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(readStoredVolume);
  const volumeRef = useRef(volume);

  const setVolume = useCallback((v) => setVolumeState(clamp01(v)), []);

  // Apply + persist volume.
  useEffect(() => {
    volumeRef.current = volume;
    const graph = graphRef.current;
    if (graph) {
      graph.gain.gain.setTargetAtTime(volume, graph.ctx.currentTime, 0.02);
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      // ignore
    }
  }, [volume]);

  const ensureGraph = useCallback(() => {
    if (graphRef.current) return graphRef.current;
    const el = audioRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!el || !Ctx) return null;

    try {
      // Note: createMediaElementSource only works for same-origin audio (or
      // CORS-enabled audio). Files in /public are same-origin.
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(el);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.6;
      const gain = ctx.createGain();
      gain.gain.value = volumeRef.current;

      source.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);

      el.volume = 1; // the GainNode handles volume from here on
      graphRef.current = { ctx, analyser, gain };
      analyserRef.current = analyser;
      return graphRef.current;
    } catch (err) {
      console.warn("Web Audio setup failed, falling back to plain playback:", err);
      return null;
    }
  }, []);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    const graph = ensureGraph();
    try {
      if (graph && graph.ctx.state !== "running") await graph.ctx.resume();
      await el.play();
    } catch (err) {
      // Autoplay policy or a src swap interrupting the promise.
      console.warn("Playback was blocked or interrupted:", err);
    }
  }, [ensureGraph]);

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
    () => ({
      isPlaying,
      trackIndex,
      volume,
      analyserRef,
      play,
      pause,
      toggle,
      next,
      setVolume,
    }),
    [isPlaying, trackIndex, volume, play, pause, toggle, next, setVolume]
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
