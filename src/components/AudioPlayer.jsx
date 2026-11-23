import { useAudioPlayer } from "../context/AudioPlayerContext";
import { useVolumeHold } from "../hooks/useVolumeHold";
import NowPlaying from "./NowPlaying";
import Visualizer from "./Visualizer";
import VolumePanel from "./VolumePanel";

/**
 * Persistent audio UI: the full-width visualizer along the top of the screen,
 * plus one combined pill (sound + skip) and the "Now playing" chip next to it.
 * Rendered outside the routes, so it stays on every view.
 */
export default function AudioPlayer() {
  const { isPlaying, next } = useAudioPlayer();
  const { volume, open, adjusting, trackRef, buttonProps, panelProps, sliderProps } =
    useVolumeHold();

  const icon =
    !isPlaying || volume === 0
      ? "fa-volume-xmark"
      : volume < 0.4
        ? "fa-volume-low"
        : "fa-volume-high";

  return (
    <>
      <Visualizer />

      <div className="audio-controls-group">
        <div className="audio-row">
          <div className={`audio-pill${isPlaying ? " playing" : ""}`}>
            <button
              type="button"
              className={`audio-btn sound-btn${isPlaying ? " playing" : ""}${adjusting ? " adjusting" : ""}`}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              title="Click: play / pause - Hold: volume"
              {...buttonProps}
            >
              <i className={`fa-solid ${icon}`} />
            </button>

            <span className="audio-divider" aria-hidden="true" />

            <button
              type="button"
              className="audio-btn"
              onClick={next}
              aria-label="Next song"
              title="Skip to next track"
            >
              <i className="fa-solid fa-forward-step" />
            </button>
          </div>

          <NowPlaying />
        </div>

        <VolumePanel
          open={open}
          adjusting={adjusting}
          volume={volume}
          trackRef={trackRef}
          panelProps={panelProps}
          sliderProps={sliderProps}
        />
      </div>
    </>
  );
}
