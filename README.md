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
    useVolumeHold.js            Click = play/pause, hold = volume bar
  lib/discord.js                Avatar / clan / badge / activity helpers
  components/
    AudioPlayer.jsx             Persistent control pill (sound + skip) + visualizer
    Visualizer.jsx              Full-width spectrum hanging from the top of the screen
    VolumePanel.jsx             Slide-out volume bar
    EntryGate.jsx               "Click to enter" overlay (starts audio)
    ParticleBackground.jsx      Canvas particles
    DiscordCard.jsx             Presence card
    SocialLinks.jsx             Social icons + copy-Discord-tag button
    NavTabs.jsx                 Bottom pill nav with sliding highlight
    ProjectCard.jsx             Portfolio card (whole card can link to a page)
    ModelViewer.jsx             three.js viewer (orbit, zoom, wireframe, reset)
  views/
    BioView.jsx, PortfolioView.jsx, SolidWorksView.jsx, transitions.js
  data/projects.js              Your portfolio entries (edit this)
  data/solidworks.js            The 3D parts in the SolidWorks viewer (edit this)
  lib/placeholderModels.js      Built-in stand-in parts (gear, flange, bracket)
```

## How audio survives view changes

`AudioPlayerProvider` renders the only `<audio>` element and sits above
`<BrowserRouter>`'s routes, so route changes only swap the `<main>` content.
`AudioPlayer` (the controls) and `NavTabs` are rendered outside `<Routes>`,
so they stay mounted and visible on every view.

## Visualizer and volume

- The visualizer is a canvas along the top of the screen. It reads an `AnalyserNode`
  from the audio provider every frame (no React re-renders), mirrored around the
  center with bass in the middle. Tweak the look with the constants at the top of
  `components/Visualizer.jsx` (`MAX_BAR`, `PITCH`, `ATTACK`, `DECAY`, ...).
- Sound + skip are one pill on top of the visualizer.
- Click the sound icon to play/pause. Press and hold it (~0.25s) and the volume bar
  slides out; keep holding and drag left/right to change volume, or grab the bar
  directly. Arrow keys on the focused icon also work. Volume is remembered in
  `localStorage`.
- Volume is applied through a Web Audio `GainNode` (works on iOS, where
  `audio.volume` is read-only). The audio files must be same-origin, which files in
  `public/` are.
- Users with "reduce motion" enabled get no visualizer animation.

## SolidWorks 3D viewer

The "SolidWorks Projects" card opens `/portfolio/solidworks`: a three.js viewer where
you drag to rotate, scroll/pinch to zoom and right-drag to pan, with a list to switch
between parts, plus auto-rotate, wireframe and reset-view buttons. The viewer is
lazy-loaded, so three.js only downloads when someone opens that page. Audio keeps
playing while you're in it.

**Adding your own parts**

1. Export from SolidWorks: `File > Save As > STL` (binary is fine). Browsers can't open
   `.sldprt` / `.sldasm` directly. For colours or assemblies, convert STEP to `.glb`
   (Blender, FreeCAD or an online converter).
2. Copy the files into `public/assets/models/`.
3. Add an entry to `src/data/solidworks.js`:

```js
{
  id: "my-part",
  name: "My Part",
  description: "What it is and what you designed.",
  icon: "fa-solid fa-gear",
  color: "#c4b5fd",
  tags: ["Part"],
  specs: [["Material", "Aluminium 6061"]],
  source: { type: "stl", url: asset("assets/models/my-part.stl") },
  // rotation: [-90, 0, 0],   // if it loads lying on its side
}
```

STL files have no colour, so `color` tints them; `.glb` files keep their own materials.
Every model is automatically centred and scaled to fit. The three built-in parts are
placeholders, so delete them once you have your own.

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
