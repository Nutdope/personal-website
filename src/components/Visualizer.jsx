import { useEffect, useRef } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";

// Bars hang from the top edge of the screen and grow downward.
const HEIGHT = 96; // canvas height (px)
const MAX_BAR = 84; // tallest a bar can get
const MIN_BAR = 2; // resting nub
const BAR_W = 5;
const PITCH = 10; // bar width + gap
const MIN_HZ = 40;
const MAX_HZ = 14000;
const ATTACK = 0.5; // how fast bars rise (0-1 per frame)
const DECAY = 0.12; // how fast bars fall

/** Log-spaced frequency ranges, one per unique (mirrored) band. */
function buildRanges(analyser, bands) {
  const bins = analyser.frequencyBinCount;
  const nyquist = analyser.context.sampleRate / 2;
  const hzToBin = (hz) => Math.min(bins - 2, Math.max(1, Math.round((hz / nyquist) * bins)));
  const minBin = hzToBin(MIN_HZ);
  const maxBin = hzToBin(MAX_HZ);
  const ratio = maxBin / minBin;

  const ranges = [];
  for (let i = 0; i < bands; i++) {
    const lo = Math.floor(minBin * Math.pow(ratio, i / bands));
    const hi = Math.max(lo, Math.floor(minBin * Math.pow(ratio, (i + 1) / bands)) - 1);
    const center = minBin * Math.pow(ratio, (i + 0.5) / bands);
    ranges.push({ lo, hi, center });
  }
  return ranges;
}

/**
 * Full-width spectrum that drops from the top of the screen, mirrored around
 * the center (bass in the middle, treble toward the edges). Reads the analyser
 * straight from a ref each frame, so it never causes React re-renders.
 */
export default function Visualizer() {
  const canvasRef = useRef(null);
  const { analyserRef, isPlaying } = useAudioPlayer();

  const playingRef = useRef(isPlaying);
  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const ctx = canvas.getContext("2d");
    const hasRoundRect = typeof ctx.roundRect === "function";

    let width = 0;
    let barCount = 0;
    let half = 0;
    let levels = new Float32Array(0);
    let barGradient = null;
    let ranges = [];
    let rangesFor = null;
    let data = null;
    let idleDrawn = false;
    let frame = 0;

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      barCount = Math.max(8, Math.floor((width + (PITCH - BAR_W)) / PITCH));
      half = Math.ceil(barCount / 2);
      levels = new Float32Array(half);
      ranges = [];
      rangesFor = null;

      barGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      barGradient.addColorStop(0, "rgba(216, 180, 254, 0.95)");
      barGradient.addColorStop(0.5, "rgba(168, 85, 247, 0.6)");
      barGradient.addColorStop(1, "rgba(168, 85, 247, 0)");

      idleDrawn = false;
    };
    layout();
    window.addEventListener("resize", layout);

    const draw = () => {
      frame = requestAnimationFrame(draw);

      const playing = playingRef.current;
      const analyser = analyserRef.current;
      const live = playing && analyser;

      if (live) {
        if (!data || data.length !== analyser.frequencyBinCount) {
          data = new Uint8Array(analyser.frequencyBinCount);
        }
        if (rangesFor !== analyser || ranges.length !== half) {
          ranges = buildRanges(analyser, half);
          rangesFor = analyser;
        }
        analyser.getByteFrequencyData(data);
      }

      let sum = 0;
      let maxLevel = 0;
      for (let i = 0; i < half; i++) {
        let target = 0;
        if (live) {
          const { lo, hi, center } = ranges[i];
          // Interpolate between bins so the sparse low end still varies smoothly.
          const i0 = Math.floor(center);
          const frac = center - i0;
          let peak = data[i0] * (1 - frac) + data[i0 + 1] * frac;
          for (let k = lo; k <= hi; k++) if (data[k] > peak) peak = data[k];

          const t = half > 1 ? i / (half - 1) : 0;
          const tilt = 0.85 + 0.9 * t; // highs carry less energy, so lift them
          target = Math.min(1, Math.pow(peak / 255, 1.6) * tilt * 1.1);
        }
        const prev = levels[i];
        const value = prev + (target - prev) * (target > prev ? ATTACK : DECAY);
        levels[i] = value;
        sum += value;
        if (value > maxLevel) maxLevel = value;
      }

      // Nothing moving and already drawn: skip the repaint entirely.
      const idle = !live && maxLevel < 0.003;
      if (idle && idleDrawn) return;
      if (idle) levels.fill(0);

      ctx.clearRect(0, 0, width, HEIGHT);

      // Soft ambient wash that swells with the overall level.
      const avg = sum / half;
      const wash = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.7);
      wash.addColorStop(0, `rgba(168, 85, 247, ${0.08 + avg * 0.4})`);
      wash.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, HEIGHT);

      // All bars in a single path = a single fill.
      const center = (barCount - 1) / 2;
      const startX = (width - (barCount * PITCH - (PITCH - BAR_W))) / 2;
      const r = BAR_W / 2;
      ctx.beginPath();
      for (let j = 0; j < barCount; j++) {
        const idx = Math.min(half - 1, Math.floor(Math.abs(j - center)));
        const h = MIN_BAR + levels[idx] * (MAX_BAR - MIN_BAR);
        const x = startX + j * PITCH;
        // Start above the screen so only the bottom ends are rounded.
        if (hasRoundRect) ctx.roundRect(x, -r, BAR_W, h + r, r);
        else ctx.rect(x, 0, BAR_W, h);
      }
      ctx.fillStyle = barGradient;
      ctx.fill();

      idleDrawn = idle;
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", layout);
    };
  }, [analyserRef]);

  return <canvas className="visualizer" ref={canvasRef} aria-hidden="true" />;
}
