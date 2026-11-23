import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PLAYLIST } from "../config";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { useTrackInfo } from "../lib/trackInfo";
import "./nowplaying.css";

/**
 * "Now playing" chip that sits next to the sound/skip pill: a small equalizer,
 * the title and the artist. Long names glide back and forth. It also feeds the
 * browser's media controls (lock screen, headphone buttons, media keys).
 */
export default function NowPlaying() {
  const { isPlaying, trackIndex, play, pause, next } = useAudioPlayer();
  const url = PLAYLIST[trackIndex];
  const info = useTrackInfo(url);
  const title = info.title || "Unknown track";
  const artist = info.artist;

  // Slide long text so the whole name can be read.
  const viewRef = useRef(null);
  const textRef = useRef(null);
  const [scroll, setScroll] = useState({ shift: 0, secs: 8 });

  useLayoutEffect(() => {
    const view = viewRef.current;
    const text = textRef.current;
    if (!view || !text) return undefined;

    const measure = () => {
      const overflow = text.scrollWidth - view.clientWidth;
      setScroll(
        overflow > 2
          ? { shift: overflow, secs: Math.max(6, overflow / 22 + 3) }
          : { shift: 0, secs: 8 }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    return () => observer.disconnect();
  }, [title, artist, url]);

  // Lock screen / Bluetooth / media-key integration
  useEffect(() => {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: artist || "" });
  }, [title, artist]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return undefined;
    const session = navigator.mediaSession;
    const handlers = { play, pause, nexttrack: next };
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // this browser doesn't support that action
      }
    }
    return () => {
      for (const action of Object.keys(handlers)) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // ignore
        }
      }
    };
  }, [play, pause, next]);

  if (!url) return null;

  return (
    <div className={`np${isPlaying ? " is-playing" : ""}`} aria-live="polite">
      <span className="np-eq" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>

      <div className="np-body">
        <span className="np-label">{isPlaying ? "Now playing" : "Paused"}</span>
        <div
          className={`np-view${scroll.shift ? " is-overflow" : ""}`}
          ref={viewRef}
          title={artist ? `${title} - ${artist}` : title}
        >
          <span
            key={url}
            ref={textRef}
            className={`np-text${scroll.shift ? " is-scrolling" : ""}`}
            style={{ "--np-shift": `-${scroll.shift}px`, "--np-secs": `${scroll.secs}s` }}
          >
            <span className="np-title">{title}</span>
            {artist && (
              <>
                <span className="np-sep"> — </span>
                <span className="np-artist">{artist}</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
