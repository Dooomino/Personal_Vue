import * as THREE from 'three';

/**
 * 悬浮配置接口
 */
export interface HoverConfig {
  onEnter?: (mesh: THREE.Mesh) => void;   // 鼠标进入时触发
  onLeave?: (mesh: THREE.Mesh) => void;   // 鼠标离开时触发
  onHover?: (mesh: THREE.Mesh, distance: number, point?: THREE.Vector3) => void; // 持续悬浮时触发（包含交点坐标）
  onClick?: (mesh: THREE.Mesh, point?: THREE.Vector3) => void; // 点击事件
  threshold?: number;  // 触发距离阈值（默认 1.0）
  leaveDelay?: number;        // 鼠标离开后的延迟时间（毫秒），默认 200ms
  detectionRadius?: number;   // 额外的检测半径扩展，默认 0.5
}

/**
 * 注册的 Mesh 信息
 */
interface RegisteredMesh {
  mesh: THREE.Mesh;
  config: HoverConfig;
  isHovered: boolean;
  leaveTimer?: number;  // 离开延迟定时器
  detectionSphere?: THREE.Mesh;  // 用于扩大检测区域的球体（不可见）
}

/**
 * Three.js 鼠标悬浮监听管理器
 * 提供模块化的悬浮检测功能，支持为任意 Mesh 注册悬浮回调
 */
export class HoverManager {
  private registeredMeshes: Map<THREE.Mesh, RegisteredMesh> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private canvas: HTMLCanvasElement;
  private camera: THREE.Camera;
  private onMouseMove: (event: MouseEvent) => void;
  private onMouseClick: (event: MouseEvent) => void;

  /**
   * 创建悬浮管理器
   * @param camera - 用于射线检测的相机
   * @param canvas - Canvas 元素，用于监听鼠标事件
   */
  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.canvas = canvas;
    this.camera = camera;

    // 绑定鼠标移动事件
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.canvas.addEventListener('mousemove', this.onMouseMove);

    // 绑定鼠标点击事件
    this.onMouseClick = this.handleClick.bind(this);
    this.canvas.addEventListener('click', this.onMouseClick);
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();

