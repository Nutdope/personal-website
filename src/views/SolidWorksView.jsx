import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ModelViewer from "../components/ModelViewer";
import { SW_MODELS } from "../data/solidworks";
import { pageTransition } from "./transitions";

export default function SolidWorksView() {
  const [activeId, setActiveId] = useState(SW_MODELS[0].id);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState({ loading: true, error: null });

  const model = SW_MODELS.find((m) => m.id === activeId) ?? SW_MODELS[0];

  return (
    <motion.section className="view view--sw" {...pageTransition}>
      <Link to="/portfolio" className="sw-back">
        <i className="fa-solid fa-arrow-left" /> Portfolio
      </Link>

      <header className="sw-header">
        <h1 className="portfolio-title">SolidWorks</h1>
        <p className="portfolio-subtitle">Pick a part, then drag to rotate it.</p>
      </header>

      <div className="sw-layout">
        <div className="sw-stage">
          <ModelViewer
            model={model}
            autoRotate={autoRotate}
            wireframe={wireframe}
            resetKey={resetKey}
            onStatus={setStatus}
          />

          <div className="sw-toolbar">
            <button
              type="button"
              className={`sw-tool${autoRotate ? " active" : ""}`}
              onClick={() => setAutoRotate((v) => !v)}
              aria-pressed={autoRotate}
              aria-label="Auto-rotate"
              title="Auto-rotate"
            >
              <i className="fa-solid fa-rotate" />
            </button>
            <button
              type="button"
              className={`sw-tool${wireframe ? " active" : ""}`}
              onClick={() => setWireframe((v) => !v)}
              aria-pressed={wireframe}
              aria-label="Wireframe"
              title="Wireframe"
            >
              <i className="fa-solid fa-draw-polygon" />
            </button>
            <button
              type="button"
              className="sw-tool"
              onClick={() => setResetKey((k) => k + 1)}
              aria-label="Reset view"
              title="Reset view"
            >
              <i className="fa-solid fa-expand" />
            </button>
          </div>

          <p className="sw-hint">drag to rotate · scroll to zoom · right-drag to pan</p>

          {status.loading && (
            <div className="sw-overlay">
              <i className="fa-solid fa-circle-notch fa-spin" /> Loading model...
            </div>
          )}
          {status.error && (
            <div className="sw-overlay">
              <span>{status.error}</span>
            </div>
          )}
        </div>

        <aside className="sw-side">
          <div className="sw-list">
            {SW_MODELS.map((m) => {
              const active = m.id === model.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`sw-item${active ? " active" : ""}`}
                  onClick={() => setActiveId(m.id)}
                  aria-pressed={active}
                >
                  {active && (
                    <motion.span
                      layoutId="sw-active"
                      className="sw-item-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="sw-item-icon">
                    <i className={m.icon} />
                  </span>
                  <span className="sw-item-text">
                    <span className="sw-item-name">{m.name}</span>
                    <span className="sw-item-sub">{m.tags?.[0] ?? "Part"}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={model.id}
              className="sw-info"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="sw-info-title">{model.name}</h2>
              <p className="project-desc">{model.description}</p>

              {model.specs?.length > 0 && (
                <dl className="sw-specs">
                  {model.specs.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {model.tags?.length > 0 && (
                <ul className="project-tags">
                  {model.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>
    </motion.section>
  );
}
