<template>
  <div class="text-stage" ref="container">
    <div class="controls" @mousedown.stop>
      <label>
        字号 {{ config.fontSize }}px
        <input type="range" v-model.number="config.fontSize" min="6" max="20" step="1" />
      </label>
      <label>
        间距 ×{{ config.spacing.toFixed(1) }}
        <input type="range" v-model.number="config.spacing" min="1.0" max="2.0" step="0.1" />
      </label>
      <label>
        清晰度 {{ config.pixelsPerUnit }}
        <input type="range" v-model.number="config.pixelsPerUnit" min="30" max="200" step="10" />
      </label>
      <label>
        环密度 {{ config.planesPerRing }}
        <input type="range" v-model.number="config.planesPerRing" min="4" max="24" step="2" />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, reactive, ref, computed, watch } from 'vue';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';
  import { sphereRadiusAtY } from '@/utils/textLayout';

  const container = ref<HTMLDivElement | null>(null);

  const config = reactive({
    fontSize: 8,
    spacing: 1.0,
    pixelsPerUnit: 100,
    planesPerRing: 12,
  });

  const lineHeight = computed(() => (config.fontSize * config.spacing) / config.pixelsPerUnit);

  const SPHERE_RADIUS = 2;
  const DPR = Math.min(window.devicePixelRatio, 2);

  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let animationId: number;
  let textGroup: THREE.Group;

  let ringData: {
    meshes: THREE.Mesh[];
    baseAngles: number[];
    y: number;
    r: number;
    speed: number;
  }[] = [];

  let allSentences: string[] = [];
  let sentencePool: number[] = [];

  function shufflePool() {
    sentencePool = Array.from({ length: allSentences.length }, (_, i) => i);
    for (let i = sentencePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sentencePool[i], sentencePool[j]] = [sentencePool[j], sentencePool[i]];
    }
  }

  async function loadAllSentences() {
    const jsonFile = await import('@/assets/text/poet.json');
    const poems = jsonFile.default as Record<string, string>;
    const result: string[] = [];

    for (const key of Object.keys(poems)) {
      const poem = poems[key].replace(/[\n\r\t]/g, '');
      const sentences = poem
        .split(/(?<=[。！？；])/)
        .map(s => s.trim())
        .filter(s => s.length > 1);
      result.push(...sentences);
    }

    allSentences = result;
    shufflePool();
  }

  const TEXT_QUALITY = 4;

  function buildLineText(maxWidth: number): string {
    const charWidth = config.fontSize * 0.55;
    const neededChars = Math.ceil(maxWidth / charWidth);

    let text = '';
    while (text.length < neededChars * 2) {
      if (sentencePool.length === 0) shufflePool();
      text += allSentences[sentencePool.shift()!];
    }

    const scaledFontSize = config.fontSize * TEXT_QUALITY;
    const canvasWidthPx = maxWidth * config.pixelsPerUnit * TEXT_QUALITY;
    const font = `${scaledFontSize}px sans-serif`;
    const prepared = prepareWithSegments(text, font, { wordBreak: 'keep-all' });
    const line = layoutNextLine(prepared, { segmentIndex: 0, graphemeIndex: 0 }, canvasWidthPx);
    return line ? line.text : text.substring(0, neededChars);
  }

  function createTextCanvas(text: string, width: number): HTMLCanvasElement {
    const canvasW = Math.ceil(width * config.pixelsPerUnit * TEXT_QUALITY);
    const canvasH = Math.ceil(lineHeight.value * config.pixelsPerUnit * TEXT_QUALITY);
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const scaledFontSize = config.fontSize * TEXT_QUALITY;
    ctx.font = `${scaledFontSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, canvasH / 2);
    return canvas;
  }

  function initScene() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(DPR);
    container.value!.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const sphereGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x333333,
      wireframe: false,
      transparent: true,
      opacity: 0.3,
    });
    scene.add(new THREE.Mesh(sphereGeo, sphereMat));
  }

  function disposeTextGroup() {
    if (!textGroup) return;
    textGroup.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.MeshBasicMaterial) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      }
    });
    scene.remove(textGroup);
    ringData = [];
  }

  function createTextPlanes(): THREE.Group {
    const group = new THREE.Group();
    const lh = lineHeight.value;

    ringData = [];

    const maxLines = Math.floor((SPHERE_RADIUS * 2) / lh);

    for (let i = 0; i < maxLines; i++) {
      const y = -SPHERE_RADIUS + (i + 0.5) * lh;
      const r = sphereRadiusAtY(y, SPHERE_RADIUS);
      if (r < 0.1) continue;

      const circumference = 2 * Math.PI * r;
      const planeWidth = (circumference / config.planesPerRing) * 1.05;

      const meshes: THREE.Mesh[] = [];
      const baseAngles: number[] = [];

      for (let j = 0; j < config.planesPerRing; j++) {
        const theta = (j / config.planesPerRing) * Math.PI * 2;

        const text = buildLineText(planeWidth);
        const canvas = createTextCanvas(text, planeWidth);
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geo = new THREE.PlaneGeometry(planeWidth, lh);
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);

        mesh.position.set(r * Math.sin(theta), y, r * Math.cos(theta));
        mesh.rotation.y = theta;

        group.add(mesh);
        meshes.push(mesh);
        baseAngles.push(theta);
      }

      const speed = (Math.random() - 0.5) * 0.01;
      ringData.push({ meshes, baseAngles, y, r, speed });
    }

    return group;
  }

  function rebuildTextGroup() {
    disposeTextGroup();
    textGroup = createTextPlanes();
    scene.add(textGroup);
  }

  let elapsed = 0;

  function animate() {
    animationId = requestAnimationFrame(animate);
    elapsed += 1;

    for (const ring of ringData) {
      const offset = elapsed * ring.speed;
      ring.meshes.forEach((mesh, j) => {
        const newAngle = ring.baseAngles[j] + offset;
        mesh.position.x = ring.r * Math.sin(newAngle);
        mesh.position.z = ring.r * Math.cos(newAngle);
        mesh.rotation.y = newAngle;
      });
    }

    controls.update();
    renderer.render(scene, camera);
  }

  function handleResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function cleanup() {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer && container.value) {
      container.value.removeChild(renderer.domElement);
      renderer.dispose();
    }
  }

  watch(
    () => [config.fontSize, config.spacing, config.pixelsPerUnit, config.planesPerRing],
    () => {
      elapsed = 0;
      rebuildTextGroup();
    }
  );

  onMounted(async () => {
    try {
      await loadAllSentences();
      initScene();
      textGroup = createTextPlanes();
      scene.add(textGroup);
      animate();
      window.addEventListener('resize', handleResize);
    } catch (error) {
      console.error('TextStage 初始化错误:', error);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    cleanup();
  });
</script>

<style scoped>
  .text-stage {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .controls {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    padding: 12px;
    border-radius: 8px;
    gap: 6px;
    z-index: 10;
    color: #fff;
    font-size: 12px;
    height: 20% !important;
  }

  .controls label {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .controls input[type='range'] {
    width: 120px;
    cursor: pointer;
  }
</style>
