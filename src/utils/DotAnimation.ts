import * as THREE from 'three';

/**
 * 圆点动画状态
 */
interface DotAnimationState {
  mesh: THREE.Mesh;
  startPosition: THREE.Vector3;  // 起始位置（球心）
  targetPosition: THREE.Vector3; // 目标位置（圆周）
  progress: number;              // 动画进度 0-1
  isExpanding: boolean;          // 是否正在展开
  duration: number;              // 动画持续时间（毫秒）
  startTime: number;             // 动画开始时间
  targetState: 'expanded' | 'contracted'; // 目标状态
}

/**
 * 动画缓动函数 - easeInOutQuad
 */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * 创建圆点动画钩子对（展开和收缩）
 * @param dots - 圆点 Mesh 数组
 * @param center - 中心位置（球心）
 * @param targetPositions - 每个圆点的目标位置数组
 * @param duration - 动画持续时间（毫秒，默认 500）
 * @returns 包含 onEnter 和 onLeave 的对象
 */
export function createDotAnimationHooks(
  dots: THREE.Mesh[],
  center: THREE.Vector3,
  targetPositions: THREE.Vector3[],
  duration: number = 500
): {
  onEnter: (mesh: THREE.Mesh) => void;
  onLeave: (mesh: THREE.Mesh) => void;
} {
  // 为每个圆点创建动画状态
  const animationStates: DotAnimationState[] = dots.map((dot, index) => ({
    mesh: dot,
    startPosition: center.clone(),
    targetPosition: targetPositions[index].clone(),
    progress: 0,
    isExpanding: false,
    duration,
    startTime: 0,
    targetState: 'contracted' // 初始状态为收缩
  }));

  let animationFrameId: number | null = null;

  /**
   * 更新动画
   */
  function updateAnimation(): void {
    const now = performance.now();
    let hasActiveAnimation = false;

    for (const state of animationStates) {
      // 检查是否有待处理的动画
      const needsAnimation =
        (state.targetState === 'expanded' && state.progress < 1) ||
        (state.targetState === 'contracted' && state.progress > 0);

      if (!needsAnimation) {
        continue;
      }

      hasActiveAnimation = true;

      // 计算进度
      if (state.startTime === 0) {
        state.startTime = now;
      }

      const elapsed = now - state.startTime;
      const rawProgress = Math.min(elapsed / state.duration, 1);
      const easedProgress = easeInOutQuad(rawProgress);

      if (state.targetState === 'expanded') {
        // 展开动画：从中心到目标
        state.mesh.position.lerpVectors(
          state.startPosition,
          state.targetPosition,
          easedProgress
        );
        state.progress = easedProgress;
      } else {
        // 收缩动画：从目标到中心
        state.mesh.position.lerpVectors(
          state.targetPosition,
          state.startPosition,
          easedProgress
        );
        state.progress = 1 - easedProgress;
      }

      // 动画完成
      if (rawProgress >= 1) {
        state.startTime = 0; // 重置开始时间
        if (state.targetState === 'expanded') {
          state.mesh.position.copy(state.targetPosition);
          state.progress = 1;
        } else {
          state.mesh.position.copy(state.startPosition);
          state.progress = 0;
        }
      }
    }

    if (hasActiveAnimation) {
      animationFrameId = requestAnimationFrame(updateAnimation);
    } else {
      animationFrameId = null;
    }
  }

  // onEnter 钩子：展开圆点
  const onEnter = () => {
    const now = performance.now();
    for (const state of animationStates) {
      // 只设置目标状态，不立即改变 isExpanding
      if (state.targetState !== 'expanded') {
        state.targetState = 'expanded';
        state.startTime = now; // 重置开始时间以重新开始动画
      }
    }

    // 启动动画循环
    if (!animationFrameId) {
      updateAnimation();
    }
  };

  // onLeave 钩子：收缩圆点
  const onLeave = () => {
    const now = performance.now();
    for (const state of animationStates) {
      // 只设置目标状态
      if (state.targetState !== 'contracted') {
        state.targetState = 'contracted';
        state.startTime = now; // 重置开始时间以重新开始动画
      }
    }

    // 启动动画循环
    if (!animationFrameId) {
      updateAnimation();
    }
  };

  return { onEnter, onLeave };
}

/**
 * 创建基于鼠标距离的圆点缩放钩子
 * @param dots - 圆点 Mesh 数组
 * @param camera - 相机引用（用于计算世界坐标）
 * @param baseScale - 基础缩放比例，默认 1.0
 * @param maxScale - 最大缩放比例，默认 2.0
 * @param influenceRadius - 影响半径，默认 2.0
 * @returns onHover 回调函数
 */
export function createDotDistanceScaleHook(
  dots: THREE.Mesh[],
  camera: THREE.Camera,
  baseScale: number = 1.0,
  maxScale: number = 2.0,
  influenceRadius: number = 2.0
): {
  onHover: (mesh: THREE.Mesh, distance?: number, point?: THREE.Vector3) => void;
} {
  // 为每个圆点保存原始缩放
  const originalScales = dots.map(dot => dot.scale.clone());

  // 最小缩放比例（远处的圆点会缩小到这个值）
  const minScale = 0.15; // 从 0.3 改为 0.15，让远处的圆点更小

  const onHover = (hoveredMesh: THREE.Mesh, distance?: number, point?: THREE.Vector3) => {
    // 使用射线交点作为鼠标位置，如果没有则使用球体中心
    const mouseWorldPos = point || hoveredMesh.position;
    mouseWorldPos.y = 0;
    // 遍历所有圆点，根据距离调整缩放
    dots.forEach((dot, index) => {
      const dotWorldPos = new THREE.Vector3();
      dot.getWorldPosition(dotWorldPos);

      // 计算鼠标交点到圆点的距离
      const distToMouse = mouseWorldPos.distanceTo(dotWorldPos);

      // 计算缩放比例（距离越近，缩放越大；距离越远，缩放越小）
      let scaleRatio = baseScale;
      if (distToMouse < influenceRadius) {
        // 在影响范围内：使用更陡峭的曲线
        const normalizedDist = distToMouse / influenceRadius;
        // 使用 6 次方曲线，让近距离放大更明显，远距离快速衰减
        const easeFactor = Math.pow(1 - normalizedDist, 6);
        scaleRatio = baseScale + (maxScale - baseScale) * easeFactor;
      } else {
        // 在影响范围外：逐渐缩小到最小值
        const excessDist = distToMouse - influenceRadius;
        const decayFactor = Math.max(0, 1 - excessDist / influenceRadius);
        scaleRatio = minScale + (baseScale - minScale) * decayFactor;
      }

      // 应用缩放 - 直接设置而不是使用 lerp
      const targetScale = originalScales[index].clone().multiplyScalar(scaleRatio);
      dot.scale.copy(targetScale);
    });
  };

  return { onHover };
}
