<template>
  <canvas ref="canvasRef"></canvas>
</template>
<script setup lang="ts">
import * as THREE from 'three';
import { onMounted, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.ts';
import { Terrarin } from './entities/Terrarin';
import { OrbitControls } from 'three-stdlib';
const themeStore = useThemeStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

interface GLObject{
  scene: THREE.Scene;
  lightManager: THREE.Group;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
}

defineOptions({
  name: 'TerrainStage'
})
function setupStage() {
  return new Promise(async (resolve) => {
    const scene = new THREE.Scene();
    const stage = new THREE.Group();
    scene.add(stage);
    const resolution = [window.innerWidth, window.innerHeight];
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5,5,5);
    camera.lookAt(0,0,0);
    scene.add(camera);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value as HTMLCanvasElement,
      antialias: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    const terrain = new Terrarin(10, 10, resolution);
    const terrainMesh = terrain.getGridMesh();

    terrainMesh.rotation.x = -Math.PI / 2;

    stage.add(terrainMesh);

    const GLObj : GLObject = {
      scene,
      lightManager: new THREE.Group(),
      controls: new OrbitControls(camera, canvasRef.value as HTMLCanvasElement),
      renderer,
      camera,
    }
    resolve(GLObj)
  })
}

function startUpStage(gl:GLObject) {
  const { scene, camera, renderer } = gl;
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
}

onMounted(() => {
  if(canvasRef.value){
    setupStage().then((gl) =>{
      startUpStage(gl)
    })
  }
})

</script>
