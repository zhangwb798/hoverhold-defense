import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';

const canvas = document.createElement('canvas');
canvas.width = 360;
canvas.height = 280;
canvas.setAttribute('aria-hidden', 'true');

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(canvas.width, canvas.height, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-0.56, 0.56, 0.435, -0.435, 0.01, 10);
camera.position.set(1.2, 0.92, 1.36);
camera.lookAt(0, 0.22, 0);

scene.add(new THREE.HemisphereLight(0xf3ead3, 0x29322f, 2.2));
const sun = new THREE.DirectionalLight(0xfff0cb, 3.4);
sun.position.set(-1.8, 2.8, 2.2);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x8ba7a0, 1.2);
rim.position.set(2, 1.2, -2);
scene.add(rim);

const state = window.archerPavilion3D = { canvas, ready: false, failed: false, render: () => {} };
let pavilion = null;

new GLTFLoader().load(
  './assets/tripo-pavilion-v12.glb',
  (gltf) => {
    pavilion = gltf.scene;
    const box = new THREE.Box3().setFromObject(pavilion);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    pavilion.position.sub(center);
    pavilion.position.y += size.y * 0.5 - 0.04;
    pavilion.rotation.y = -0.32;
    pavilion.traverse((node) => {
      if (!node.isMesh) return;
      node.frustumCulled = false;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        material.roughness = 0.94;
        material.metalness = 0;
        material.envMapIntensity = 0.25;
        material.needsUpdate = true;
      });
    });
    scene.add(pavilion);
    state.ready = true;
  },
  undefined,
  () => { state.failed = true; }
);

state.render = (time = performance.now()) => {
  if (!state.ready || !pavilion) return;
  pavilion.rotation.y = -0.32 + Math.sin(time * 0.00055) * 0.018;
  renderer.render(scene, camera);
};