    // 计算归一化设备坐标 (NDC)
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  }

  /**
   * 处理鼠标点击事件
   */
  private handleClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.registeredMeshes.values());
    const detectionObjects = meshes.map(m => m.detectionSphere || m.mesh);
    const intersects = this.raycaster.intersectObjects(detectionObjects, false);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const registered = meshes.find(m =>
        m.detectionSphere === intersect.object || m.mesh === intersect.object
      );
      if (registered && registered.config.onClick) {
        registered.config.onClick(registered.mesh, intersect.point);
      }
    }
  }

  /**
   * 注册 Mesh 的悬浮监听
   * @param mesh - 要监听的 Mesh
   * @param config - 悬浮配置（回调函数和阈值）
   */
  register(mesh: THREE.Mesh, config: HoverConfig): void {
    let detectionSphere: THREE.Mesh | undefined;

    // 如果设置了检测半径扩展，创建一个更大的不可见球体用于检测
    const detectionRadius = config.detectionRadius ?? 0;
    if (detectionRadius > 0) {
      // 获取原始几何体的边界球
      const boundingSphere = new THREE.Sphere();
      mesh.geometry.computeBoundingSphere();
      if (mesh.geometry.boundingSphere) {
        boundingSphere.copy(mesh.geometry.boundingSphere);
      }

      // 创建扩大的检测球体
      const expandedRadius = boundingSphere.radius + detectionRadius;
      const sphereGeometry = new THREE.SphereGeometry(expandedRadius, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        visible: false,  // 不可见
        transparent: true,
        opacity: 0
      });
      detectionSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      detectionSphere.position.copy(mesh.position);
      detectionSphere.scale.copy(mesh.scale);

      // 将检测球体添加到原始 mesh 的父级场景中
      if (mesh.parent) {
        mesh.parent.add(detectionSphere);
      }
    }

    this.registeredMeshes.set(mesh, {
      mesh,
      config: {
        threshold: config.threshold ?? 1.0,
        onEnter: config.onEnter,
        onLeave: config.onLeave,
        onHover: config.onHover,
        onClick: config.onClick,
        leaveDelay: config.leaveDelay,
        detectionRadius
      },
      isHovered: false,
      detectionSphere
    });
  }

  /**
   * 注销 Mesh 的悬浮监听
   * @param mesh - 要注销的 Mesh
   */
  unregister(mesh: THREE.Mesh): void {
    const registered = this.registeredMeshes.get(mesh);
    if (registered) {
      if (registered.isHovered) {
        // 如果当前处于悬浮状态，触发 onLeave
        registered.config.onLeave?.(mesh);
      }
      // 清理检测球体
      if (registered.detectionSphere) {
        // 从场景中移除
        if (registered.detectionSphere.parent) {
          registered.detectionSphere.parent.remove(registered.detectionSphere);
        }
        registered.detectionSphere.geometry.dispose();
        (registered.detectionSphere.material as THREE.Material).dispose();
      }
    }
    this.registeredMeshes.delete(mesh);
  }

  /**
   * 更新悬浮状态（应在每帧渲染前调用）
   * @param camera - 当前使用的相机
   */
  update(camera: THREE.Camera): void {
    // 设置射线
    this.raycaster.setFromCamera(this.mouse, camera);

    // 获取所有注册的 Mesh
    const meshes = Array.from(this.registeredMeshes.values());

    // 为每个 Mesh 选择合适的检测对象（如果有检测球体则使用它）
    const detectionObjects = meshes.map(m => m.detectionSphere || m.mesh);

    // 进行射线检测
    const intersects = this.raycaster.intersectObjects(
      detectionObjects,
      false
    );

    // 创建 intersected Mesh 的集合（映射回原始 Mesh）
    const intersectedMeshes = new Set<THREE.Mesh>();
    for (const intersect of intersects) {
      // 找到对应的原始 Mesh
      const registered = meshes.find(m =>
        m.detectionSphere === intersect.object || m.mesh === intersect.object
      );
      if (registered) {
        intersectedMeshes.add(registered.mesh);
      }
    }

    // 遍历所有注册的 Mesh，更新悬浮状态
    for (const registered of meshes) {
      const { mesh, config, isHovered } = registered;
      const isIntersected = intersectedMeshes.has(mesh);

      if (isIntersected && !isHovered) {
        // 鼠标进入：清除可能的离开定时器
        if (registered.leaveTimer) {
          clearTimeout(registered.leaveTimer);
          registered.leaveTimer = undefined;
        }
        registered.isHovered = true;
        config.onEnter?.(mesh);
      } else if (!isIntersected && isHovered) {
        // 鼠标离开：设置延迟触发
        if (!registered.leaveTimer) {
          const delay = config.leaveDelay ?? 200;
          registered.leaveTimer = window.setTimeout(() => {
            registered.isHovered = false;
            registered.leaveTimer = undefined;
            config.onLeave?.(mesh);
          }, delay);
        }
      } else if (isIntersected && isHovered) {
        // 持续悬浮：清除离开定时器
        if (registered.leaveTimer) {
          clearTimeout(registered.leaveTimer);
          registered.leaveTimer = undefined;
        }
        const intersect = intersects.find(i => i.object === registered.detectionSphere || i.object === mesh);
        const distance = intersect?.distance || 0;
        const point = intersect?.point; // 射线交点的世界坐标
        config.onHover?.(mesh, distance, point);
      }
    }
  }

  /**
   * 清理资源，移除事件监听
   */
  dispose(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('click', this.onMouseClick); // 清理点击事件监听器
    // 清理所有定时器和检测球体
    for (const registered of this.registeredMeshes.values()) {
      if (registered.leaveTimer) {
        clearTimeout(registered.leaveTimer);
      }
      // 清理检测球体
      if (registered.detectionSphere) {
        // 从场景中移除
        if (registered.detectionSphere.parent) {
          registered.detectionSphere.parent.remove(registered.detectionSphere);
        }
        registered.detectionSphere.geometry.dispose();
        (registered.detectionSphere.material as THREE.Material).dispose();
      }
    }
    this.registeredMeshes.clear();
  }
}
