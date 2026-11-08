import { useEffect, useState } from "react";

const LANYARD_URL = "https://api.lanyard.rest/v1/users/";

/**
 * Polls the Lanyard REST API for a Discord user's presence.
 * Returns { data, error, loading } where `data` is Lanyard's raw `data` object.
 *
 * Polling pauses while the tab is hidden and the in-flight request is aborted
 * on unmount.
 */
export function useLanyard(userId, intervalMs = 10000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      if (document.hidden) return;
      try {
        const res = await fetch(`${LANYARD_URL}${userId}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success && json.data) {
          setData(json.data);
          setError(null);
        } else {
          setError(new Error("Lanyard returned no data for this user"));
        }
      } catch (err) {
        if (err.name === "AbortError" || cancelled) return;
        console.error("Lanyard error:", err);
        setError(err);
      }
    }

    load();
    const id = setInterval(load, intervalMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [userId, intervalMs]);

  return { data, error, loading: !data && !error };
}
