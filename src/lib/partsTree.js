import * as THREE from "three";

/**
 * Helpers for assemblies: find a model's parts, hide/highlight them, and
 * "explode" them apart. A model with a single solid has no parts tree.
 */

const isHelper = (o) => o.isLine || o.isLineSegments; // the edge lines the viewer adds
const realChildren = (o) => o.children.filter((c) => !isHelper(c));

function countMeshes(obj) {
  let n = 0;
  obj.traverse((o) => {
    if (o.isMesh) n += 1;
  });
  return n;
}

/** Skips single-child wrapper nodes ("Scene > Root > Assembly") to reach the real parts. */
function findAssemblyNode(root) {
  let node = root;
  for (let i = 0; i < 12; i++) {
    const kids = realChildren(node);
    if (kids.length === 1 && !kids[0].isMesh) node = kids[0];
    else break;
  }
  return node;
}

/**
 * -> null for a single solid, otherwise
 *    { items: [{ id, name, depth, parent, meshes }], byId, topParts, assemblyNode }
 * `items` is a flat, depth-first list (what the UI shows); `byId` maps to objects.
 */
export function buildPartsTree(root, maxDepth = 3) {
  const assemblyNode = findAssemblyNode(root);
  const topParts = realChildren(assemblyNode);
  if (topParts.length < 2) return null;

  const items = [];
  const byId = new Map();
  let counter = 0;

  const walk = (obj, depth, parent) => {
    counter += 1;
    const id = `p${counter}`;
    const raw = (obj.name || "").replace(/_/g, " ").trim();
    items.push({
      id,
      name: raw || (obj.isMesh ? `Body ${counter}` : `Part ${counter}`),
      depth,
      parent,
      meshes: countMeshes(obj),
    });
    byId.set(id, obj);
    if (depth + 1 < maxDepth) realChildren(obj).forEach((c) => walk(c, depth + 1, id));
  };
  topParts.forEach((p) => walk(p, 0, null));

  return { items, byId, topParts, assemblyNode };
}

/** Hides every part whose id is in `hidden` (a Set). */
export function setHiddenParts(tree, hidden) {
  if (!tree) return;
  for (const [id, obj] of tree.byId) obj.visible = !hidden.has(id);
}

/* ------------------------------ highlight ------------------------------ */

const GLOW = new THREE.Color(0xa855f7);

/** Glows one part. Materials are cloned so parts that share a material don't light up together. */
export function setHighlight(obj, on) {
  obj.traverse((m) => {
    if (!m.isMesh) return;

    if (on) {
      if (m.userData.baseMaterial) return;
      const tint = (mat) => {
        const copy = mat.clone();
        if (copy.emissive) {
          copy.emissive.copy(GLOW);
          copy.emissiveIntensity = 0.55;
        }
        return copy;
      };
      m.userData.baseMaterial = m.material;
      m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material);
      return;
    }

    const base = m.userData.baseMaterial;
    if (!base) return;
    const current = Array.isArray(m.material) ? m.material : [m.material];
    const originals = Array.isArray(base) ? base : [base];
    current.forEach((c, i) => {
      if (originals[i]) originals[i].wireframe = c.wireframe; // keep the wireframe toggle in sync
      c.dispose();
    });
    m.material = base;
    delete m.userData.baseMaterial;
  });
}

/* ------------------------------- explode ------------------------------- */

/**
 * Works out, for each top-level part, which way it should slide (away from the
 * assembly's center). Call once after the model is placed, before any animation.
 */
export function prepareExplode(parts, assemblyNode) {
  assemblyNode.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(assemblyNode);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const reach = Math.max(size.x, size.y, size.z) * 0.7;

  const entries = parts.map((object, i) => {
    const dir = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3()).sub(center);
    // Parts centered on the same spot would never separate, so nudge them apart.
    if (dir.lengthSq() < 1e-8) dir.set(Math.sin(i * 2.4), 1, Math.cos(i * 2.4));
    dir.normalize();

    const world = object.getWorldPosition(new THREE.Vector3());
    const from = object.parent.worldToLocal(world.clone());
    const to = object.parent.worldToLocal(world.clone().add(dir));
    return { object, base: object.position.clone(), step: to.sub(from) };
  });

  return { entries, reach };
}

/** amount: 0 = assembled, 1 = fully exploded. */
export function applyExplode(data, amount) {
  for (const { object, base, step } of data.entries) {
    object.position.copy(base).addScaledVector(step, amount * data.reach);
  }
}
