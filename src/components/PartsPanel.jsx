/**
 * Parts tree for models that have more than one part. Hover (mouse) or tap a
 * row to make that part glow; the eye hides it, the target icon isolates it,
 * and the slider spreads the whole assembly apart.
 */
export default function PartsPanel({
  parts,
  hidden,
  highlightId,
  selectedId,
  explode,
  open,
  onOpenChange,
  onToggle,
  onIsolate,
  onShowAll,
  onHover,
  onSelect,
  onExplode,
}) {
  return (
    <section className="swv-card swv-panel">
      <button
        type="button"
        className="swv-panel-head"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
      >
        <span>
          <i className="fa-solid fa-sitemap" aria-hidden="true" /> Parts{" "}
          <span className="swv-count">{parts.length}</span>
        </span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="swv-panel-body">
          <label className="swv-explode">
            <span>
              <i className="fa-solid fa-expand" aria-hidden="true" /> Explode
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explode}
              onChange={(e) => onExplode(Number(e.target.value))}
              aria-label="Explode assembly"
            />
          </label>

          <div className="swv-panel-actions">
            <button type="button" onClick={onShowAll} disabled={hidden.size === 0}>
              <i className="fa-solid fa-eye" aria-hidden="true" /> Show all
            </button>
          </div>

          <ul className="swv-parts">
            {parts.map((p) => {
              const isHidden = hidden.has(p.id);
              return (
                <li
                  key={p.id}
                  className={`swv-part${isHidden ? " is-hidden" : ""}${highlightId === p.id ? " is-active" : ""}`}
                  style={{ paddingLeft: 8 + p.depth * 14 }}
                  onPointerEnter={(e) => e.pointerType === "mouse" && onHover(p.id)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
                >
                  <button
                    type="button"
                    className="swv-part-name"
                    onClick={() => onSelect(p.id)}
                    aria-pressed={selectedId === p.id}
                    title="Highlight this part"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    className="swv-icon-btn"
                    onClick={() => onIsolate(p.id)}
                    aria-label={`Show only ${p.name}`}
                    title="Show only this part"
                  >
                    <i className="fa-solid fa-bullseye" />
                  </button>
                  <button
                    type="button"
                    className="swv-icon-btn"
                    onClick={() => onToggle(p.id)}
                    aria-label={isHidden ? `Show ${p.name}` : `Hide ${p.name}`}
                    aria-pressed={isHidden}
                    title={isHidden ? "Show" : "Hide"}
                  >
                    <i className={`fa-solid ${isHidden ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
