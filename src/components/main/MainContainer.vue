<template>
  <div class="h-full w-full main">
    <canvas ref="canvas" class="h-full w-full"></canvas>
  </div>
</template>
<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

  const canvas = ref<HTMLCanvasElement | null>(null);
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let gui: GUI | null = null;
  let scene: THREE.Scene | null = null;

  onMounted(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value || undefined });
    controls = new OrbitControls(camera, renderer.domElement);
    gui = new GUI();
  });
</script>
