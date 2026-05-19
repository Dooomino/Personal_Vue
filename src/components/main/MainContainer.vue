<template>
  <div class="h-full w-full main">
    <canvas ref="canvas" class="h-full w-full"></canvas>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const centerOfField = new THREE.Vector3(0, 0, 0);

const canvas = ref<HTMLCanvasElement | null>(null);
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let scene: THREE.Scene | null = null;
let resizeHandler: (() => void) | null = null;
let meshList: THREE.Mesh[] = [];
onMounted(() => {
  if (!canvas.value) {
    console.error('[MainContainer] Canvas ref is null');
    return;
  }

  scene = new THREE.Scene();

  // 创建 5x12 矩阵的立方体（无间隙）
  const rows = 8;
  const cols = 32;
  const boxSize = 0.4; // 立方体尺寸（作为页面主体）
  const spacing = boxSize + 0.01; // 间距等于立方体尺寸，实现无缝拼接
  const startX = -((cols - 1) * spacing) / 2; // 居中起始 X 坐标
  const startY = -((rows - 1) * spacing) / 2; // 居中起始 Y 坐标

  // 计算矩阵的实际尺寸
  const matrixWidth = (cols - 1) * spacing;
  const matrixHeight = (rows - 1) * spacing;
  const matrixSize = Math.max(matrixWidth, matrixHeight);

  // 根据矩阵大小计算缩放比例（以 10 为基准尺寸）
  const scaleRatio = matrixSize / 10;
  const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x111111,
    shininess: 10,
    flatShading: false, // 关闭平面着色，使用平滑着色减少摩尔纹
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
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;

      meshList = [...meshList, boxMesh];

      scene.add(boxMesh);
    }
  }

  const light = new THREE.DirectionalLight(0xffffff, 2000);
  light.lookAt(new THREE.Vector3(0, 0, 0))
  light.position.set(-1, 0, 10);
  scene.add(light);

  let moveDirection = 1; // 当前移动方向
  let targetDirection = 1; // 目标移动方向
  const moveSpeed = 0.01 * scaleRatio; // 根据缩放比例调整移动速度
  const boundary = 3 * scaleRatio; // 移动边界范围根据矩阵大小缩放
  const directionChangeSpeed = 0.05; // 方向变化速度（越小越平滑）

  const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * scaleRatio, 32, 32), // 球体大小根据矩阵缩放
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    })
  );
  sphereMesh.position.set(0, 0, 0.5 * scaleRatio); // 初始位置设为中心
  scene.add(sphereMesh);

  // scene.add(new THREE.AxesHelper(10))

  // 使用透视相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  // 相机位置根据矩阵大小等比缩放，确保视野覆盖整个矩阵
  const cameraDistance = matrixSize * 0.8; // 相机距离为矩阵尺寸的 80%
  camera.position.set(0, -cameraDistance * 0.5, cameraDistance * 0.5);
  camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true, // 启用透明背景
    antialias: true, // 启用抗锯齿，减少摩尔纹
    powerPreference: 'high-performance' // 优先使用高性能模式
  });
  renderer.setClearColor(0x000000, 0); // 设置完全透明（alpha = 0）
  renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比，避免性能问题
  //mipmap
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  // gui = new GUI();

  // 动画循环
  function animate() {
    requestAnimationFrame(animate);
    if (controls && renderer && scene && camera) {
      // 实现左右反复移动
      centerOfField.copy(sphereMesh.position);

      // 检查是否到达边界，如果到达则改变目标方向
      if (centerOfField.x > boundary) {
        targetDirection = -1; // 到达右边界，目标方向改为向左
      } else if (centerOfField.x < -boundary) {
        targetDirection = 1; // 到达左边界，目标方向改为向右
      }

      // 平滑过渡方向（使用线性插值）
      moveDirection += (targetDirection - moveDirection) * directionChangeSpeed;

      centerOfField.x += moveSpeed * moveDirection;

      sphereMesh.position.copy(centerOfField);

      for (const mesh of meshList) {
        // 计算 mesh 与中心点的距离
        const dist = mesh.position.distanceTo(centerOfField);

        // 根据距离计算目标 Z 轴位置（距离越近，Z 值越小，形成凹陷效果）
        // 使用高斯函数或正弦函数创建平滑的波浪效果
        const maxDist = 1.5 * scaleRatio; // 最大影响距离根据矩阵大小缩放
        const maxOffset = 0.8 * scaleRatio; // 最大 Z 轴偏移量根据矩阵大小缩放

        let targetZ = 0;
        if (dist < maxDist) {
          // 使用余弦函数创建平滑的凹陷效果
          targetZ = maxOffset * Math.cos((dist / maxDist) * Math.PI / 2);
        }

        // 平滑过渡到目标 Z 位置
        mesh.position.z += (targetZ - mesh.position.z) * 0.1;
      }
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
.main {
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
