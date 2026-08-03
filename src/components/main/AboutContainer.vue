<template>
  <div class="u-h-full u-w-full main">
    <div class="u-h-full u-w-full main-content u-flex u-flex-col u-items-center u-justify-center">
      <div class="u-h-full u-w-full main-content-inner u-flex u-flex-col u-items-center u-justify-center">
        <!-- <div class="main-content-title">Hello, World!</div>
        <div class="main-content-text">
          This is a sample website to demonstrate the use of the by-theme class.
        </div> -->
        <canvas ref="canvas" class="u-w-full u-h-full main-bg"></canvas>

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

  // 窗口 resize 监听器清理函数
  let cleanupResize: (() => void) | null = null;

  // Tooltip 相关状态
  const tooltipVisible = ref(false);
  const tooltipText = ref('');
  const tooltipPosition = ref({ x: 0, y: 0 });
  const currentDotIndex = ref<number | null>(null);

  // 子弹管理系统
  interface Bullet {
    mesh: THREE.Mesh;
    direction: THREE.Vector3;
    speed: number;
    isActive: boolean;
  }

  interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number; // 剩余生命周期（秒）
    maxLife: number; // 最大生命周期
  }

  const bullets: Bullet[] = [];
  const particles: Particle[] = [];

  // 子弹几何体和材质（共享以优化性能）
  const bulletGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b6b });

  // 粒子几何体和材质
  const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 1
  });

  const numDots = 30;

  // 圆点数组（模块级变量，供子弹碰撞检测使用）
  const dots: THREE.Mesh[] = [];

  function initStage(){
    if (canvas.value) {
      const width = canvas.value.clientWidth;
      const height = canvas.value.clientHeight;

      if (width === 0 || height === 0) {
        console.error('[AboutContainer] Canvas has zero dimensions!');
        return;
      }

      const aspect = width / height;
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

      renderer.value.setSize(width, height);

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
    } else {
      console.error('[AboutContainer] Cannot init stage: canvas is null');
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
            // 处理圆点点击事件
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
        onClick: () => {
          // 处理球体点击事件，发射子弹
          const state = autoRotateScaleRef.current?.getState();
          if (state && state.isActive) {
            // 获取当前虚拟鼠标位置
            const mouseX = state.center.x + state.radius * Math.cos(state.angle);
            const mouseZ = state.center.z + state.radius * Math.sin(state.angle);

            // 计算发射方向（从中心指向外部）
            const direction = new THREE.Vector3(mouseX, 0, mouseZ).normalize();

            // 调整发射位置：沿发射方向向外偏移 0.5 单位，避免与圆点立即碰撞
            const startPos = new THREE.Vector3(mouseX, 0, mouseZ).add(direction.clone().multiplyScalar(0.5));

            // 发射子弹
            fireBullet(startPos, direction);
          }
        },
        // 注释掉原来的距离缩放回调，改用自动旋转缩放
        // onHover: (mesh, distance, point) => {
        //   // 触发圆点距离缩放（传递交点坐标）
        //   dotsOnHover(mesh, distance, point);
        // }
      });
    }
  }

  // 发射子弹
  function fireBullet(startPos: THREE.Vector3, direction: THREE.Vector3) {
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bulletMesh.position.copy(startPos);
    stage.value!.add(bulletMesh);

    bullets.push({
      mesh: bulletMesh,
      direction: direction.clone().normalize(),
      speed: 8.0, // 子弹速度（单位/秒）
      isActive: true
    });
  }

  // 创建爆炸粒子效果
  function createExplosion(position: THREE.Vector3) {
    const particleCount = 8; // 粒子数量
    const spreadSpeed = 3.0; // 扩散速度

    for (let i = 0; i < particleCount; i++) {
      const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial.clone());
      particleMesh.position.copy(position);

      // 随机方向
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).multiplyScalar(spreadSpeed);

      stage.value!.add(particleMesh);

      particles.push({
        mesh: particleMesh,
        velocity,
        life: 0.3, // 粒子生命周期 0.3 秒
        maxLife: 0.3
      });
    }
  }

  // 更新所有子弹位置
  function updateBullets(deltaTime: number) {
    if (!camera.value) return;

    // 获取相机的实际边界
    const frustumSize = 10;
    const aspect = (canvas.value?.clientWidth || 0) / (canvas.value?.clientHeight || 0);
    const xBound = frustumSize * aspect / 2 - 0.5; // 左右边界（留出更多出血位置）
    const zBound = frustumSize / 2 - 0.1; // 上下边界（留出更多出血位置）

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (!bullet.isActive) continue;

      // 更新位置
      bullet.mesh.position.addScaledVector(bullet.direction, bullet.speed * deltaTime);

      // 检测碰撞（与圆点）
      let collided = false;
      for (const dot of dots) {
        const dist = bullet.mesh.position.distanceTo(dot.position);
        if (dist < 0.15) { // 碰撞阈值（子弹半径0.08 + 圆点半径0.05 + 容差0.02）
          collided = true;

          // 触发爆炸效果
          createExplosion(bullet.mesh.position.clone());
          break;
        }
      }

      // 检测边界
      const pos = bullet.mesh.position;
      const outOfBounds = Math.abs(pos.x) > xBound || Math.abs(pos.z) > zBound;

      // 移除子弹
      if (collided || outOfBounds) {
        // 边界碰撞也触发爆炸效果
        if (outOfBounds && !collided) {
          createExplosion(bullet.mesh.position.clone());
        }
        stage.value!.remove(bullet.mesh);
        bullets.splice(i, 1);
      }
    }
  }

  // 更新所有粒子
  function updateParticles(deltaTime: number) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      // 更新位置
      particle.mesh.position.addScaledVector(particle.velocity, deltaTime);

      // 更新生命周期和透明度
      particle.life -= deltaTime;
      const opacity = particle.life / particle.maxLife;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;

      // 移除死亡粒子
      if (particle.life <= 0) {
        stage.value!.remove(particle.mesh);
        (particle.mesh.material as THREE.Material).dispose();
        particles.splice(i, 1);
      }
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

      // 更新子弹和粒子
      const deltaTime = 0.016; // 假设 60fps，约 16ms
      updateBullets(deltaTime);
      updateParticles(deltaTime);

      controls.value.update(); // 更新控制器
      renderer.value.render(stage.value, camera.value);
    }
  }


  onMounted(() => {
    if (canvas.value) {
      initStage();
      animate(); // 启动动画循环
    } else {
      console.error('[AboutContainer] Canvas ref is null!');
    }

    // 监听窗口大小变化，重新调整渲染器和相机
    const handleResize = () => {
      if (!canvas.value || !renderer.value || !camera.value) return;

      // 强制浏览器重排，确保获取最新的 Canvas 尺寸
      void canvas.value.offsetWidth;

      const width = canvas.value.clientWidth;
      const height = canvas.value.clientHeight;

      console.log('Canvas resized:', { width, height, aspect: width / height });

      // 更新渲染器大小
      renderer.value.setSize(width, height);

      // 更新正交相机参数
      const aspect = width / height;
      const frustumSize = 10;
      camera.value.left = -frustumSize * aspect / 2;
      camera.value.right = frustumSize * aspect / 2;
      camera.value.top = frustumSize / 2;
      camera.value.bottom = -frustumSize / 2;

      // 确保相机位置正确（从正上方俯视中心）
      camera.value.position.set(0, 10, 0);
      camera.value.lookAt(0, 0, 0);
      camera.value.updateProjectionMatrix();

      // 重置轨道控制器到初始状态
      if (controls.value) {
        controls.value.reset();
      }
    };

    window.addEventListener('resize', handleResize);
    cleanupResize = () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  onUnmounted(() => {
    // 清理窗口 resize 监听器
    cleanupResize?.();

    // 清理悬浮管理器
    hoverManager.value?.dispose();

    // 清理所有子弹
    bullets.forEach(bullet => {
      stage.value?.remove(bullet.mesh);
    });
    bullets.length = 0;

    // 清理所有粒子
    particles.forEach(particle => {
      stage.value?.remove(particle.mesh);
      (particle.mesh.material as THREE.Material).dispose();
    });
    particles.length = 0;

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
