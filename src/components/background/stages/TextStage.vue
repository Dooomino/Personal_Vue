<template>
  <div class="text-stage">
    <!-- Three.js 渲染容器 -->
    <div ref="container" class="canvas-container"></div>
  </div>
</template>
<script setup lang="ts">
  import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';
  import * as THREE from 'three';
  import { onMounted, onUnmounted, ref } from 'vue';

  const container = ref<HTMLDivElement | null>(null);
  const baseScrollSpeed = 2.5;

  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let animationId: number;

  interface TextPlaneData {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    texture: THREE.CanvasTexture;
    textContent: string;
    scrollPosition: number;
    speed: number;
    opacity: number;
    fadeState: 'fadeIn' | 'visible' | 'fadeOut';
  }
  let textPlanes: TextPlaneData[] = [];
  let totalPlaneCount = 0;

  let offscreenCanvas: HTMLCanvasElement;
  let offscreenCtx: CanvasRenderingContext2D | null;

  const font = '14px sans-serif';
  const lineHeight = 16;
  const dpr = Math.min(window.devicePixelRatio, 2);

  let allSentences: string[] = [];
  // 全局洗牌池：保证每次调用拿到不同的句子
  let sentencePool: number[] = [];

  function shufflePool() {
    const total = allSentences.length;
    sentencePool = Array.from({ length: total }, (_, i) => i);
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sentencePool[i], sentencePool[j]] = [sentencePool[j], sentencePool[i]];
    }
  }

  /**
   * 加载所有诗句并展平为句子数组（只执行一次）
   */
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
    console.log(`已加载 ${allSentences.length} 条诗句`);
  }

  /**
   * 根据屏幕宽度计算一行能容纳多少句
   */
  function calculateSentencesPerLine(): number {
    if (!offscreenCtx) initOffscreenCanvas();
    offscreenCtx!.font = font;
    const avgCharWidth = offscreenCtx!.measureText('国').width;
    const avgSentenceLen = 8;
    const screenWidth = window.innerWidth;
    return Math.ceil(screenWidth / (avgCharWidth * avgSentenceLen));
  }

  function getRandomSentences(count: number): string {
    if (sentencePool.length < count) shufflePool();
    const picked = sentencePool.splice(0, count);
    if (sentencePool.length < count) shufflePool();
    return picked.map(i => allSentences[i]).join('');
  }

  function initOffscreenCanvas() {
    offscreenCanvas = document.createElement('canvas');
    offscreenCtx = offscreenCanvas.getContext('2d');
  }

  /**
   * 创建单行长横线 Canvas 纹理（DPR 高清渲染）
   */
  function createTextTexture(textContent: string): { texture: THREE.CanvasTexture; width: number; height: number } {
    if (!offscreenCtx) initOffscreenCanvas();

    // pretext 测量整行宽度（whiteSpace: pre 防止换行）
    const prepared = prepareWithSegments(textContent, font, { whiteSpace: 'pre' });
    const layout = layoutWithLines(prepared, Infinity, lineHeight);
    const lineWidth = layout.lines.length > 0 ? layout.lines[0].width : 0;

    const logicalWidth = lineWidth;
    const logicalHeight = lineHeight;

    offscreenCanvas.width = logicalWidth * dpr;
    offscreenCanvas.height = logicalHeight * dpr;

    offscreenCtx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    offscreenCtx!.clearRect(0, 0, logicalWidth, logicalHeight);

    offscreenCtx!.font = font;
    offscreenCtx!.fillStyle = '#ffffff';
    offscreenCtx!.textBaseline = 'top';

    // 单行绘制
    offscreenCtx!.fillText(textContent, 0, 0);

    const texture = new THREE.CanvasTexture(offscreenCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    return { texture, width: logicalWidth, height: logicalHeight };
  }

  function initThreeJS() {
    if (!container.value) return;

    scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(dpr);
    container.value.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
  }

  async function createSingleTextPlane(index: number, totalPlanes: number): Promise<TextPlaneData> {
    const planeScale = 0.01;
    const screenHeight = window.innerHeight * planeScale;
    const spacing = screenHeight / (totalPlanes + 1);

    const sentencesPerLine = calculateSentencesPerLine();
    const textContent = getRandomSentences(sentencesPerLine);

    const { texture, width, height } = createTextTexture(textContent);

    const geometry = new THREE.PlaneGeometry(width * planeScale, height * planeScale);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const screenWidth = window.innerWidth * planeScale;
    const scrollPosition = screenWidth + (width * planeScale) / 2;
    mesh.position.x = scrollPosition;

    const yPosition = -screenHeight / 2 + spacing * (index + 1);
    mesh.position.y = yPosition;

    scene.add(mesh);

    const speed = baseScrollSpeed + (Math.random() - 0.5) * 0.5;

    return {
      mesh,
      material,
      texture,
      textContent,
      scrollPosition,
      speed,
      opacity: 0,
      fadeState: 'fadeIn',
    };
  }

  function calculatePlaneCount(): number {
    const minSpacing = lineHeight * 2; // 每个平面至少需要 2 行高度的间距
    return Math.floor(window.innerHeight / minSpacing);
  }

  async function initTextPlanes() {
    totalPlaneCount = calculatePlaneCount();

    const planes: TextPlaneData[] = [];
    for (let i = 0; i < totalPlaneCount; i++) {
      planes.push(await createSingleTextPlane(i, totalPlaneCount));
    }

    const scale = 0.01;
    const screenWidth = window.innerWidth * scale;
    const basePosition = screenWidth + 5;

    planes.forEach((planeData, index) => {
      planeData.scrollPosition = basePosition;
      planeData.mesh.position.x = basePosition;

      const screenHeight = window.innerHeight * scale;
      const spacing = screenHeight / (totalPlaneCount + 1);
      planeData.mesh.position.y = -screenHeight / 2 + spacing * (index + 1);

      textPlanes.push(planeData);
    });

    console.log(`已创建 ${totalPlaneCount} 个文字平面`);
  }

  async function replaceTextPlane(index: number) {
    const oldPlane = textPlanes[index];

    scene.remove(oldPlane.mesh);
    oldPlane.mesh.geometry.dispose();
    oldPlane.material.dispose();
    oldPlane.texture.dispose();

    const newPlane = await createSingleTextPlane(index, totalPlaneCount);

    const scale = 0.01;
    const screenWidth = window.innerWidth * scale;
    newPlane.scrollPosition = screenWidth + 5;
    newPlane.mesh.position.x = newPlane.scrollPosition;
    newPlane.mesh.position.y = oldPlane.mesh.position.y;

    textPlanes[index] = newPlane;
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    const scale = 0.01;
    const screenWidth = window.innerWidth * scale;

    textPlanes.forEach((planeData, index) => {
      planeData.scrollPosition -= planeData.speed * 0.01;
      planeData.mesh.position.x = planeData.scrollPosition;

      const textWidth = (planeData.mesh.geometry as THREE.PlaneGeometry).parameters.width;
      const enterProgress = 1 - Math.max(0, Math.min(1, (planeData.scrollPosition - (screenWidth - textWidth)) / 100));
      const exitProgress = Math.max(0, Math.min(1, (-screenWidth - planeData.scrollPosition) / 100));

      if (enterProgress > 0 && enterProgress < 1) {
        planeData.opacity = enterProgress;
        planeData.fadeState = 'fadeIn';
      } else if (exitProgress > 0 && exitProgress < 1) {
        planeData.opacity = 1 - exitProgress;
        planeData.fadeState = 'fadeOut';
      } else {
        planeData.opacity = 1;
        planeData.fadeState = 'visible';
      }

      planeData.material.opacity = planeData.opacity;

      if (planeData.scrollPosition < -screenWidth - textWidth / 2) {
        replaceTextPlane(index);
      }
    });

    renderer.render(scene, camera);
  }

  function handleResize() {
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (renderer && container.value) {
      container.value.removeChild(renderer.domElement);
      renderer.dispose();
    }

    textPlanes.forEach(planeData => {
      planeData.mesh.geometry.dispose();
      planeData.material.dispose();
      planeData.texture.dispose();
      scene.remove(planeData.mesh);
    });
    textPlanes = [];
  }

  onMounted(async () => {
    try {
      await loadAllSentences();
      initThreeJS();
      initOffscreenCanvas();
      await initTextPlanes();
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

.canvas-container {
  width: 100%;
  height: 100%;
}
</style>
