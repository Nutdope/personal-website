import { SITE, USER_TIERS } from "../config";

const BADGE_BASE = "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG";
const badgeUrl = (file) => `${BADGE_BASE}/${file}.svg`;

export const NITRO_BADGES = {
  standard: badgeUrl("nitro"),
  bronze: badgeUrl("nitro_bronze"),
  silver: badgeUrl("nitro_silver"),
  gold: badgeUrl("nitro_gold"),
  platinum: badgeUrl("nitro_platinum"),
  diamond: badgeUrl("nitro_diamond"),
  emerald: badgeUrl("nitro_emerald"),
  ruby: badgeUrl("nitro_ruby"),
  fire: badgeUrl("nitro_fire"),
};

export const BOOST_BADGES = {
  "1_month": badgeUrl("boosting_1_months"),
  "2_months": badgeUrl("boosting_2_months"),
  "3_months": badgeUrl("boosting_3_months"),
  "6_months": badgeUrl("boosting_6_months"),
  "9_months": badgeUrl("boosting_9_months"),
  "12_months": badgeUrl("boosting_12_months"),
  "15_months": badgeUrl("boosting_15_months"),
  "18_months": badgeUrl("boosting_18_months"),
  "24_months": badgeUrl("boosting_24_months"),
};

// Discord public_flags bit -> badge file name
const PUBLIC_FLAG_BADGES = [
  { flag: 64, key: "hypesquad_bravery" },
  { flag: 128, key: "hypesquad_brilliance" },
  { flag: 256, key: "hypesquad_balance" },
  { flag: 512, key: "early_supporter" },
  { flag: 4194304, key: "active_developer" },
];

const humanize = (key) => key.replace(/_/g, " ");

export function buildAvatarUrl(user) {
  if (!user.avatar) return SITE.fallbackAvatar;
  const ext = user.avatar.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
}

export function getClan(user) {
  const clan = user.primary_guild || user.clan;
  if (!clan?.tag) return null;
  const guildId = clan.identity_guild_id || clan.guild_id;
  return {
    tag: clan.tag,
    iconUrl:
      clan.badge && guildId
        ? `https://cdn.discordapp.com/clan-badges/${guildId}/${clan.badge}.png?size=32`
        : null,
  };
}

export function buildBadges(user) {
  const list = [];

  if (USER_TIERS.nitro_tier) {
    list.push({
      key: "nitro",
      src: NITRO_BADGES[USER_TIERS.nitro_tier] || NITRO_BADGES.standard,
      // If a tier asset fails to load, fall back to the base Nitro badge.
      fallbackSrc: NITRO_BADGES.standard,
      label: `Discord Nitro (${USER_TIERS.nitro_tier})`,
    });
  }

  if (USER_TIERS.boost_tier && BOOST_BADGES[USER_TIERS.boost_tier]) {
    list.push({
      key: "boost",
      src: BOOST_BADGES[USER_TIERS.boost_tier],
      label: `Server Booster (${USER_TIERS.boost_tier.replace("_", " ")})`,
    });
  }

  const flags = user.public_flags || 0;
  for (const { flag, key } of PUBLIC_FLAG_BADGES) {
    if (flags & flag) list.push({ key, src: badgeUrl(key), label: humanize(key) });
  }

  return list;
}

/** -> { kind: "spotify" | "game" | "custom" | "idle", ... } */
export function getActivity(data) {
  if (data.listening_to_spotify && data.spotify) {
    return { kind: "spotify", song: data.spotify.song, artist: data.spotify.artist };
  }
  const activities = data.activities || [];
  const game = activities.find((a) => a.type === 0);
  if (game) return { kind: "game", name: game.name };
  const custom = activities.find((a) => a.type === 4);
  if (custom?.state) return { kind: "custom", text: custom.state };
  return { kind: "idle" };
}

/** Flattens Lanyard's response into what the UI needs. */
export function getDiscordProfile(data) {
  if (!data?.discord_user) return null;
  const user = data.discord_user;
  return {
    username: user.username,
    displayName: user.global_name || user.username,
    avatarUrl: buildAvatarUrl(user),
    status: data.discord_status || "offline",
    clan: getClan(user),
    badges: buildBadges(user),
    activity: getActivity(data),
  };
}
