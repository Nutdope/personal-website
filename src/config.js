// Central place for everything you'd normally edit by hand.

// Resolves a file in /public regardless of the Vite `base` setting.
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const SITE = {
  handle: "nutdope",
  bio: "Building things, gaming, and designing aesthetics.",
  fallbackAvatar: asset("assets/images/avatar.png"),
};

/* ---------------------------------------------------- */
/* Discord / Lanyard                                    */
/* ---------------------------------------------------- */
// Numeric Discord user ID (you must also be in the Lanyard Discord server
// for the API to return data: https://discord.gg/lanyard)
export const DISCORD_USER_ID = "250639982207696896";
export const DISCORD_FALLBACK_TAG = "nutdope";
export const LANYARD_POLL_MS = 10000;

// nitro_tier: standard | bronze | silver | gold | platinum | diamond | emerald | ruby | fire
// boost_tier: 1_month | 2_months | 3_months | 6_months | 9_months | 12_months | 15_months | 18_months | 24_months
// Set either to null to hide that badge.
export const USER_TIERS = {
  nitro_tier: "platinum",
  boost_tier: "18_months",
};

/* ---------------------------------------------------- */
/* Audio                                                */
/* ---------------------------------------------------- */
// Files live in public/assets/audio/
const tracks = import.meta.glob("./assets/audio/*.{mp3,ogg,wav,m4a}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const PLAYLIST = Object.keys(tracks).sort().map((k) => tracks[k]);

// Starting volume (0-1) on a visitor's first load; after that their choice is remembered.
export const AUDIO_VOLUME = 0.4;

/* ---------------------------------------------------- */
/* Socials (the Discord copy button is added separately) */
/* ---------------------------------------------------- */
export const SOCIALS = [
  {
    id: "steam",
    label: "Steam",
    href: "https://steamcommunity.com/id/nutdope/",
    icon: "fa-brands fa-steam",
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/nutdope",
    icon: "fa-brands fa-github",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/antonio.alecs/",
    icon: "fa-brands fa-instagram",
  },
];
