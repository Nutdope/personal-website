import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";

const HOLD_MS = 260; // press longer than this = "hold" (opens the volume bar)
const KEY_STEP = 0.05;

/**
 * Click the sound button = play/pause.
 * Press and hold it = the volume bar slides out, and you can keep holding and
 * drag left/right to change the volume (relative to where you started).
 * The bar can also be grabbed directly, and arrow keys work on the button.
 */
export function useVolumeHold() {
  const { volume, setVolume, toggle } = useAudioPlayer();
  const [open, setOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const trackRef = useRef(null);
  const volumeRef = useRef(volume);
  const holdTimer = useRef(0);
  const closeTimer = useRef(0);
  const releaseTimer = useRef(0);
  const heldRef = useRef(false); // a hold happened, so swallow the click that follows
  const buttonDrag = useRef(false);
  const sliderDrag = useRef(false);
  const lastX = useRef(0);
  const origin = useRef({ x: 0, v: 0 });

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(
    () => () => {
      clearTimeout(holdTimer.current);
      clearTimeout(closeTimer.current);
      clearTimeout(releaseTimer.current);
    },
    []
  );

  const cancelClose = useCallback(() => clearTimeout(closeTimer.current), []);
  const scheduleClose = useCallback((ms) => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), ms);
  }, []);

  const trackWidth = () => trackRef.current?.getBoundingClientRect().width || 0;

  // Absolute mapping (used when grabbing the bar itself).
  const setFromClientX = useCallback(
    (clientX) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      setVolume((clientX - rect.left) / rect.width);
    },
    [setVolume]
  );

  /* ---------------- sound button ---------------- */

  const endButtonPress = () => {
    clearTimeout(holdTimer.current);
    if (buttonDrag.current) {
      buttonDrag.current = false;
      setAdjusting(false);
      scheduleClose(1200);
    }
    // Clear the "held" flag after the trailing click event has had its chance.
    clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => {
      heldRef.current = false;
    }, 60);
  };

  const buttonProps = {
    onPointerEnter: (e) => {
  if (e.pointerType !== "mouse") return; // touch keeps using hold
  cancelClose();
  setOpen(true);
},
onPointerLeave: (e) => {
  if (e.pointerType !== "mouse") return;
  if (!buttonDrag.current && !sliderDrag.current) scheduleClose(500);
},
    onPointerDown: (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      heldRef.current = false;
      lastX.current = e.clientX;
      clearTimeout(releaseTimer.current);
      clearTimeout(holdTimer.current);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture unsupported - dragging still works while over the button
      }
      holdTimer.current = setTimeout(() => {
        heldRef.current = true;
        buttonDrag.current = true;
        origin.current = { x: lastX.current, v: volumeRef.current };
        cancelClose();
        setOpen(true);
        setAdjusting(true);
      }, HOLD_MS);
    },
    onPointerMove: (e) => {
      lastX.current = e.clientX;
      if (!buttonDrag.current) return;
      const w = trackWidth();
      if (w > 0) setVolume(origin.current.v + (e.clientX - origin.current.x) / w);
    },
    onPointerUp: endButtonPress,
    onPointerCancel: endButtonPress,
    onClick: () => {
      if (heldRef.current) {
        heldRef.current = false;
        return;
      }
      toggle();
    },
    onContextMenu: (e) => e.preventDefault(), // long-press menu on touch devices
    onKeyDown: (e) => {
      let delta = 0;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") delta = KEY_STEP;
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") delta = -KEY_STEP;
      if (!delta) return;
      e.preventDefault();
      setVolume(volume + delta);
      cancelClose();
      setOpen(true);
      scheduleClose(1500);
    },
  };

  /* ---------------- panel (keeps itself open while hovered) ---------------- */

  const panelProps = {
    onPointerEnter: cancelClose,
    onPointerLeave: () => {
      if (!sliderDrag.current && !buttonDrag.current) scheduleClose(500);
    },
  };

  /* ---------------- the slider itself ---------------- */

  const endSliderDrag = () => {
    if (!sliderDrag.current) return;
    sliderDrag.current = false;
    setAdjusting(false);
    scheduleClose(1200);
  };

  const sliderProps = {
    onPointerDown: (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      sliderDrag.current = true;
      setAdjusting(true);
      cancelClose();
      setFromClientX(e.clientX);
    },
    onPointerMove: (e) => {
      if (sliderDrag.current) setFromClientX(e.clientX);
    },
    onPointerUp: endSliderDrag,
    onPointerCancel: endSliderDrag,
  };

  return { volume, open, adjusting, trackRef, buttonProps, panelProps, sliderProps };
}
