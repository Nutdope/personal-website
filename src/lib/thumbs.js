import { useSyncExternalStore } from "react";

/**
 * Thumbnails for the model list. The viewer takes a snapshot of each model the
 * first time (and every time) it's opened, and they're remembered in
 * localStorage so the list fills up with previews as you browse.
 * A model can also set a fixed `thumb` image path in solidworks.js.
 */

const KEY = "nutdope:sw-thumbs:v1";
const listeners = new Set();
let cache = null;

function read() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    cache = {};
  }
  return cache;
}

export function saveThumb(id, dataUrl) {
  cache = { ...read(), [id]: dataUrl }; // new object so subscribers see the change
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage full or blocked: previews just live in memory for this visit
  }
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** -> { [modelId]: dataUrl } */
export function useThumbs() {
  return useSyncExternalStore(subscribe, read, read);
}
