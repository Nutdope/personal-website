import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { buildPlaceholder } from "../lib/placeholderModels";
import {
  applyExplode,
  buildPartsTree,
  prepareExplode,
  setHiddenParts,
  setHighlight,
} from "../lib/partsTree";
import { saveThumb } from "../lib/thumbs";

const HOME = { position: [3.4, 2.2, 4.4], target: [0, 0, 0] };
const FIT_SIZE = 2.4; // every model is scaled so its largest side is this big
const MAX_EDGE_VERTS = 400000; // skip crisp edge lines on very heavy meshes

/* ------------------------------ helpers ------------------------------ */

function disposeObject(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      for (const key in m) {
        if (m[key]?.isTexture) m[key].dispose();
      }
      m.dispose();
    }
  });
}

/** Metal material + thin dark edge lines (gives the "CAD" look). */
function applyLook(root, color) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.32 });
    const position = o.geometry.attributes.position;
    if (position && position.count < MAX_EDGE_VERTS) {
      o.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(o.geometry, 35),
          new THREE.LineBasicMaterial({ color: 0x1a1030, transparent: true, opacity: 0.55 })
        )
      );
    }
  });
}

function applyWireframe(root, on) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) if (m) m.wireframe = on;
  });
}

function setRotation(root, degrees) {
  if (!degrees) return;
  root.rotation.set(...degrees.map((d) => THREE.MathUtils.degToRad(d)));
}

/** Downloads a file, reporting progress (0-1) when the server says how big it is. */
async function fetchBuffer(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`File not found (${response.status}) at ${url}`);
  // A missing file makes the dev server answer with the site's own HTML page.
  if ((response.headers.get("content-type") || "").includes("text/html")) {
    throw new Error(`Got a web page instead of a model file: nothing exists at ${url}`);
  }

  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body || !total) {
    const buffer = await response.arrayBuffer();
    onProgress?.(1);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(Math.min(1, received / total));
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out.buffer;
}

async function loadModel(model, onProgress) {
  const { source } = model;

  if (source.type === "procedural") {
    const root = buildPlaceholder(source.builder);
    applyLook(root, model.color);
    onProgress?.(1);
    return root;
  }

  if (source.type === "stl") {
    const buffer = await fetchBuffer(source.url, onProgress);
    const geometry = new STLLoader().parse(buffer);
    if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
      throw new Error("STL file is empty or not a valid STL");
    }
    const root = new THREE.Group();
    root.add(new THREE.Mesh(geometry));
    applyLook(root, model.color);
    setRotation(root, model.rotation);
    return root;
  }

  if (source.type === "glb") {
    const buffer = await fetchBuffer(source.url, onProgress);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder); // lets you use gltfpack-compressed files
    const gltf = await loader.parseAsync(buffer, "");
    setRotation(gltf.scene, model.rotation);
    return gltf.scene;
  }

  throw new Error(`Unknown model type "${source.type}"`);
}

/** Centers the model at the origin and scales it to FIT_SIZE. */
function fit(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = FIT_SIZE / (Math.max(size.x, size.y, size.z) || 1);

  root.position.sub(center);
  const wrap = new THREE.Group();
  wrap.add(root);
  wrap.scale.setScalar(scale);

  return { wrap, floorY: -(size.y * scale) / 2 - 0.03 };
}

function resetCamera(api) {
  api.camera.position.set(...HOME.position);
  api.controls.target.set(...HOME.target);
  api.controls.update();
}

/** Glows the part with this id (null clears it). Only one part is lit at a time. */
function highlightPart(api, id) {
  const next = id && api.parts?.byId.has(id) ? id : null;
  if (api.highlightId === next) return;
  if (api.highlightId && api.parts?.byId.has(api.highlightId)) {
    setHighlight(api.parts.byId.get(api.highlightId), false);
  }
  api.highlightId = next;
  if (next) setHighlight(api.parts.byId.get(next), true);
}

/** Small preview picture for the list: the model from the default angle on the page's dark/purple backdrop. */
function captureThumb(api, renderer, scene, id) {
  try {
    const { camera, controls } = api;
    const savedPosition = camera.position.clone();
    const savedTarget = controls.target.clone();

    camera.position.set(...HOME.position);
    controls.target.set(...HOME.target);
    camera.lookAt(controls.target);
    renderer.render(scene, camera); // draw and read in the same frame (no preserveDrawingBuffer needed)

    const W = 192;
    const H = 144;
    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#101016";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.55, 4, W / 2, H * 0.55, W * 0.6);
    glow.addColorStop(0, "rgba(168, 85, 247, 0.35)");
    glow.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Crop the live canvas to a centered 4:3 box.
    const src = renderer.domElement;
    const aspect = W / H;
    let cw = src.width;
    let ch = src.height;
    if (cw / ch > aspect) cw = ch * aspect;
    else ch = cw / aspect;
    ctx.drawImage(src, (src.width - cw) / 2, (src.height - ch) / 2, cw, ch, 0, 0, W, H);

    saveThumb(id, out.toDataURL("image/jpeg", 0.82));

    camera.position.copy(savedPosition);
    controls.target.copy(savedTarget);
  } catch (err) {
    console.warn("Couldn't capture a thumbnail:", err);
  }
}

/* ----------------------------- component ----------------------------- */

/**
 * three.js viewer: drag to rotate, scroll/pinch to zoom, right-drag/two fingers to pan.
 * Plain three.js (no wrapper library) so the only extra dependency is `three`.
 *
 * Everything the page controls is a prop:
 *   explode (0-1), hidden (Set of part ids), highlightId (part id | null)
 * and it reports back through onStatus({ loading, error, progress }) and
 * onParts(list | null) (the model's parts, or null for a single solid).
 */
