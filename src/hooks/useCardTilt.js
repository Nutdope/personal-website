import { useEffect, useRef } from "react";

/**
 * Attach the returned ref to an element to give it the 3D mouse-follow tilt.
 * Writes to the DOM directly, so mouse movement never triggers a re-render.
 */
export function useCardTilt(maxTilt = 12) {
  const ref = useRef(null);

  useEffect(() => {
    const card = ref.current;
    const canHover = window.matchMedia("(hover: hover)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!card || !canHover || reduceMotion) return undefined;

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const cardX = rect.left + rect.width / 2;
      const cardY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - cardX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - cardY) / (window.innerHeight / 2);

      const rotateX = -deltaY * maxTilt;
      const rotateY = deltaX * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    };

    const onLeave = () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    };

    document.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [maxTilt]);

  return ref;
}
