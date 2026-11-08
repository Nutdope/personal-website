import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAudioPlayer } from "../context/AudioPlayerContext";

/**
 * Full-screen "click to enter" overlay. The click doubles as the user gesture
 * browsers require before audio can start.
 */
export default function EntryGate() {
  const { play } = useAudioPlayer();
  const [open, setOpen] = useState(true);

  const enter = () => {
    play();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="gate-overlay"
          role="button"
          tabIndex={0}
          aria-label="Click anywhere to enter"
          onClick={enter}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              enter();
            }
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="gate-content">
            <i className="fa-solid fa-volume-high pulse-icon" />
            <p>[ click anywhere to enter ]</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
