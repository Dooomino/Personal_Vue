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
  const rows = 16;
  const cols = 32;
  const boxSize = 0.01; // 立方体尺寸（作为页面主体）
  const spacing = boxSize * 1.01; // 间距等于立方体尺寸，实现无缝拼接
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

  const light = new THREE.DirectionalLight(0x999999, 2000);
  light.lookAt(new THREE.Vector3(0, 0, 0))
  light.position.set(-1, 0, 10);
  scene.add(light);

  let moveDirection = 1; // 当前移动方向
  let targetDirection = 1; // 目标移动方向
  const moveSpeed = 0.1 * scaleRatio; // 根据缩放比例调整移动速度
  const boundary = 8 * scaleRatio; // 移动边界范围根据矩阵大小缩放
  const directionChangeSpeed = 0.01; // 方向变化速度（越小越平滑）
  const maxDist = 3.0 * scaleRatio; // 最大影响距离根据矩阵大小缩放
  const maxOffset = 1.4 * scaleRatio; // 最大 Z 轴偏移量根据矩阵大小缩放

  // Y 轴抖动相关变量
  let yJitterTime = 0; // 抖动时间累积
  const yJitterAmplitude = 0.2 * scaleRatio; // Y 轴抖动幅度
  const yJitterFrequency = 4.0; // 抖动频率（更频繁）

  // const targetObj = new THREE.Mesh(
  //   new THREE.SphereGeometry(maxDist * 0.9, 32, 32), // 球体大小根据矩阵缩放
  //   // new THREE.IcosahedronGeometry(maxDist * 0.9, 1),
  //   // new THREE.MeshBasicMaterial({
  //   //   color: 0xffffff,
  //   //   transparent: false,
  //   //   opacity: 0
  //   // })
  //   new THREE.MeshPhongMaterial({
  //     color: 0xffffff,
  //     // specular: 0x111111,
  //     shininess: 1,
  //     transparent: true,
  //     opacity: 0,
  //     flatShading: true,
  //     vertexColors: true
  //   })
  // );

  const targetObj = new THREE.Object3D();
  targetObj.position.set(0, 0, 0.5 * scaleRatio); // 初始位置设为中心
  scene.add(targetObj);

  // scene.add(new THREE.AxesHelper(10))

  // 使用透视相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  // 相机位置根据矩阵大小等比缩放，确保视野覆盖整个矩阵
  const cameraDistance = matrixSize * 0.5; // 拉近相机距离（从 0.64 改为 0.5）
  camera.position.set(0, -cameraDistance, cameraDistance );
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
      centerOfField.copy(targetObj.position);

      // 检查是否到达边界，如果到达则改变目标方向
      if (centerOfField.x > boundary) {
        targetDirection = -1; // 到达右边界，目标方向改为向左
      } else if (centerOfField.x < -boundary) {
        targetDirection = 1; // 到达左边界，目标方向改为向右
      }

      // 平滑过渡方向（使用线性插值）
      moveDirection += (targetDirection - moveDirection) * directionChangeSpeed;

      centerOfField.x += moveSpeed * moveDirection;

      // Y 轴随机抖动（在边界处衰减为 0）
      yJitterTime += 0.016; // 假设 60fps

      // 计算边界衰减因子（靠近边界时抖动减弱）
      const distToBoundary = Math.min(
        Math.abs(centerOfField.x - boundary),
        Math.abs(centerOfField.x + boundary)
      );
      const boundaryFadeDistance = 1.0 * scaleRatio; // 边界衰减距离
      const boundaryFactor = Math.min(distToBoundary / boundaryFadeDistance, 1);

      // 使用多个正弦波叠加创建更自然的抖动
      const jitterY = yJitterAmplitude * boundaryFactor * (
        Math.sin(yJitterTime * yJitterFrequency) * 0.5 +
        Math.sin(yJitterTime * yJitterFrequency * 1.7) * 0.3 +
        Math.sin(yJitterTime * yJitterFrequency * 0.6) * 0.2
      );

      centerOfField.y = jitterY;

      targetObj.position.copy(centerOfField);

      // 根据移动方向计算滚动速度
      const rollSpeed = 0.5; // 滚动速度系数
      targetObj.rotation.x += moveSpeed * rollSpeed; // 沿 X 轴移动时绕 X 轴滚动
      targetObj.rotation.z -= moveSpeed * rollSpeed; // 沿 X 轴移动时绕 Z 轴反向滚动（模拟向前滚）

      // 如果有 Y 轴速度，也可以添加对应的旋转
      // targetObj.rotation.y += yJitterSpeed * rollSpeed;

      for (const mesh of meshList) {
        // 计算 mesh 与中心点的距离
        const dist = mesh.position.distanceTo(centerOfField);

        // 根据距离计算目标 Z 轴位置（距离越近，Z 值越小，形成凹陷效果）
        // 使用高斯函数或正弦函数创建平滑的波浪效果

        let targetZ = 0;
        if (dist < maxDist) {
          // 使用余弦函数创建平滑的凹陷效果
          targetZ = maxOffset * Math.cos((dist / maxDist) * Math.PI / 2);

          // 添加连贯的随机噪声（基于位置和时间的噪声）
          const noiseTime = yJitterTime * 0.8; // 加快噪声演变速度
          const meshId = mesh.position.x * 127 + mesh.position.y * 73; // 使用质数增加随机性

          // 基础噪声：使用更多频率和更高权重的正弦波叠加
          const baseNoise = (
            Math.sin(meshId * 0.15 + noiseTime) * 0.6 +
            Math.sin(meshId * 0.37 + noiseTime * 1.5) * 0.45 +
            Math.sin(meshId * 0.09 + noiseTime * 0.9) * 0.35 +
            Math.sin(meshId * 0.51 + noiseTime * 2.1) * 0.25 +
            Math.sin(meshId * 0.23 + noiseTime * 0.6) * 0.2
          );

          // 添加额外的随机高度变化（每个方块独立的随机因子）
          // 使用 hash 函数生成伪随机数，但保持连贯性
          const randomSeed = Math.abs(Math.sin(meshId * 12.9898 + noiseTime * 0.3) * 43758.5453) % 1;
          const heightVariation = (randomSeed - 0.5) * 2; // 范围 -1 到 1

          // 合并基础噪声和高度变化
          const combinedNoise = baseNoise * 0.7 + heightVariation * 0.3;

          // 噪声幅度随距离衰减（进一步增大幅度）
          const noiseAmplitude = 0.6 * scaleRatio * (1 - dist / maxDist);
          targetZ += combinedNoise * noiseAmplitude;
        }

        // 平滑过渡到目标 Z 位置（增大平滑系数）
        mesh.position.z += (targetZ - mesh.position.z) * 0.05;
      }
      // console.log(targetObj.position.x)
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
