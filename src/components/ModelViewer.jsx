import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildPlaceholder } from "../lib/placeholderModels";

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

async function loadModel(model) {
  const { source } = model;

  if (source.type === "procedural") {
    const root = buildPlaceholder(source.builder);
    applyLook(root, model.color);
    return root;
  }

  if (source.type === "stl") {
    const response = await fetch(source.url);
    if (!response.ok) {
      throw new Error(`File not found (${response.status}) at ${source.url}`);
    }
    // A missing file makes the dev server answer with the site's own HTML page.
    if ((response.headers.get("content-type") || "").includes("text/html")) {
      throw new Error(`Got a web page instead of an STL: nothing exists at ${source.url}`);
    }
    const geometry = new STLLoader().parse(await response.arrayBuffer());
    // A missing file makes the dev server answer with index.html, which parses to nothing.
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
    const gltf = await new GLTFLoader().loadAsync(source.url);
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

/* ----------------------------- component ----------------------------- */

/**
 * three.js viewer: drag to rotate, scroll/pinch to zoom, right-drag to pan.
 * Plain three.js (no wrapper library) so the only extra dependency is `three`.
 */
export default function ModelViewer({ model, autoRotate, wireframe, resetKey, onStatus }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const optsRef = useRef({ autoRotate, wireframe });
  const statusRef = useRef(onStatus);

  useEffect(() => {
    optsRef.current = { autoRotate, wireframe };
    statusRef.current = onStatus;
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
      current: null,
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

      controls.autoRotate = optsRef.current.autoRotate;
      if (api.intro < 1) {
        api.intro = Math.min(1, api.intro + dt / 0.55);
        const eased = 1 - Math.pow(1 - api.intro, 3);
        holder.scale.setScalar(0.86 + 0.14 * eased);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      api.disposed = true;
      api.token += 1;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
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
    statusRef.current?.({ loading: true, error: null });

    const removeCurrent = () => {
      if (!api.current) return;
      api.holder.remove(api.current);
      disposeObject(api.current);
      api.current = null;
    };

    loadModel(model)
      .then((root) => {
        if (api.disposed || api.token !== token) {
          disposeObject(root); // a newer selection superseded this one
          return;
        }
        removeCurrent();
        const { wrap, floorY } = fit(root);
        api.current = wrap;
        api.holder.add(wrap);
        api.stage.position.y = floorY;
        applyWireframe(wrap, optsRef.current.wireframe);
        api.intro = 0; // replay the small scale-in
        resetCamera(api);
        statusRef.current?.({ loading: false, error: null });
      })
      .catch((err) => {
        if (api.disposed || api.token !== token) return;
        console.error(err);
        removeCurrent();
        statusRef.current?.({
          loading: false,
          error: `Couldn't load "${model.name}": ${err?.message || "unknown error"}`,
        });
      });
  }, [model]);

  useEffect(() => {
    const api = apiRef.current;
    if (api?.current) applyWireframe(api.current, wireframe);
  }, [wireframe]);

  useEffect(() => {
    if (resetKey > 0 && apiRef.current) resetCamera(apiRef.current);
  }, [resetKey]);

  return <div className="sw-canvas" ref={mountRef} />;
}
