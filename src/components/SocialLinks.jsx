import { useEffect, useRef, useState } from "react";
import { DISCORD_FALLBACK_TAG, SOCIALS } from "../config";

export default function SocialLinks({ discordTag }) {
  const tag = discordTag || DISCORD_FALLBACK_TAG;
  const [copied, setCopied] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="socials-row">
      {SOCIALS.map((s) => (
        <a
          key={s.id}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon-btn"
          title={s.label}
          aria-label={s.label}
        >
          <i className={s.icon} />
        </a>
      ))}
      <button
        type="button"
        className="social-icon-btn"
        onClick={copy}
        title="Copy Discord Tag"
        aria-label="Copy Discord tag"
      >
        {copied ? (
          <i className="fa-solid fa-check" style={{ color: "#22c55e" }} />
        ) : (
          <i className="fa-brands fa-discord" />
        )}
      </button>
    </div>
  );
}
