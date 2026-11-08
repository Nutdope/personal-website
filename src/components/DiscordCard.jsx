import { useEffect, useState } from "react";
import { SITE } from "../config";

function Badge({ badge }) {
  const [src, setSrc] = useState(badge.src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(badge.src);
    setFailed(false);
  }, [badge.src]);

  if (failed) return null;

  return (
    <img
      className="discord-badge-icon"
      src={src}
      alt={badge.label}
      title={badge.label}
      onError={() => {
        if (badge.fallbackSrc && src !== badge.fallbackSrc) setSrc(badge.fallbackSrc);
        else setFailed(true);
      }}
    />
  );
}

function ClanTag({ clan }) {
  const [iconOk, setIconOk] = useState(true);
  return (
    <span className="discord-clan-tag">
      {clan.iconUrl && iconOk && (
        <img
          src={clan.iconUrl}
          alt="Clan icon"
          className="clan-badge-icon"
          onError={() => setIconOk(false)}
        />
      )}
      <span className="clan-text">{clan.tag}</span>
    </span>
  );
}

function ActivityLine({ activity }) {
  switch (activity.kind) {
    case "spotify":
      return (
        <>
          <i className="fa-brands fa-spotify" style={{ color: "#1db954" }} />{" "}
          {activity.song} - {activity.artist}
        </>
      );
    case "game":
      return (
        <>
          <i className="fa-solid fa-gamepad" style={{ color: "var(--accent)" }} /> Playing{" "}
          <b>{activity.name}</b>
        </>
      );
    case "custom":
      return activity.text;
    default:
      return "currently doing nothing";
  }
}

/** Presentational card. Pass the profile from getDiscordProfile(), or null while loading. */
export default function DiscordCard({ profile }) {
  const status = profile?.status ?? "offline";

  return (
    <div className="discord-card-box">
      <div className="discord-pfp-wrapper">
        <img
          src={profile?.avatarUrl ?? SITE.fallbackAvatar}
          alt="Discord avatar"
          className="discord-pfp"
        />
        <span
          className={`discord-status-dot ${status}`}
          role="img"
          aria-label={`Status: ${status}`}
        />
      </div>

      <div className="discord-info">
        <div className="discord-header-line">
          <span className="discord-username">{profile?.username ?? "loading..."}</span>
          {profile?.clan && <ClanTag clan={profile.clan} />}
          <div className="discord-badges">
            {profile?.badges.map((b) => (
              <Badge key={b.key} badge={b} />
            ))}
          </div>
        </div>
        <div className="discord-status-msg">
          {profile ? <ActivityLine activity={profile.activity} /> : "currently doing nothing"}
        </div>
      </div>
    </div>
  );
}
