import { motion } from "framer-motion";
import ProjectCard from "../components/ProjectCard";
import { SITE } from "../config";
import { PROJECTS } from "../data/projects";
import { pageTransition } from "./transitions";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export default function PortfolioView({ profile }) {
  return (
    <motion.section className="view view--portfolio" {...pageTransition}>
      <header className="portfolio-header">
        <div className="avatar-wrapper avatar-wrapper--sm">
          <img
            src={profile?.avatarUrl ?? SITE.fallbackAvatar}
            alt=""
            className="avatar"
          />
        </div>
        <h1 className="portfolio-title">Portfolio</h1>
        <p className="portfolio-subtitle">Things I've built and designed.</p>
      </header>

      <motion.div
        className="project-grid"
        variants={gridVariants}
        initial="hidden"
        animate="show"
      >
        {PROJECTS.map((project, i) => (
          <ProjectCard key={`${project.title}-${i}`} project={project} />
        ))}
      </motion.div>
    </motion.section>
  );
}
