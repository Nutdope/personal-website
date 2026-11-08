import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AudioPlayerProvider } from "./context/AudioPlayerContext.jsx";
import "./index.css";

// The audio provider sits ABOVE the router and the animated routes, so the
// <audio> element is never unmounted when you switch views.
//
// Hosting on GitHub Pages (no SPA fallback)? Swap BrowserRouter for HashRouter.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AudioPlayerProvider>
        <App />
      </AudioPlayerProvider>
    </BrowserRouter>
  </StrictMode>
);
