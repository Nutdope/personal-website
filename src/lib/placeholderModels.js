import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Built-in stand-in parts so the viewer works before you have real exports.
 * Each builder returns a THREE.Group of un-textured meshes (the viewer gives
 * them their metal look). Parts are modelled Z-up, like CAD, and wrapped in a
 * group that turns them Y-up for three.js. Every mesh is named, which is what
 * the "Parts" panel shows.
 */

const extrude = (depth, bevel = 0.015) => ({
  depth,
  bevelEnabled: bevel > 0,
  bevelThickness: bevel,
  bevelSize: bevel,
  bevelSegments: 2,
  curveSegments: 48,
});

const circle = (radius, x = 0, y = 0) => {
  const p = new THREE.Path();
  p.absarc(x, y, radius, 0, Math.PI * 2, true);
  return p;
};

const disk = (radius) => {
  const s = new THREE.Shape();
  s.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return s;
};

const rect = (x0, y0, x1, y1) => {
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  s.lineTo(x1, y0);
  s.lineTo(x1, y1);
  s.lineTo(x0, y1);
  s.closePath();
  return s;
};

function mesh(shape, depth, zOffset = 0, name = "") {
  const geometry = new THREE.ExtrudeGeometry(shape, extrude(depth));
  geometry.translate(0, 0, zOffset);
  const m = new THREE.Mesh(geometry);
  m.name = name;
  return m;
}

function toYUp(group) {
  const outer = new THREE.Group();
  group.rotation.x = -Math.PI / 2;
  outer.add(group);
  return outer;
}

function spurGear() {
  const teeth = 18;
  const rOut = 1;
  const rRoot = 0.84;
  const step = (Math.PI * 2) / teeth;

  const body = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const profile = [
      [rRoot, a],
      [rOut, a + step * 0.18],
      [rOut, a + step * 0.42],
      [rRoot, a + step * 0.6],
    ];
    profile.forEach(([r, ang], j) => {
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0 && j === 0) body.moveTo(x, y);
      else body.lineTo(x, y);
    });
  }
  body.closePath();
  body.holes.push(circle(0.22)); // bore
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    body.holes.push(circle(0.11, Math.cos(a) * 0.52, Math.sin(a) * 0.52)); // lightening holes
  }

  const hub = new THREE.Shape();
  hub.absarc(0, 0, 0.36, 0, Math.PI * 2, false);
  hub.holes.push(circle(0.22));

  const g = new THREE.Group();
  g.add(mesh(body, 0.28, -0.14, "Gear body"));
  g.add(mesh(hub, 0.5, -0.25, "Hub"));
  return toYUp(g);
}

function flange() {
  const plate = new THREE.Shape();
  plate.absarc(0, 0, 1, 0, Math.PI * 2, false);
  plate.holes.push(circle(0.38)); // bore
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    plate.holes.push(circle(0.09, Math.cos(a) * 0.72, Math.sin(a) * 0.72)); // bolt holes
  }

  const neck = new THREE.Shape();
  neck.absarc(0, 0, 0.56, 0, Math.PI * 2, false);
  neck.holes.push(circle(0.38));

  const g = new THREE.Group();
  g.add(mesh(plate, 0.16, -0.08, "Flange plate"));
  g.add(mesh(neck, 0.5, 0, "Neck"));
  return toYUp(g);
}

/** One bolt = shaft + head merged into a single named mesh. */
function bolt(x, y, name) {
  const shaft = new THREE.ExtrudeGeometry(disk(0.1), extrude(0.5, 0.01));
  shaft.translate(0, 0, -0.2);
  const head = new THREE.ExtrudeGeometry(disk(0.19), extrude(0.08, 0.01));
  head.translate(0, 0, 0.2);

  const merged = mergeGeometries([shaft, head]);
  const m = new THREE.Mesh(merged ?? shaft);
  m.position.set(x, y, 0);
  m.name = name;
  return m;
}

/** A small assembly: base plate + upright plate + four bolts. Good for trying the parts panel. */
function angleBracket() {
  const boltSpots = [
    [-0.7, 0.3],
    [0.7, 0.3],
    [-0.7, 0.7],
    [0.7, 0.7],
  ];

  // Base plate with four mounting holes
  const base = rect(-1, 0, 1, 1.2);
  boltSpots.forEach(([x, y]) => base.holes.push(circle(0.12, x, y)));

  // Upright plate with two holes, stood up along the back edge of the base
  const wallShape = rect(-1, 0, 1, 1.2);
  [-0.5, 0.5].forEach((x) => wallShape.holes.push(circle(0.14, x, 0.7)));
  const wall = mesh(wallShape, 0.2, 0, "Upright plate");
  wall.rotation.x = Math.PI / 2;
  wall.position.y = 1.2;

  const g = new THREE.Group();
  g.add(mesh(base, 0.2, 0, "Base plate"));
  g.add(wall);
  boltSpots.forEach(([x, y], i) => g.add(bolt(x, y, `Bolt ${i + 1}`)));
  return toYUp(g);
}

const BUILDERS = {
  gear: spurGear,
  flange,
  bracket: angleBracket,
};

export function buildPlaceholder(name) {
  const build = BUILDERS[name];
  if (!build) throw new Error(`Unknown placeholder part "${name}"`);
  return build();
}
