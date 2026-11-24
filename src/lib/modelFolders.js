import MODEL_FOLDERS from "virtual:model-folders";
import { asset } from "../config";

/**
 * Turns a SolidWorks STL export name into a readable part name:
 *   "Arbore - 6411-1 6411_01-1.STL"  ->  "6411-1 6411 01"
 * It drops the "<Assembly> - " prefix, the "-<instance>" suffix and underscores.
 */
function cleanName(file) {
  let name = file.replace(/\.stl$/i, "");
  const dash = name.indexOf(" - ");
  if (dash !== -1) name = name.slice(dash + 3);
  return name.replace(/-\d+$/, "").replace(/_/g, " ").trim();
}

/** Instance number from the end of the file name ("..._spinner-2.STL" -> "2"). */
function instanceOf(file) {
  return file.replace(/\.stl$/i, "").match(/-(\d+)$/)?.[1];
}

/**
 * Builds the parts list for { type: "stl-folder", folder, ... }.
 *
 * Optional fields on the source:
 *   color:   one tint for every part (otherwise each part gets a palette colour)
 *   names:   { "<file name or auto name>": "Nicer name" }
 *   colors:  { "<file name or auto name>": "#hex" }
 *   exclude: ["<file name or auto name>", ...]  files to leave out
 */
export function folderParts(source) {
  const files = MODEL_FOLDERS[source.folder];
  if (!files) {
    throw new Error(`No folder "public/assets/models/${source.folder}/" (folder names are case-sensitive)`);
  }

  const exclude = new Set(source.exclude ?? []);
  const kept = files
    .map((file) => ({ file, auto: cleanName(file) }))
    .filter(({ file, auto }) => !exclude.has(file) && !exclude.has(auto));

  // Parts used more than once (two of the same bearing) get "#<instance>".
  const counts = {};
  kept.forEach(({ auto }) => (counts[auto] = (counts[auto] ?? 0) + 1));

  const base = asset(`assets/models/${source.folder}/`);
  return kept.map(({ file, auto }) => {
    const n = instanceOf(file);
    const name = counts[auto] > 1 && n ? `${auto} #${n}` : auto;
    return {
      file,
      url: base + encodeURIComponent(file),
      name: source.names?.[file] ?? source.names?.[auto] ?? name,
      color: source.colors?.[file] ?? source.colors?.[auto] ?? source.color,
    };
  });
}
