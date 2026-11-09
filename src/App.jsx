import { lazy, Suspense, useMemo } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import AudioPlayer from "./components/AudioPlayer";
import EntryGate from "./components/EntryGate";
import NavTabs from "./components/NavTabs";
import ParticleBackground from "./components/ParticleBackground";
import { DISCORD_USER_ID, LANYARD_POLL_MS, SITE } from "./config";
import { useLanyard } from "./hooks/useLanyard";
import { useTypewriterTitle } from "./hooks/useTypewriterTitle";
import { getDiscordProfile } from "./lib/discord";
import BioView from "./views/BioView";
import PortfolioView from "./views/PortfolioView";

// Lazy-loaded so three.js (the heavy part) only downloads when someone opens the viewer.
const SolidWorksView = lazy(() => import("./views/SolidWorksView"));

function ViewLoading() {
  return (
    <div className="view-loading">
      <i className="fa-solid fa-circle-notch fa-spin" /> Loading...
    </div>
  );
}

export default function App() {
  const location = useLocation();

  useTypewriterTitle(`@${SITE.handle}`);

  // Fetched once here (not inside a view) so switching tabs doesn't refetch
  // or flash a "loading..." state.
  const { data } = useLanyard(DISCORD_USER_ID, LANYARD_POLL_MS);
  const profile = useMemo(() => getDiscordProfile(data), [data]);

  return (
    <>
      <ParticleBackground />
      <EntryGate />

      {/* Everything above and below <main> persists across route changes. */}
      <AudioPlayer />

      <main className="page-container">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<BioView profile={profile} />} />
            <Route path="/portfolio" element={<PortfolioView profile={profile} />} />
            <Route
              path="/portfolio/solidworks"
              element={
                <Suspense fallback={<ViewLoading />}>
                  <SolidWorksView />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      <NavTabs />
    </>
  );
}
