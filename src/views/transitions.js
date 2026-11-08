// Shared enter/exit motion for every routed view (used with AnimatePresence).
export const pageTransition = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
  transition: { duration: 0.28, ease: "easeOut" },
};
