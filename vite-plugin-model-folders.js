import fs from "node:fs";
import path from "node:path";

/**
 * Lists the STL files inside every sub-folder of public/assets/models/ and
 * exposes them as a module:
 *
 *   import MODEL_FOLDERS from "virtual:model-folders";
 *   MODEL_FOLDERS.arbore  // ["Arbore - 6411-1 6411_01-1.STL", ...]
 *
 * Drop new STL files into a folder and the list updates (the dev server
 * reloads by itself; a build picks them up automatically).
 */
const ID = "virtual:model-folders";
const RESOLVED = "\0" + ID;

export default function modelFolders({ dir = "public/assets/models" } = {}) {
  let root = process.cwd();
  const modelsDir = () => path.resolve(root, dir);

  function scan() {
    const out = {};
    if (!fs.existsSync(modelsDir())) return out;
    for (const entry of fs.readdirSync(modelsDir(), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      out[entry.name] = fs
        .readdirSync(path.join(modelsDir(), entry.name))
        .filter((f) => /\.stl$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    return out;
  }

  return {
    name: "model-folders",
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === ID) return RESOLVED;
    },
    load(id) {
      if (id === RESOLVED) return `export default ${JSON.stringify(scan())};`;
    },
    configureServer(server) {
      server.watcher.add(modelsDir());
      const refresh = (file) => {
        if (!path.resolve(file).startsWith(modelsDir())) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    },
  };
}
