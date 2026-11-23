# nutdope.xyz

Personal website and 3D CAD portfolio built with React, Vite, and Three.js. It features live Discord status syncing via Lanyard, a persistent background music player, and an interactive browser-based SolidWorks model viewer.

## Features

- **Interactive Bio & Navigation:** Clean multi-view routing with Framer Motion transitions, particle background, and an entry overlay for web audio playback.
- **Live Discord Status:** Real-time status and activity integration using the Lanyard API.
- **3D CAD Viewer:** Browser-based STL model viewer built with Three.js for displaying SolidWorks parts with interactive orbit controls and technical specs.
- **Audio System:** Persistent audio player context that stays active across navigation tabs.
- **Analytics:** Basic visit logging via a Vercel serverless function and `@vercel/analytics`.

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Animation & 3D:** Three.js, Framer Motion
- **Services:** Lanyard API, Vercel Serverless Functions
- **Deployment:** Vercel

## Project Structure

```text
├── api/                  # Serverless function for visit logging
├── public/               # STL models, audio tracks, and static assets
└── src/
    ├── components/       # Audio player, 3D model viewer, UI components
    ├── context/          # Persistent audio state provider
    ├── hooks/            # Lanyard Discord status hook & utilities
    ├── views/            # Page layouts (Bio, Portfolio, SolidWorks viewer)
    ├── App.jsx
    └── main.jsx
```

## Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local dev server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```