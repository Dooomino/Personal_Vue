<template>
  <div id='three-canvas'></div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three'

onMounted(() => {
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
  const animate = () => {
    requestAnimationFrame(animate);
    mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
  };

  animate();

})

</script>

<style scoped>
#three-canvas {
  width: 100%;
  height: 100%;
  /* opacity: 0.3; */
  z-index: -1;
}
</style>
