# nutdope-site

Vite + React single-page version of the bio page: glassmorphic dark-purple theme,
live Discord presence (Lanyard), persistent background music, and a Bio / Portfolio
view switcher that never reloads the page or interrupts audio.

## Run it

Requires Node 20.19+ (or 22+).

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Add your assets

Copy your old `assets/audio` and `assets/images` folders into `public/assets/`:

```
public/assets/audio/song.mp3, song2.mp3, song3.mp3
public/assets/images/avatar.png, favicon.png
```

## Structure

```
index.html
vite.config.js
public/
  _redirects                    SPA fallback for Netlify / Cloudflare Pages
  assets/audio, assets/images
src/
  main.jsx                      Router + AudioPlayerProvider (both above the routes)
  App.jsx                       Layout, Lanyard fetch, AnimatePresence routes
  config.js                     Discord ID, tiers, playlist, socials, site text
  index.css                     All styling (CSS variables for the theme)
  context/AudioPlayerContext    Owns the single <audio> element + play/pause/next
  hooks/
    useLanyard.js               Polling Lanyard hook
    useTypewriterTitle.js       Animated tab title
    useCardTilt.js              3D mouse-follow tilt
  lib/discord.js                Avatar / clan / badge / activity helpers
  components/
    AudioPlayer.jsx             Persistent play/pause + skip buttons
    EntryGate.jsx               "Click to enter" overlay (starts audio)
    ParticleBackground.jsx      Canvas particles
    DiscordCard.jsx             Presence card
    SocialLinks.jsx             Social icons + copy-Discord-tag button
    NavTabs.jsx                 Bottom pill nav with sliding highlight
    ProjectCard.jsx             Portfolio card
  views/
    BioView.jsx, PortfolioView.jsx, transitions.js
  data/projects.js              Your portfolio entries (edit this)
```

## How audio survives view changes

`AudioPlayerProvider` renders the only `<audio>` element and sits above
`<BrowserRouter>`'s routes, so route changes only swap the `<main>` content.
`AudioPlayer` (the controls) and `NavTabs` are rendered outside `<Routes>`,
so they stay mounted and visible on every view.

## Deploying

- Netlify / Cloudflare Pages: `public/_redirects` already handles deep links like `/portfolio`.
- Vercel: the Vite preset handles it.
- GitHub Pages (no SPA fallback): in `src/main.jsx` swap `BrowserRouter` for `HashRouter`,
  and set `base: "/<repo>/"` in `vite.config.js` if it's a project page.

## Behavior changes from the original

- The `<audio>` element no longer has the `loop` attribute. In the original it made the
  `ended` handler (auto-advance to the next track) never fire.
- Discord text (song titles, clan tags) is rendered by React rather than `innerHTML`,
  so a hostile song title can't inject markup.
- Lanyard polling pauses while the tab is hidden.
- Lanyard is fetched once in `App`, so switching tabs doesn't re-fetch or flash "loading...".
