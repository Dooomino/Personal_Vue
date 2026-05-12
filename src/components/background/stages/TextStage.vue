<template>
  <div class="text-stage" ref="container">
    <!-- <div class="controls" @mousedown.stop>
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
    </div> -->
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, reactive, ref, computed, watch } from 'vue';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { sphereRadiusAtY } from '@/utils/textLayout';

  const container = ref<HTMLDivElement | null>(null);

  const config = reactive({
    fontSize: 8,
    spacing: 1.0,
    pixelsPerUnit: 100,
  });

  const lineHeight = computed(() => (config.fontSize * config.spacing) / config.pixelsPerUnit);

  const SPHERE_RADIUS = 2;
  const DPR = Math.min(window.devicePixelRatio, 2);
  const TEXT_QUALITY = 4;

  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let animationId: number;
  let textGroup: THREE.Group;

  let ringData: { texture: THREE.CanvasTexture; speed: number }[] = [];

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

  function buildLineText(circumference: number): string {
    const scaledFontSize = config.fontSize * TEXT_QUALITY;
    const charWidthPx = scaledFontSize;
    const canvasWidthPx = circumference * config.pixelsPerUnit * TEXT_QUALITY;
    const neededChars = Math.ceil(canvasWidthPx / charWidthPx) + 5;

    let text = '';
    while (text.length < neededChars) {
      if (sentencePool.length === 0) shufflePool();
      text += allSentences[sentencePool.shift()!];
    }

    return text;
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
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.renderOrder = 0;
    scene.add(sphereMesh);
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

      // 计算该纬度带的 theta 范围（球面坐标）
      const yTop = Math.min(y + lh / 2, SPHERE_RADIUS - 0.001);
      const yBot = Math.max(y - lh / 2, -SPHERE_RADIUS + 0.001);
      const thetaTop = Math.acos(yTop / SPHERE_RADIUS);
      const thetaBot = Math.acos(yBot / SPHERE_RADIUS);
      const thetaLength = Math.max(thetaBot - thetaTop, 0.001);

      // 创建球面弧形切片（完整360°环绕，文字真正贴合球面）
      const geo = new THREE.SphereGeometry(
        SPHERE_RADIUS + 0.005,
        64,
        1,
        0,
        Math.PI * 2,
        thetaTop,
        thetaLength
      );

      // 生成填充该环周长的文字
      const text = buildLineText(circumference);
      const canvas = createTextCanvas(text, circumference);
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 1;
      group.add(mesh);

      const speed = (Math.random() - 0.5) * 0.0003;
      ringData.push({ texture, speed });
    }

    return group;
  }

  function rebuildTextGroup() {
    disposeTextGroup();
    textGroup = createTextPlanes();
    scene.add(textGroup);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    for (const ring of ringData) {
      ring.texture.offset.x += ring.speed;
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
    () => [config.fontSize, config.spacing, config.pixelsPerUnit],
    () => rebuildTextGroup()
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
