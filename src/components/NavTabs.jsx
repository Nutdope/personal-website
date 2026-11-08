import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const TABS = [
  { to: "/", label: "Bio", icon: "fa-solid fa-user", end: true },
  { to: "/portfolio", label: "Portfolio", icon: "fa-solid fa-layer-group" },
];

/** Bottom-center pill nav with a sliding active highlight. */
export default function NavTabs() {
  return (
    <nav className="nav-tabs" aria-label="Primary">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="nav-tab-label">
                <i className={tab.icon} />
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
