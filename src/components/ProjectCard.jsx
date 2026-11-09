import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { asset } from "../config";

export const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function ProjectCard({ project }) {
  const { title, description, tags = [], icon, image, live, repo, to, cta } = project;

  return (
    <motion.article
      className="project-card"
      variants={cardVariants}
      whileHover={{ y: -4 }}
    >
      {/* Stretched link: makes the whole card clickable without nesting anchors. */}
      {to && <Link className="project-card-link" to={to} aria-label={`Open ${title}`} />}

      <div className="project-thumb">
        {image ? (
          <img src={asset(image)} alt="" loading="lazy" />
        ) : (
          <i className={icon || "fa-solid fa-cube"} aria-hidden="true" />
        )}
      </div>

      <div className="project-body">
        <h3 className="project-title">{title}</h3>
        <p className="project-desc">{description}</p>

        {tags.length > 0 && (
          <ul className="project-tags">
            {tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}

        {to && (
          <span className="project-cta">
            {cta || "Open"} <i className="fa-solid fa-arrow-right" />
          </span>
        )}

        {(live || repo) && (
          <div className="project-links">
            {live && (
              <a href={live} target="_blank" rel="noopener noreferrer">
                <i className="fa-solid fa-arrow-up-right-from-square" /> Live
              </a>
            )}
            {repo && (
              <a href={repo} target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-github" /> Code
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
