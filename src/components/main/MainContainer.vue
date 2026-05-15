<template>
  <div class="h-full w-full main">
    <div class="h-full w-full main-content flex flex-col items-center">
      <div class="h-full w-10/12 main-content-inner flex flex-col items-center">
        <!-- <div class="main-content-title">Hello, World!</div>
        <div class="main-content-text">
          This is a sample website to demonstrate the use of the by-theme class.
        </div> -->
        <canvas ref="canvas" class="w-full h-full main-bg"></canvas>

        <!-- 添加 Tooltip 组件 -->
        <Transition name="tooltip">
          <DotTooltip
            v-if="tooltipVisible"
            :text="tooltipText"
            :position="tooltipPosition"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
  import { HoverManager } from '@/utils/HoverManager';
  import { createDotAnimationHooks, createDotAutoRotateScaleHook } from '@/utils/DotAnimation';
  import dotConfig from '@/assets/dot-config.json';
  import DotTooltip from './DotTooltip.vue';

  const canvas = ref<HTMLCanvasElement | null>(null);
  const camera = shallowRef<THREE.OrthographicCamera | null>(null);
  const stage = shallowRef<THREE.Scene | null>(null);
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const controls = shallowRef<OrbitControls | null>(null);
  const pivot = shallowRef<THREE.Object3D | null>(null); // 旋转枢轴
  const hoverManager = shallowRef<HoverManager | null>(null);

  // 圆点自动旋转缩放动画引用
  const autoRotateScaleRef = { current: null as ReturnType<typeof createDotAutoRotateScaleHook> | null };

  // Tooltip 相关状态
  const tooltipVisible = ref(false);
  const tooltipText = ref('');
  const tooltipPosition = ref({ x: 0, y: 0 });
  const currentDotIndex = ref<number | null>(null);

  const numDots = 30;

  function initStage(){
    if (canvas.value) {
      const aspect = (canvas.value?.clientWidth || 0) / (canvas.value?.clientHeight || 0);
      const frustumSize = 10;
      camera.value = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        1000
      );
      camera.value.position.set(0, 10, 0);
      camera.value.lookAt(0, 0, 0);

      stage.value = new THREE.Scene();

      renderer.value = new THREE.WebGLRenderer({
        canvas: canvas.value,
        alpha: true // 启用透明背景
      });
      renderer.value.setClearColor(0x000000, 0); // 设置完全透明

      renderer.value.setSize(canvas.value.clientWidth, canvas.value.clientHeight);

      // 添加场景元素（在 renderer 创建之后）
      addSceneElements();

      // 初始化轨道控制器
      controls.value = new OrbitControls(camera.value, renderer.value.domElement);
      controls.value.enableDamping = true; // 启用阻尼效果
      controls.value.dampingFactor = 0.05;
      controls.value.enableRotate = false; // 启用旋转
      controls.value.enablePan = false; // 禁用平移
      controls.value.enableZoom = false; // 禁用缩放
      controls.value.minPolarAngle = 0; // 允许从正上方查看
      controls.value.maxPolarAngle = 0; // 限制在正上方（锁定俯仰角）
      controls.value.screenSpacePanning = true; // 屏幕空间平移
    }
  }

  function addSceneElements() {
    // 创建旋转枢轴
    pivot.value = new THREE.Object3D();
    stage.value!.add(pivot.value);

    const sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry( 1, 64, 64 ),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    sphereMesh.position.set(0, 0, 0);

    const radius = 1.3; // 小圆点围绕大球的半径
    const segment = (Math.PI * 2) / numDots; // 每段弧度

    // 共用 Geometry 和 Material（优化性能）
    const dotGeometry = new THREE.SphereGeometry( 0.05, 32, 32 ); // 减小圆点原始尺寸
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const dots: THREE.Mesh[] = [];
    const targetPositions: THREE.Vector3[] = [];

    for( let i = 0; i < numDots; i++ ){
      // 为每个点创建新的 Mesh，但共用 Geometry 和 Material
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);

      // 计算圆周上的位置（目标位置）
      const angle = segment * i;
      const x = sphereMesh.position.x + radius * Math.cos(angle);
      const z = sphereMesh.position.z + radius * Math.sin(angle);
      const targetPos = new THREE.Vector3(x, sphereMesh.position.y, z);

      // 初始位置设置为球心
      dot.position.copy(sphereMesh.position);

      dots.push(dot);
      targetPositions.push(targetPos);
      pivot.value.add(dot);
    }

    pivot.value.add(sphereMesh);

    // 读取配置并为每个圆点注册悬浮和点击事件
    interface DotConfig {
      id: number;
      text: string;
      link: string;
    }
    const configs = dotConfig as DotConfig[];

    // 为每个圆点注册悬浮和点击事件
    dots.forEach((dot, index) => {
      const config = configs.find(c => c.id === index);

      if (hoverManager.value) {
        hoverManager.value.register(dot, {
          threshold: 0.5,
          detectionRadius: 0.5, // 增加检测半径
          onEnter: (mesh) => {
            // 显示 tooltip
            if (config) {
              tooltipText.value = config.text;
              tooltipVisible.value = true;
              currentDotIndex.value = index;

              // 计算圆点在屏幕上的位置
              const vector = new THREE.Vector3();
              mesh.getWorldPosition(vector);
              vector.project(camera.value!);

              const canvasRect = canvas.value!.getBoundingClientRect();
              tooltipPosition.value = {
                x: (vector.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left,
                y: (-vector.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top
              };
            }
          },
          onLeave: () => {
            // 隐藏 tooltip
            tooltipVisible.value = false;
            currentDotIndex.value = null;
          },
          onHover: (mesh) => {
            // 更新 tooltip 位置（跟随圆点）
            if (tooltipVisible.value) {
              const vector = new THREE.Vector3();
              mesh.getWorldPosition(vector);
              vector.project(camera.value!);

              const canvasRect = canvas.value!.getBoundingClientRect();
              tooltipPosition.value = {
                x: (vector.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left,
                y: (-vector.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top
              };
            }
          },
          onClick: () => {
            // 处理点击事件
            console.log('Dot clicked:', config?.text, 'link:', config?.link);
            if (config && config.link) {
              window.open(config.link, '_blank');
            }
          }
        });
      }
    });

    // 创建悬浮管理器并注册球体的悬浮监听
    if (renderer.value && camera.value && canvas.value) {
      hoverManager.value = new HoverManager(camera.value, canvas.value);

      // 创建圆点动画钩子
      const { onEnter: dotsOnEnter, onLeave: dotsOnLeave } = createDotAnimationHooks(
        dots,
        sphereMesh.position,
        targetPositions,
        500 // 动画持续时间 500ms
      );

      // 注释掉原来的距离缩放钩子，改用自动旋转缩放
      // const { onHover: dotsOnHover } = createDotDistanceScaleHook(
      //   dots,
      //   camera.value!,  // 此时 camera 已存在
      //   0.3,   // 基础缩放
      //   3.0,   // 最大缩放（离鼠标最近的圆点放大到 4.0 倍）
      //   5.0    // 影响半径（加大检测范围）
      // );

      // 创建圆点自动旋转缩放钩子
      const autoRotateScale = createDotAutoRotateScaleHook(
        dots,
        sphereMesh.position,  // 环绕中心
        radius,                // 环绕半径
        0.5,                   // 旋转速度（弧度/秒）
        2.5,                   // 影响半径
        0.3,                   // 基础缩放
        3.0,                   // 最大缩放
        0.15                   // 最小缩放
      );
      autoRotateScaleRef.current = autoRotateScale;

      // 保存球体原始缩放
      const originalScale = sphereMesh.scale.clone();
      const targetScale = originalScale.clone().multiplyScalar(0.99); // 放大到 1.2 倍
      let isScaling = false;
      let scaleTarget: 'expand' | 'contract' = 'contract';
      let scaleStartTime = 0;
      const scaleDuration = 300; // 缩放动画持续时间

      // 球体缩放动画更新函数
      function updateSphereScale() {
        if (!isScaling) return;

        const now = performance.now();
        if (scaleStartTime === 0) {
          scaleStartTime = now;
        }

        const elapsed = now - scaleStartTime;
        const rawProgress = Math.min(elapsed / scaleDuration, 1);
        // 使用缓动函数
        const easedProgress = rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : -1 + (4 - 2 * rawProgress) * rawProgress;

        if (scaleTarget === 'expand') {
          sphereMesh.scale.lerpVectors(originalScale, targetScale, easedProgress);
        } else {
          sphereMesh.scale.lerpVectors(targetScale, originalScale, easedProgress);
        }

        if (rawProgress >= 1) {
          isScaling = false;
          scaleStartTime = 0;
          if (scaleTarget === 'expand') {
            sphereMesh.scale.copy(targetScale);
          } else {
            sphereMesh.scale.copy(originalScale);
          }
        } else {
          requestAnimationFrame(updateSphereScale);
        }
      }

      // 为球体注册悬浮监听（同时触发圆点动画和球体缩放）
      hoverManager.value.register(sphereMesh, {
        threshold: 3.0,
        leaveDelay: 300,           // 添加 300ms 离开延迟
        detectionRadius: 1.5,      // 扩展检测半径 1.5（加大检测区域）
        onEnter: (mesh) => {
          // 触发圆点展开
          dotsOnEnter(mesh);

          // 启动自动旋转缩放
          autoRotateScaleRef.current?.start();

          // 触发球体放大
          if (!isScaling || scaleTarget !== 'expand') {
            isScaling = true;
            scaleTarget = 'expand';
            scaleStartTime = 0;
            updateSphereScale();
          }
        },
        onLeave: (mesh) => {
          // 触发圆点收缩
          dotsOnLeave(mesh);

          // 停止自动旋转缩放
          autoRotateScaleRef.current?.stop();

          // 触发球体缩小
          if (!isScaling || scaleTarget !== 'contract') {
            isScaling = true;
            scaleTarget = 'contract';
            scaleStartTime = 0;
            updateSphereScale();
          }
        },
        onClick: (mesh, point) => {
          // 处理球体点击事件
          console.log('Sphere clicked!', point);

          // 可以在这里添加点击后的逻辑，例如：
          // 1. 触发球体脉冲动画
          // 2. 切换旋转缩放方向
          // 3. 打开某个链接或模态框
        },
        // 注释掉原来的距离缩放回调，改用自动旋转缩放
        // onHover: (mesh, distance, point) => {
        //   // 触发圆点距离缩放（传递交点坐标）
        //   dotsOnHover(mesh, distance, point);
        // }
      });
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    if (renderer.value && stage.value && camera.value && controls.value) {
      // 更新悬浮管理器
      if (hoverManager.value && camera.value) {
        hoverManager.value.update(camera.value);
      }

      // 更新圆点自动旋转缩放
      if (autoRotateScaleRef.current) {
        autoRotateScaleRef.current.update();
      }

      controls.value.update(); // 更新控制器
      renderer.value.render(stage.value, camera.value);
    }
  }


  onMounted(() => {
    initStage();
    animate(); // 启动动画循环
  });

  onUnmounted(() => {
    // 清理悬浮管理器
    hoverManager.value?.dispose();

    controls.value?.dispose();
    renderer.value?.dispose();
    stage.value?.remove();
    camera.value = null;
    stage.value = null;
    renderer.value = null;
    controls.value = null;
    hoverManager.value = null;
  });

</script>
<style scoped>
  .main-bg {
    pointer-events: auto; /* 允许接收鼠标事件 */
  }

  /* Tooltip 过渡动画 */
  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  }

  .tooltip-enter-from,
  .tooltip-leave-to {
    opacity: 0;
    transform: translate(-50%, -120%) scale(0.8);
  }

  .tooltip-enter-to,
  .tooltip-leave-from {
    opacity: 1;
    transform: translate(-50%, -120%) scale(1);
  }
</style>
