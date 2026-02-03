<template>
  <canvas ref="canvasRef"></canvas>
</template>
<script setup lang="ts">
import * as THREE from 'three';
import { onMounted, ref, shallowRef } from 'vue';
import { useThemeStore } from '../../stores/theme.ts';
import { Terrarin } from './entities/Terrarin';
import { OrbitControls } from 'three-stdlib';
import { ColorInterpolator } from './utils/ColorInterpolator';

const themeStore = useThemeStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
// 使用 shallowRef 替代 ref，避免 Vue 深层代理 Three.js 对象
const terrain = shallowRef<Terrarin | null>(null);

// 创建一个便捷的 getter 函数，这样可以直接使用 terrainRef 而不是 terrain.value
const terrainRef = () => terrain.value!;
// 保存 GLObject 引用以便在主题切换时使用
const glObjRef = shallowRef<GLObject | null>(null);
const currentTheme = ref<'light' | 'dark'>(themeStore.isDarkMode ? 'dark' : 'light');

// 颜色渐变相关变量
const isColorTransitioning = ref(false);
const colorTransitionStart = ref<number>(0);
const colorTransitionDuration = 0.4; // 过渡时间 1 秒
const fromColor = new THREE.Color();
const toColor = new THREE.Color();
const currentBgColor = new THREE.Color();

interface GLObject{
  scene: THREE.Scene;
  lightManager: THREE.Group;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
}

defineOptions({
  name: 'TerrainStage'
})
function setupStage() {
  return new Promise(async (resolve) => {
    const genHeight = 50;
    const scene = new THREE.Scene();
    const stage = new THREE.Group();
    scene.add(stage);
    const resolution = [window.innerWidth, window.innerHeight];
    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5*genHeight,genHeight*5,1.2*genHeight);
    camera.lookAt(0,0,0);
    scene.add(camera);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value as HTMLCanvasElement,
      antialias: true,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    terrain.value = new Terrarin(100, 30, resolution);

    const terrainMesh = terrainRef().getMesh();
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    stage.add(terrainMesh);

    // 添加环境光，让地形更明显
    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    // scene.add(ambientLight);

    // 添加方向光，增强地形的立体感
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(-10, 5, 10);
    scene.add(directionalLight);

    // 自动调整相机以适应网格
    adjustCameraToFitMesh(camera as THREE.PerspectiveCamera, terrainMesh, scene);
    const controls = new OrbitControls(camera, canvasRef.value as HTMLCanvasElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enableZoom = false;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    controls.enablePan = false;
    controls.update();
    renderer.setClearColor(0x000000, 0.0); // 黑色背景，完全透明

    const GLObj : GLObject = {
      scene,
      lightManager: new THREE.Group(),
      controls,
      renderer,
      camera,
    }
    resolve(GLObj)
  })
}

// 添加一个函数来调整相机以适应网格
function adjustCameraToFitMesh(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh, scene: THREE.Scene) {
  // 计算网格的边界框
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3()); // 获取网格中心
  const size = box.getSize(new THREE.Vector3()); // 获取网格大小

  // 计算网格的最大尺寸
  const maxSize = Math.max(size.x, size.y, size.z);

  // 计算相机距离，以确保网格适合视野
  // 使用视野角度和网格大小来计算合适的距离
  const fov = camera.fov * (Math.PI / 180); // 转换为弧度
  let cameraDistance = maxSize / 2 / Math.tan(fov / 2);

  // 添加一点边距，确保网格完全适合视图
  cameraDistance *= 0.5;

  // 调整相机位置，使其看向网格中心
  const direction = camera.position.clone().normalize(); // 保留当前相机的方向
  camera.position.copy(direction.multiplyScalar(cameraDistance));
  camera.position.add(center);
  // camera.position.y += 10;
  camera.lookAt(center);

  // 更新相机的近远裁剪面
  camera.near = maxSize / 100;
  camera.far = cameraDistance * 5;
  camera.updateProjectionMatrix();
}

function startUpStage(gl:GLObject) {
  const { scene, camera, renderer, controls } = gl;

  // 保存 GLObject 引用
  glObjRef.value = gl;

  // 初始化背景颜色
  const initialTheme = currentTheme.value;
  // scene.background = new THREE.Color(initialTheme === 'light' ? '#f3f4f6' : '#1e1e1e');
  scene.background = null;

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.setClearColor(0x000000, 0.0); // 黑色背景，完全透明
    // 更新控制器状态，确保 damping 等效果生效
    controls.update();

    // 处理颜色渐变
    if (isColorTransitioning.value && colorTransitionStart.value !== null) {
      const currentTime = performance.now();
      const progress = ColorInterpolator.calculateProgress(
        colorTransitionStart.value,
        currentTime,
        colorTransitionDuration
      );
      console.log(fromColor, toColor, progress);
      ColorInterpolator.interpolateColors(
        fromColor,
        toColor,
        progress,
        currentBgColor
      );

      if (glObjRef.value) {
        // glObjRef.value.scene.background = currentBgColor;
      }

      if (progress >= 1) {
        isColorTransitioning.value = false;
      }
    }

    // 渲染场景
    renderer.render(scene, camera);
  };
  animate();
}

// 主题切换处理函数
function handleThemeChange(isDark: boolean) {
  const newTheme = isDark ? 'dark' : 'light';
  if (newTheme != currentTheme.value && glObjRef.value) {

    // 开始颜色过渡
    const oldTheme = currentTheme.value;
    // fromColor.copy(glObjRef.value.scene.background as THREE.Color); // 使用当前背景色作为起始色
    fromColor.copy(new THREE.Color( oldTheme === 'light' ? '#f3f4f6' : '#1e1e1e'))
    toColor.set(newTheme === 'light' ? '#f3f4f6' : '#1e1e1e');

    currentTheme.value = newTheme;
    isColorTransitioning.value = true;
    colorTransitionStart.value = performance.now();
  }
}

themeStore.$onAction((action) => {
  if(action.name === 'toggleDarkMode'){
    handleThemeChange(action.args[0]);
  }
})

onMounted(() => {
  if(canvasRef.value){
    setupStage().then((gl) =>{
      startUpStage(gl as GLObject)
    })
  }
})

</script>
