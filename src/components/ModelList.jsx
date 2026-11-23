import { asset } from "../config";
import { useThumbs } from "../lib/thumbs";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "part", label: "Parts" },
  { id: "assembly", label: "Assemblies" },
];

/** Search box, filter chips and the scrolling list of models (a 2-column grid on phones). */
export default function ModelList({
  models,
  total,
  counts,
  activeId,
  onSelect,
  query,
  onQuery,
  filter,
  onFilter,
}) {
  const thumbs = useThumbs();

  return (
    <div className="swv-card swv-browser">
      <div className="swv-search">
        <i className="fa-solid fa-magnifying-glass swv-search-icon" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search parts and assemblies"
          aria-label="Search parts and assemblies"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            className="swv-clear"
            onClick={() => onQuery("")}
            aria-label="Clear search"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      <div className="swv-chips" role="group" aria-label="Filter by type">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`swv-chip${filter === f.id ? " active" : ""}`}
            onClick={() => onFilter(f.id)}
            aria-pressed={filter === f.id}
            disabled={f.id !== "all" && counts[f.id] === 0}
          >
            {f.label} <span>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {models.length > 0 ? (
        <ul className="swv-list">
          {models.map((m) => {
            const active = m.id === activeId;
            const preview = m.thumb ? asset(m.thumb) : thumbs[m.id];
            const isAssembly = m.kind === "assembly";
            return (
              <li key={m.id}>
                <button
                  type="button"
                  className={`swv-item${active ? " active" : ""}`}
                  onClick={() => onSelect(m.id)}
                  aria-pressed={active}
                >
                  <span className="swv-thumb">
                    {preview ? (
                      <img src={preview} alt="" loading="lazy" />
                    ) : (
                      <i className={m.icon || "fa-solid fa-cube"} aria-hidden="true" />
                    )}
                  </span>
                  <span className="swv-item-text">
                    <span className="swv-item-name">{m.name}</span>
                    <span className="swv-item-sub">
                      {isAssembly ? "Assembly" : (m.tags?.[0] ?? "Part")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="swv-empty">No models match "{query}".</p>
      )}

      <p className="swv-meta">
        Showing {models.length} of {total}
      </p>
    </div>
  );
}
