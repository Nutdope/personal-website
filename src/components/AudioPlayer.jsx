import { motion } from "framer-motion";
import { useAudioPlayer } from "../context/AudioPlayerContext";

const hover = { y: -2, scale: 1.04 };
const tap = { scale: 0.92 };

/** Persistent play/pause + skip cluster. Lives outside the routes. */
export default function AudioPlayer() {
  const { isPlaying, toggle, next } = useAudioPlayer();

  return (
    <div className="audio-controls-group">
      <motion.button
        type="button"
        className={`audio-control-sq${isPlaying ? " playing" : ""}`}
        onClick={toggle}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        aria-pressed={isPlaying}
        title="Play / Pause"
        whileHover={hover}
        whileTap={tap}
      >
        <i className={`fa-solid ${isPlaying ? "fa-volume-high" : "fa-volume-xmark"}`} />
      </motion.button>

      <motion.button
        type="button"
        className="audio-control-sq"
        onClick={next}
        aria-label="Next song"
        title="Skip to next track"
        whileHover={hover}
        whileTap={tap}
      >
        <i className="fa-solid fa-forward-step" />
      </motion.button>
    </div>
  );
}
