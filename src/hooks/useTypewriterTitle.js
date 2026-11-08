import { useEffect } from "react";

/** Types and deletes `text` in the browser tab title, forever. */
export function useTypewriterTitle(
  text,
  { typeSpeed = 200, deleteSpeed = 120, holdDelay = 2200, restartDelay = 600 } = {}
) {
  useEffect(() => {
    let index = 0;
    let deleting = false;
    let timer;

    function tick() {
      if (!deleting) {
        index += 1;
        document.title = text.slice(0, index);
        if (index === text.length) {
          deleting = true;
          timer = setTimeout(tick, holdDelay);
          return;
        }
        timer = setTimeout(tick, typeSpeed);
      } else {
        index -= 1;
        // Left-to-right mark keeps the tab from showing the page URL when empty.
        document.title = index === 0 ? "‎" : text.slice(0, index);
        if (index === 0) {
          deleting = false;
          timer = setTimeout(tick, restartDelay);
          return;
        }
        timer = setTimeout(tick, deleteSpeed);
      }
    }

    tick();
    return () => clearTimeout(timer);
  }, [text, typeSpeed, deleteSpeed, holdDelay, restartDelay]);
}