export default function ModelViewer({
  model,
  autoRotate,
  wireframe,
  resetKey,
  explode,
  hidden,
  highlightId,
  onStatus,
  onParts,
}) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const optsRef = useRef({ autoRotate, wireframe, explode, hidden, highlightId });
  const statusRef = useRef(onStatus);
  const partsRef = useRef(onParts);

  // Declared first so the other effects always see the latest props.
  useEffect(() => {
    optsRef.current = { autoRotate, wireframe, explode, hidden, highlightId };
    statusRef.current = onStatus;
    partsRef.current = onParts;
  });

  // Scene, camera, lights, render loop (created once)
  useEffect(() => {
    const mount = mountRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.error(err);
      statusRef.current?.({ loading: false, error: "WebGL isn't available in this browser." });
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.8;

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 4);
    const rim = new THREE.DirectionalLight(0xa855f7, 2.2); // purple back light
    rim.position.set(-4, 2, -3);
    scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.2));

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 12;
    controls.autoRotateSpeed = 1.4;

    // Holds the model and the glowing floor disc so both scale in together.
    const holder = new THREE.Group();
    const stage = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 64),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.08, depthWrite: false })
    );
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.25, 2.3, 96),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    ring.rotation.x = -Math.PI / 2;
    stage.add(disc, ring);
    holder.add(stage);
    scene.add(holder);

    const api = {
      camera,
      controls,
      holder,
      stage,
      current: null, // the model currently on stage
      parts: null, // buildPartsTree() result, or null for a single solid
      explodeData: null,
      explodeCur: 0,
      highlightId: null,
      thumbFor: null, // model id waiting for its preview snapshot
      token: 0,
      disposed: false,
      intro: 1,
    };
    apiRef.current = api;
    resetCamera(api);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      const opts = optsRef.current;

      controls.autoRotate = opts.autoRotate;

      if (api.intro < 1) {
        api.intro = Math.min(1, api.intro + dt / 0.55);
        const eased = 1 - Math.pow(1 - api.intro, 3);
        holder.scale.setScalar(0.86 + 0.14 * eased);
      }

      // Ease the explode slider toward its target so parts glide instead of jumping.
      if (api.explodeData) {
        const diff = opts.explode - api.explodeCur;
        if (Math.abs(diff) > 0.0005) {
          api.explodeCur += diff * Math.min(1, dt * 9);
          applyExplode(api.explodeData, api.explodeCur);
        } else if (api.explodeCur !== opts.explode) {
          api.explodeCur = opts.explode;
          applyExplode(api.explodeData, api.explodeCur);
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (api.thumbFor && api.intro >= 1 && api.current) {
        const id = api.thumbFor;
        api.thumbFor = null;
        if (!opts.wireframe) captureThumb(api, renderer, scene, id);
      }
    };
    tick();

    return () => {
      api.disposed = true;
      api.token += 1;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      highlightPart(api, null);
      if (api.current) disposeObject(api.current);
      disc.geometry.dispose();
      disc.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      apiRef.current = null;
    };
  }, []);

  // Load (or switch) the model
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    const token = ++api.token;
    statusRef.current?.({ loading: true, error: null, progress: 0 });

    const removeCurrent = () => {
      if (!api.current) return;
      highlightPart(api, null); // put the original materials back before disposing
      api.holder.remove(api.current);
      disposeObject(api.current);
      api.current = null;
      api.parts = null;
      api.explodeData = null;
      api.explodeCur = 0;
      api.thumbFor = null;
    };

    let lastPercent = -1;
    const onProgress = (p) => {
      if (api.disposed || api.token !== token) return;
      const percent = Math.round(p * 100);
      if (percent === lastPercent) return;
      lastPercent = percent;
      statusRef.current?.({ loading: true, error: null, progress: p });
    };

    loadModel(model, onProgress)
      .then((root) => {
        if (api.disposed || api.token !== token) {
          disposeObject(root); // a newer selection superseded this one
          return;
        }
        removeCurrent();

        const { wrap, floorY } = fit(root);
        wrap.updateMatrixWorld(true);
        const tree = buildPartsTree(root);

        api.current = wrap;
        api.parts = tree;
        api.explodeData = tree ? prepareExplode(tree.topParts, tree.assemblyNode) : null;
        api.explodeCur = 0;
        api.holder.add(wrap);
        api.stage.position.y = floorY;

        const opts = optsRef.current;
        applyWireframe(wrap, opts.wireframe);
        setHiddenParts(tree, opts.hidden);
        highlightPart(api, opts.highlightId);

        api.intro = 0; // replay the small scale-in
        api.thumbFor = model.id; // snapshot once the intro has finished
        resetCamera(api);

        partsRef.current?.(tree ? tree.items : null);
        statusRef.current?.({ loading: false, error: null, progress: 1 });
      })
      .catch((err) => {
        if (api.disposed || api.token !== token) return;
        console.error(err);
        removeCurrent();
        partsRef.current?.(null);
        statusRef.current?.({
          loading: false,
          error: `Couldn't load "${model.name}": ${err?.message || "unknown error"}`,
          progress: 0,
        });
      });
  }, [model]);

  useEffect(() => {
    const api = apiRef.current;
    if (api?.current) applyWireframe(api.current, wireframe);
  }, [wireframe]);

  useEffect(() => {
    const api = apiRef.current;
    if (api) setHiddenParts(api.parts, hidden);
  }, [hidden]);

  useEffect(() => {
    const api = apiRef.current;
    if (api) highlightPart(api, highlightId);
  }, [highlightId]);

  useEffect(() => {
    if (resetKey > 0 && apiRef.current) resetCamera(apiRef.current);
  }, [resetKey]);

  return <div className="swv-canvas" ref={mountRef} />;
}
