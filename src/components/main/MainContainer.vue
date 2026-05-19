<template>
  <div class="h-full w-full main">
    <canvas ref="canvas" class="h-full w-full"></canvas>
  </div>
</template>
<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { lightPosition } from 'three/src/nodes/TSL.js';

  const centerOfField = new THREE.Vector3(0,0,0);

  const canvas = ref<HTMLCanvasElement | null>(null);
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let scene: THREE.Scene | null = null;
  let resizeHandler: (() => void) | null = null;

  onMounted(() => {
    if (!canvas.value) {
      console.error('[MainContainer] Canvas ref is null');
      return;
    }

    scene = new THREE.Scene();

    // 创建 5x12 矩阵的立方体（无间隙）
    const rows = 5;
    const cols = 12;
    const boxSize = 0.4; // 立方体尺寸（作为页面主体）
    const spacing = boxSize; // 间距等于立方体尺寸，实现无缝拼接
    const startX = -((cols - 1) * spacing) / 2; // 居中起始 X 坐标
    const startY = -((rows - 1) * spacing) / 2; // 居中起始 Y 坐标
    const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0x000000,
            shininess: 0,
            flatShading: true,
            vertexColors: true
          })
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const boxMesh = new THREE.Mesh(
          boxGeo,
          boxMat
        );

        // 计算位置
        boxMesh.position.x = startX + col * spacing;
        boxMesh.position.y = startY + row * spacing;
        boxMesh.position.z = 0;

        scene.add(boxMesh);
      }
    }

    const light = new THREE.DirectionalLight(0xffffff, 10000);
    light.lookAt(new THREE.Vector3(0, 0, 0))
    light.position.set(0, 0, 10);
    scene.add(light);

    const sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 32, 32),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0x000000,
        shininess: 0,
        flatShading: true,
        vertexColors: true
      })
    );
    sphereMesh.position.set(2.5, 0, 0.5);
    scene.add(sphereMesh);
      // scene.add(new THREE.AxesHelper(10))
    // 使用透视相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -2, 2);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      alpha: true // 启用透明背景
    });
    renderer.setClearColor(0x000000, 0); // 设置完全透明（alpha = 0）
    renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // gui = new GUI();

    // 动画循环
    function animate() {
      requestAnimationFrame(animate);
      if (controls && renderer && scene && camera) {
        const newPos = sphereMesh.position.clone()


        sphereMesh.position.set(newPos.x-0.01, newPos.y, newPos.z)
        // console.log(sphereMesh.position.x)
        controls.update();
        renderer.render(scene, camera);
      }
    }
    animate();

    // 监听窗口大小变化
    resizeHandler = () => {
      if (camera && renderer && canvas.value) {
        camera.aspect = canvas.value.clientWidth / canvas.value.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight);
      }
    };
    window.addEventListener('resize', resizeHandler);
  });

  onUnmounted(() => {
    // 清理事件监听器
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }

    // 清理 Three.js 资源
    if (controls) controls.dispose();
    if (renderer) renderer.dispose();
    if (scene) {
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material: THREE.Material) => material.dispose());
        }
      });
    }
  });
</script>

<style scoped>
.main{
  background: linear-gradient(to bottom, #33554488 0%, rgba(255, 255, 255, 0) 100%);
  animation: fadeIn 0.6s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    background: linear-gradient(to bottom, #00000088 0%, rgba(255, 255, 255, 0) 100%);
    transform: translateY(1%);
  }
  to {
    opacity: 1;
    background: linear-gradient(to bottom, #33554488 0%, rgba(255, 255, 255, 0) 100%);
    transform: translateY(0);
  }
}
</style>
