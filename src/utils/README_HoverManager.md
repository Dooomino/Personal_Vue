# Three.js 悬浮监听系统使用指南

## 概述

这是一个模块化的 Three.js 鼠标悬浮监听系统，可以为任意 Mesh 添加悬浮交互效果。

## 核心组件

### 1. HoverManager（悬浮管理器）

**位置**: `src/utils/HoverManager.ts`

负责检测鼠标与 Mesh 的交互，并触发相应的回调函数。

**基本用法**:
```typescript
import { HoverManager } from '@/utils/HoverManager';

// 创建管理器实例
const hoverManager = new HoverManager(camera, canvas);

// 注册 Mesh 的悬浮监听
hoverManager.register(mesh, {
  threshold: 3.0,  // 可选：触发距离阈值
  onEnter: (mesh) => {
    console.log('鼠标进入', mesh);
  },
  onLeave: (mesh) => {
    console.log('鼠标离开', mesh);
  },
  onHover: (mesh, distance) => {
    console.log('持续悬浮', mesh, distance);
  }
});

// 在动画循环中更新
function animate() {
  hoverManager.update(camera);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// 清理资源
hoverManager.dispose();
```

### 2. DotAnimation（圆点动画钩子）

**位置**: `src/utils/DotAnimation.ts`

提供圆点从中心发散和收缩的动画钩子函数。

**基本用法**:
```typescript
import { createDotAnimationHooks } from '@/utils/DotAnimation';

// 创建动画钩子
const { onEnter, onLeave } = createDotAnimationHooks(
  dots,              // 圆点 Mesh 数组
  center,            // 中心位置（Vector3）
  targetPositions,   // 每个圆点的目标位置数组
  500                // 动画持续时间（毫秒）
);

// 将钩子传递给 HoverManager
hoverManager.register(sphereMesh, {
  onEnter,
  onLeave
});
```

## 完整示例

参考 `src/components/main/MainContainer.vue` 的实现：

```typescript
import { HoverManager } from '@/utils/HoverManager';
import { createDotAnimationHooks } from '@/utils/DotAnimation';

// 1. 准备数据
const dots: THREE.Mesh[] = [];
const targetPositions: THREE.Vector3[] = [];

// 创建圆点并计算目标位置
for (let i = 0; i < numDots; i++) {
  const dot = new THREE.Mesh(geometry, material);
  const targetPos = calculatePosition(i); // 计算目标位置
  
  // 初始位置设为中心
  dot.position.copy(center);
  
  dots.push(dot);
  targetPositions.push(targetPos);
  scene.add(dot);
}

// 2. 创建悬浮管理器
const hoverManager = new HoverManager(camera, canvas);

// 3. 创建动画钩子
const { onEnter, onLeave } = createDotAnimationHooks(
  dots,
  center,
  targetPositions,
  500
);

// 4. 注册悬浮监听
hoverManager.register(sphereMesh, {
  threshold: 3.0,
  onEnter,
  onLeave
});

// 5. 在动画循环中更新
function animate() {
  hoverManager.update(camera);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// 6. 清理
onUnmounted(() => {
  hoverManager.dispose();
});
```

## 自定义动画钩子

你可以创建自己的动画钩子函数，实现不同的交互效果：

```typescript
// 颜色变化钩子
function createColorChangeHook(
  mesh: THREE.Mesh,
  hoverColor: THREE.Color,
  originalColor: THREE.Color,
  duration: number = 300
) {
  return {
    onEnter: () => {
      mesh.material.color.lerp(hoverColor, 1);
    },
    onLeave: () => {
      mesh.material.color.lerp(originalColor, 1);
    }
  };
}

// 缩放钩子
function createScaleHook(
  mesh: THREE.Mesh,
  scale: number = 1.5,
  duration: number = 300
) {
  const originalScale = mesh.scale.clone();
  const targetScale = originalScale.clone().multiplyScalar(scale);
  
  return {
    onEnter: () => {
      mesh.scale.lerp(targetScale, 1);
    },
    onLeave: () => {
      mesh.scale.lerp(originalScale, 1);
    }
  };
}
```

## API 参考

### HoverManager

#### 构造函数
```typescript
new HoverManager(camera: THREE.Camera, canvas: HTMLCanvasElement)
```

#### 方法
- `register(mesh: THREE.Mesh, config: HoverConfig): void` - 注册 Mesh 的悬浮监听
- `unregister(mesh: THREE.Mesh): void` - 注销 Mesh 的悬浮监听
- `update(camera: THREE.Camera): void` - 更新悬浮状态（每帧调用）
- `dispose(): void` - 清理资源

### HoverConfig 接口
```typescript
interface HoverConfig {
  onEnter?: (mesh: THREE.Mesh) => void;
  onLeave?: (mesh: THREE.Mesh) => void;
  onHover?: (mesh: THREE.Mesh, distance: number) => void;
  threshold?: number;
}
```

### createDotAnimationHooks
```typescript
function createDotAnimationHooks(
  dots: THREE.Mesh[],
  center: THREE.Vector3,
  targetPositions: THREE.Vector3[],
  duration?: number
): { onEnter: Function; onLeave: Function }
```

## 注意事项

1. **性能优化**: 
   - 使用 shallowRef 避免 Vue 响应式系统干扰 Three.js 对象
   - 共用 Geometry 和 Material 减少内存占用

2. **动画状态管理**:
   - 圆点动画使用独立的动画状态管理
   - 支持动画中断和反向播放

3. **事件清理**:
   - 务必在组件卸载时调用 `dispose()` 清理事件监听器

4. **相机类型**:
   - 支持 PerspectiveCamera 和 OrthographicCamera
   - 确保传入正确的相机实例
