import { AnimatePresence, motion } from "framer-motion";

/** Slide-out volume bar. All behavior comes from useVolumeHold(). */
export default function VolumePanel({ open, adjusting, volume, trackRef, panelProps, sliderProps }) {
  const pct = volume * 100;
  const icon =
    volume === 0 ? "fa-volume-xmark" : volume < 0.4 ? "fa-volume-low" : "fa-volume-high";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`volume-panel${adjusting ? " adjusting" : ""}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          {...panelProps}
        >
          <i className={`fa-solid ${icon} volume-icon`} aria-hidden="true" />

          <div className="volume-hit" {...sliderProps}>
            <div
              className="volume-track"
              ref={trackRef}
              role="slider"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
            >
              <div className="volume-fill" style={{ width: `${pct}%` }} />
              <div className="volume-thumb" style={{ left: `${pct}%` }} />
            </div>
          </div>

          <span className="volume-value">{Math.round(pct)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
