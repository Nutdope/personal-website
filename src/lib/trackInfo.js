import { useEffect, useState } from "react";
import { TRACK_INFO } from "../data/tracks";

/**
 * Works out the title and artist to show for a song URL. Priority:
 *   1. TRACK_INFO overrides (src/data/tracks.js)
 *   2. The tags stored inside the MP3 (ID3)
 *   3. The file name: "Artist - Title.mp3"
 */

const AUDIO_EXT = /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)$/i;
const BUNDLER_HASH = /-[A-Za-z0-9_-]{8}$/;

/* ------------------------------ file names ------------------------------ */

function fileParts(url) {
  const path = String(url || "").split(/[?#]/)[0];
  let raw = path.split("/").pop() || "";
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // keep the undecoded name
  }
  const base = raw.replace(AUDIO_EXT, "");
  // Vite renames bundled files to "name-AbC123dE.mp3" directly inside /assets/.
  const hashed = /\/assets\/[^/]+$/.test(path) && BUNDLER_HASH.test(base);
  return { raw, base, cleanBase: hashed ? base.replace(BUNDLER_HASH, "") : base };
}

function fromFilename(url) {
  let name = fileParts(url).cleanBase.trim();
  if (!name) return { title: "", artist: "" };

  if (!/\s/.test(name)) name = name.replace(/_/g, " "); // night_drive -> night drive
  name = name.replace(/^\d{1,3}\s*[.\-–]\s*/, ""); // "01 - " or "01. " track numbers

  const match = name.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (match) return { artist: match[1].trim(), title: match[2].trim() };
  return { title: name, artist: "" };
}

function fromOverrides(url) {
  const { raw, cleanBase } = fileParts(url);
  const norm = (s) => s.replace(AUDIO_EXT, "").toLowerCase();
  const candidates = [norm(raw), cleanBase.toLowerCase()];
  for (const [key, value] of Object.entries(TRACK_INFO)) {
    if (candidates.includes(norm(key))) return value || {};
  }
  return {};
}

/* ------------------------------- MP3 tags ------------------------------- */

const syncsafe = (b, o) =>
  ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);
const u32 = (b, o) => b[o] * 2 ** 24 + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];

function decodeText(data) {
  if (!data.length) return "";
  const encoding = data[0];
  let body = data.subarray(1);
  let label = "iso-8859-1";

  if (encoding === 1) {
    if (body[0] === 0xff && body[1] === 0xfe) {
      label = "utf-16le";
      body = body.subarray(2);
    } else if (body[0] === 0xfe && body[1] === 0xff) {
      label = "utf-16be";
      body = body.subarray(2);
    } else {
      label = "utf-16le";
    }
  } else if (encoding === 2) {
    label = "utf-16be";
  } else if (encoding === 3) {
    label = "utf-8";
  }

  try {
    return new TextDecoder(label)
      .decode(body)
      .split("\0")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
  } catch {
    return "";
  }
}

function parseId3(b) {
  if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return null; // "ID3"
  const version = b[3]; // 2, 3 or 4
  if (version < 2 || version > 4) return null;

  const end = Math.min(b.length, 10 + syncsafe(b, 6));
  let pos = 10;
  if (version >= 3 && b[5] & 0x40) pos += version === 4 ? syncsafe(b, 10) : u32(b, 10) + 4; // extended header

  const idLength = version === 2 ? 3 : 4;
  const headerLength = version === 2 ? 6 : 10;
  const titleId = version === 2 ? "TT2" : "TIT2";
  const artistId = version === 2 ? "TP1" : "TPE1";
  const out = {};

  while (pos + headerLength <= end) {
    const id = String.fromCharCode(...b.subarray(pos, pos + idLength));
    if (!/^[A-Z0-9]+$/.test(id)) break; // padding

    let size;
    if (version === 2) size = (b[pos + 3] << 16) | (b[pos + 4] << 8) | b[pos + 5];
    else if (version === 4) size = syncsafe(b, pos + 4);
    else size = u32(b, pos + 4);

    const start = pos + headerLength;
    if (size <= 0 || start + size > b.length) break; // e.g. a big cover image we didn't download

    if (id === titleId || id === artistId) {
      const text = decodeText(b.subarray(start, start + size));
      if (text) out[id === titleId ? "title" : "artist"] = text;
    }
    if (out.title && out.artist) break;
    pos = start + size;
  }

  return out.title || out.artist ? out : null;
}

/** Downloads only the start of the file (where the tags live) and parses it. */
async function readId3(url, signal) {
  const MAX = 1024 * 1024;
  const response = await fetch(url, { signal, headers: { Range: `bytes=0-${MAX - 1}` } });
  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  let bytes = new Uint8Array(0);
  let want = 10;
  try {
    while (bytes.length < want) {
      const { done, value } = await reader.read();
      if (done) break;
      const merged = new Uint8Array(bytes.length + value.length);
      merged.set(bytes);
      merged.set(value, bytes.length);
      bytes = merged;

      if (want === 10 && bytes.length >= 10) {
        if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null;
        want = Math.min(10 + syncsafe(bytes, 6), MAX);
      }
    }
  } finally {
    reader.cancel().catch(() => {}); // stop downloading the rest of the song
  }
  return parseId3(bytes);
}

/* --------------------------------- hook --------------------------------- */

const id3Cache = new Map();

/** -> { title, artist } for a song URL (updates once the MP3 tags have been read). */
export function useTrackInfo(url) {
  const [info, setInfo] = useState(() => ({ ...fromFilename(url), ...fromOverrides(url) }));

  useEffect(() => {
    const base = fromFilename(url);
    const forced = fromOverrides(url);
    setInfo({ ...base, ...forced });

    const isMp3 = /\.mp3$/i.test(fileParts(url).raw);
    if (!url || !isMp3 || (forced.title && forced.artist)) return undefined;

    const apply = (tags) => setInfo({ ...base, ...tags, ...forced });
    if (id3Cache.has(url)) {
      const cached = id3Cache.get(url);
      if (cached) apply(cached);
      return undefined;
    }

    const controller = new AbortController();
    readId3(url, controller.signal)
      .then((tags) => {
        id3Cache.set(url, tags);
        if (tags) apply(tags);
      })
      .catch(() => {}); // aborted or unreadable: the file-name version stays
    return () => controller.abort();
  }, [url]);

  return info;
}
