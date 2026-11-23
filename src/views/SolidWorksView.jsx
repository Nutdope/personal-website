import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ModelList from "../components/ModelList";
import ModelViewer from "../components/ModelViewer";
import PartsPanel from "../components/PartsPanel";
import { SW_MODELS } from "../data/solidworks";
import { pageTransition } from "./transitions";
import "./solidworks.css";

// "kind" is optional in solidworks.js: "part" (default) or "assembly".
const MODELS = SW_MODELS.map((m) => ({ ...m, kind: m.kind === "assembly" ? "assembly" : "part" }));
const COUNTS = {
  all: MODELS.length,
  part: MODELS.filter((m) => m.kind === "part").length,
  assembly: MODELS.filter((m) => m.kind === "assembly").length,
};

/** Hide everything except `id`, its ancestors and its descendants. */
function isolateSet(parts, id) {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const keep = new Set([id]);
  for (let p = byId.get(id); p?.parent; p = byId.get(p.parent)) keep.add(p.parent);
  for (const p of parts) {
    for (let a = p; a; a = byId.get(a.parent)) {
      if (a.id === id) {
        keep.add(p.id);
        break;
      }
    }
  }
  return new Set(parts.filter((p) => !keep.has(p.id)).map((p) => p.id));
}

export default function SolidWorksView() {
  const [activeId, setActiveId] = useState(MODELS[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState({ loading: true, error: null, progress: 0 });

  // Parts panel state (only used when the model has more than one part)
  const [parts, setParts] = useState(null);
  const [hidden, setHidden] = useState(() => new Set());
  const [selectedPart, setSelectedPart] = useState(null);
  const [hoverPart, setHoverPart] = useState(null);
  const [explode, setExplode] = useState(0);
  const [partsOpen, setPartsOpen] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 861px)").matches
  );

  const model = MODELS.find((m) => m.id === activeId) ?? MODELS[0];

  const visibleModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODELS.filter((m) => {
      if (filter !== "all" && m.kind !== filter) return false;
      if (!q) return true;
      return [m.name, m.description, ...(m.tags ?? [])].join(" ").toLowerCase().includes(q);
    });
  }, [query, filter]);

  const selectModel = (id) => {
    if (id === activeId) return;
    setActiveId(id);
    setParts(null);
    setHidden(new Set());
    setSelectedPart(null);
    setHoverPart(null);
    setExplode(0);
  };

  const toggleHidden = (id) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const specs = [...(model.specs ?? [])];
  if (parts) specs.push(["Parts", String(parts.length)]);

  return (
    <motion.section className="view view--sw" {...pageTransition}>
      <Link to="/portfolio" className="swv-back">
        <i className="fa-solid fa-arrow-left" /> Portfolio
      </Link>

      <header className="swv-header">
        <h1 className="portfolio-title">SolidWorks</h1>
        <p className="portfolio-subtitle">Pick a part or assembly, then drag to rotate it.</p>
      </header>

      <div className="swv-layout">
        <div className="swv-stage">
          <ModelViewer
            model={model}
            autoRotate={autoRotate}
            wireframe={wireframe}
            resetKey={resetKey}
            explode={explode}
            hidden={hidden}
            highlightId={hoverPart ?? selectedPart}
            onStatus={setStatus}
            onParts={setParts}
          />

          <div className="swv-caption">
            <span>{model.name}</span>
            {model.kind === "assembly" && <span className="swv-tag">Assembly</span>}
          </div>

          <div className="swv-toolbar">
            <button
              type="button"
              className={`swv-tool${autoRotate ? " active" : ""}`}
              onClick={() => setAutoRotate((v) => !v)}
              aria-pressed={autoRotate}
              aria-label="Auto-rotate"
              title="Auto-rotate"
            >
              <i className="fa-solid fa-rotate" />
            </button>
            <button
              type="button"
              className={`swv-tool${wireframe ? " active" : ""}`}
              onClick={() => setWireframe((v) => !v)}
              aria-pressed={wireframe}
              aria-label="Wireframe"
              title="Wireframe"
            >
              <i className="fa-solid fa-draw-polygon" />
            </button>
            <button
              type="button"
              className="swv-tool"
              onClick={() => setResetKey((k) => k + 1)}
              aria-label="Reset view"
              title="Reset view"
            >
              <i className="fa-solid fa-expand" />
            </button>
          </div>

          <p className="swv-hint">
            <span className="swv-hint-mouse">drag to rotate · scroll to zoom · right-drag to pan</span>
            <span className="swv-hint-touch">drag to rotate · pinch to zoom · two fingers to pan</span>
          </p>

          {status.loading && (
            <div className="swv-overlay swv-overlay--loading">
              <div className="swv-loader">
                <span>
                  <i className="fa-solid fa-circle-notch fa-spin" /> Loading model...
                </span>
                {status.progress > 0 && status.progress < 1 && (
                  <div className="swv-bar">
                    <div style={{ width: `${Math.round(status.progress * 100)}%` }} />
                  </div>
                )}
              </div>
            </div>
          )}
          {status.error && (
            <div className="swv-overlay">
              <span>{status.error}</span>
            </div>
          )}
        </div>

        <aside className="swv-side">
          <ModelList
            models={visibleModels}
            total={MODELS.length}
            counts={COUNTS}
            activeId={model.id}
            onSelect={selectModel}
            query={query}
            onQuery={setQuery}
            filter={filter}
            onFilter={setFilter}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={model.id}
              className="swv-card swv-info"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="swv-info-title">{model.name}</h2>
              <p className="project-desc">{model.description}</p>

              {specs.length > 0 && (
                <dl className="swv-specs">
                  {specs.map(([label, value]) => (
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

          {parts && (
            <div className="swv-parts-card">
              <PartsPanel
                parts={parts}
                hidden={hidden}
                highlightId={hoverPart ?? selectedPart}
                selectedId={selectedPart}
                explode={explode}
                open={partsOpen}
                onOpenChange={setPartsOpen}
                onToggle={toggleHidden}
                onIsolate={(id) => setHidden(isolateSet(parts, id))}
                onShowAll={() => setHidden(new Set())}
                onHover={setHoverPart}
                onSelect={(id) => setSelectedPart((prev) => (prev === id ? null : id))}
                onExplode={setExplode}
              />
            </div>
          )}
        </aside>
      </div>
    </motion.section>
  );
}
