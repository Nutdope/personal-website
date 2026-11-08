import { motion } from "framer-motion";
import DiscordCard from "../components/DiscordCard";
import SocialLinks from "../components/SocialLinks";
import { SITE } from "../config";
import { useCardTilt } from "../hooks/useCardTilt";
import { pageTransition } from "./transitions";

export default function BioView({ profile }) {
  const tiltRef = useCardTilt(12);

  return (
    <motion.section className="view view--bio" {...pageTransition}>
      {/* Tilt is applied to the inner card so it never fights the page transition. */}
      <div className="bio-card" ref={tiltRef}>
        <div className="profile-header">
          <div className="avatar-wrapper">
            <img
              src={profile?.avatarUrl ?? SITE.fallbackAvatar}
              alt="Profile"
              className="avatar"
            />
          </div>
          <h1 className="display-name">{profile?.displayName ?? SITE.handle}</h1>
        </div>

        <DiscordCard profile={profile} />

        <p className="bio-text">{SITE.bio}</p>

        <SocialLinks discordTag={profile?.username} />
      </div>
    </motion.section>
  );
}
