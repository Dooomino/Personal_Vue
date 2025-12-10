<template>
  <div id='three-canvas'></div>
  <div id='gui'></div>
</template>
<script setup lang="ts">
/* eslint-disable-next-line */
import { onMounted, reactive, ref } from 'vue'
import * as THREE from 'three'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

interface MeshRefValue {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
}

const meshRef = ref<MeshRefValue | null>(null);

// 添加speed变量来存储当前速度
const rotationSpeed = ref(0.01);

onMounted(() => {
  meshRef.value = initStage();
  initPanel();
})

function initStage(){
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,//0xff0000设置材质颜色为红色
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  const width = window.innerWidth; //宽度
  const height = window.innerHeight; //高度

  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
  camera.position.set(200, 200, 200);
  camera.lookAt(mesh.position);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0); //第二个参数设置透明度
  renderer.setSize(width, height);
  renderer.render(scene, camera);

  document.querySelector('#three-canvas')?.appendChild(renderer.domElement);
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  /* eslint-disable-next-line */
  const animate = () => {
    requestAnimationFrame(animate);
    if (meshRef.value && meshRef.value.mesh) {
      meshRef.value.mesh.rotation.y += rotationSpeed.value;
    }
    renderer.render(scene, camera);
  };

  animate();
  return reactive(
    {
      mesh: mesh,
      material: material,
    }
  );
};

function initPanel(){
  /* eslint-disable-next-line */
  const gui = new GUI({title: 'Panel'});
  const obj = {
    color: '#ff0000',
    speed: 2.5,
    isVisible: false
  }
  //添加颜色选择器，默认色值为'#ff0000'
  gui.addColor(obj,'color').onChange((value) => {
    if (meshRef.value) {
      const material = meshRef.value.mesh.material;
      if (Array.isArray(material)) {
        (material[0] as THREE.MeshBasicMaterial).color.set(value);
      } else {
        (material as THREE.MeshBasicMaterial).color.set(value);
      }
    }
  });
  //添加一个数值滑块,取值范围为 0 到 10,步长为 0.2,默认值为2.5
  gui.add(obj,'speed',0,10,0.2).onChange((value) => {
    // 将0-10的值映射到0-0.1的旋转速度
    rotationSpeed.value = value * 0.01;
  });
};

</script>

<style scoped>
#three-canvas {
  width: 100%;
  height: 100%;
  /* opacity: 0.3; */
  z-index: -1;
}
</style>