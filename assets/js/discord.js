// Paste your numeric Discord User ID here
const DISCORD_USER_ID = "250639982207696896";

/* 
=====================================================
  TIER CONFIGURATION
=====================================================
  nitro_tier: "platinum" (12 Months / 1 Year Nitro Streak)
  boost_tier: "12_months", "15_months", "24_months", etc.
*/
const USER_TIERS = {
  nitro_tier: "platinum",
  boost_tier: "18_months"
};

// Verified Evolving Nitro Tenure Streak Badges
const NITRO_BADGE_URLS = {
  standard: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro.svg",
  bronze: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_bronze.svg",
  silver: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_silver.svg",
  gold: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_gold.svg",
  platinum: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_platinum.svg",
  diamond: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_diamond.svg",
  emerald: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_emerald.svg",
  ruby: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_ruby.svg",
  fire: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/nitro_fire.svg"
};

// Verified Server Booster Streak Gem SVGs
const BOOST_BADGE_SVGS = {
  "1_month": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_1_months.svg",
  "2_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_2_months.svg",
  "3_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_3_months.svg",
  "6_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_6_months.svg",
  "9_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_9_months.svg",
  "12_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_12_months.svg",
  "15_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_15_months.svg",
  "18_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_18_months.svg",
  "24_months": "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/boosting_24_months.svg"
};

// Verified Discord Public Badges
const PROFILE_BADGES = {
  hypesquad_bravery: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/hypesquad_bravery.svg",
  hypesquad_brilliance: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/hypesquad_brilliance.svg",
  hypesquad_balance: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/hypesquad_balance.svg",
  active_developer: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/active_developer.svg",
  early_supporter: "https://cdn.jsdelivr.net/gh/merlinfuchs/discord-badges@latest/SVG/early_supporter.svg"
};

function parseFlags(flags) {
  const result = [];
  if (flags & 64) result.push("hypesquad_bravery");
  if (flags & 128) result.push("hypesquad_brilliance");
  if (flags & 256) result.push("hypesquad_balance");
  if (flags & 512) result.push("early_supporter");
  if (flags & 4194304) result.push("active_developer");
  return result;
}

async function fetchDiscordData() {
  if (!DISCORD_USER_ID || DISCORD_USER_ID === "YOUR_DISCORD_USER_ID_HERE") {
    console.warn("Set DISCORD_USER_ID in assets/js/discord.js");
    return;
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    const json = await res.json();
    if (!json.success || !json.data) return;

    const data = json.data;
    const user = data.discord_user;

    // 1. Top Avatar & Display Name
    const displayNameEl = document.getElementById('display-name');
    const mainAvatarEl = document.getElementById('main-avatar');
    if (displayNameEl) displayNameEl.textContent = user.global_name || user.username;

    let avatarUrl = "assets/images/avatar.png";
    if (user.avatar) {
      const ext = user.avatar.startsWith('a_') ? 'gif' : 'webp';
      avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
    }
    if (mainAvatarEl) mainAvatarEl.src = avatarUrl;

    // 2. Embedded Box Avatar & Live Status Dot
    const discordAvatarEl = document.getElementById('discord-avatar');
    if (discordAvatarEl) discordAvatarEl.src = avatarUrl;

    const statusDot = document.getElementById('discord-status-dot');
    const status = data.discord_status || 'offline';
    if (statusDot) {
      statusDot.className = `discord-status-dot ${status}`;
    }

    // 3. Username & Copy Tag
    const discordUsernameEl = document.getElementById('discord-username');
    if (discordUsernameEl) discordUsernameEl.textContent = user.username;

    const copyBtn = document.getElementById('copy-discord');
    if (copyBtn) copyBtn.setAttribute('data-tag', user.username);

    // 4. Discord Clan / Server Tag
    const clanTagEl = document.getElementById('discord-clan-tag');
    if (clanTagEl) {
      const clan = user.primary_guild || user.clan;

      if (clan && clan.tag) {
        let clanIconHtml = '';
        const guildId = clan.identity_guild_id || clan.guild_id;

        if (clan.badge && guildId) {
          const badgeUrl = `https://cdn.discordapp.com/clan-badges/${guildId}/${clan.badge}.png?size=32`;
          clanIconHtml = `<img src="${badgeUrl}" alt="Clan Icon" class="clan-badge-icon" onerror="this.remove()">`;
        }

        clanTagEl.innerHTML = `${clanIconHtml}<span class="clan-text">${clan.tag}</span>`;
        clanTagEl.classList.remove('hidden');
      } else {
        clanTagEl.classList.add('hidden');
      }
    }

    // 5. Discord Badges
    const badgesContainer = document.getElementById('discord-badges');
    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      const badgeList = [];

      // Platinum Nitro Tier
      const nitroSrc = NITRO_BADGE_URLS[USER_TIERS.nitro_tier] || NITRO_BADGE_URLS.standard;
      badgeList.push({
        src: nitroSrc,
        alt: `Discord Nitro (${USER_TIERS.nitro_tier})`
      });

      // Server Booster Tier
      if (USER_TIERS.boost_tier && BOOST_BADGE_SVGS[USER_TIERS.boost_tier]) {
        badgeList.push({
          src: BOOST_BADGE_SVGS[USER_TIERS.boost_tier],
          alt: `Server Booster (${USER_TIERS.boost_tier})`
        });
      }

      // Public Badges (HypeSquad, Active Developer, etc.)
      const flagBadges = parseFlags(user.public_flags || 0);
      flagBadges.forEach((key) => {
        if (PROFILE_BADGES[key]) {
          badgeList.push({ src: PROFILE_BADGES[key], alt: key });
        }
      });

      // Render Badge Elements
      badgeList.forEach((badge) => {
        const img = document.createElement('img');
        img.src = badge.src;
        img.alt = badge.alt;
        img.title = badge.alt;
        img.className = 'discord-badge-icon';
        img.onerror = () => {
          // If a specific tier CDN fails, gracefully fall back to base Nitro vector
          if (badge.alt.includes('Nitro')) {
            img.src = NITRO_BADGE_URLS.standard;
          } else {
            img.remove();
          }
        };
        badgesContainer.appendChild(img);
      });
    }

    // 6. Real-time Status / Spotify / Game Activity
    const statusMsgEl = document.getElementById('discord-status-msg');
    if (statusMsgEl) {
      if (data.listening_to_spotify && data.spotify) {
        statusMsgEl.innerHTML = `<i class="fa-brands fa-spotify" style="color:#1db954"></i> ${data.spotify.song} - ${data.spotify.artist}`;
      } else if (data.activities && data.activities.length > 0) {
        const game = data.activities.find((a) => a.type === 0);
        const custom = data.activities.find((a) => a.type === 4);

        if (game) {
          statusMsgEl.innerHTML = `<i class="fa-solid fa-gamepad" style="color:var(--accent)"></i> Playing <b>${game.name}</b>`;
        } else if (custom && custom.state) {
          statusMsgEl.textContent = custom.state;
        } else {
          statusMsgEl.textContent = "currently doing nothing";
        }
      } else {
        statusMsgEl.textContent = "currently doing nothing";
      }
    }

  } catch (err) {
    console.error("Lanyard error:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchDiscordData();
  setInterval(fetchDiscordData, 10000);
});