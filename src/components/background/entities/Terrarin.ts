import * as THREE from 'three';
import WireShader  from '../shaders/wires.ts';
import { TextureGenerator } from '../utils/TextureGenerator.ts';

// 简单的Perlin Noise实现
class SimplexNoise {
  private perm: Uint8Array;

  constructor(seed?: number) {
    // Permutation table - 随机排列的数字表
    const PERLIN_YWRAPB = 4;
    const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
    const PERLIN_ZWRAPB = 8;
    const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
    const PERLIN_SIZE = 4095;

    let p = new Uint8Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      p[i] = Math.floor(Math.random() * 255);
    }

    // 如果提供了种子，则重新初始化以确保可重现的结果
    if (seed !== undefined) {
      // 重置随机数生成器以确保可重现的结果
      let random = this.srandom(seed);
      p = new Uint8Array(PERLIN_SIZE + 1);
      for (let i = 0; i < PERLIN_SIZE + 1; i++) {
        p[i] = Math.floor(random() * 255);
      }
    }

    // 创建双倍长度的排列数组
    this.perm = new Uint8Array(PERLIN_SIZE * 2 + 2);
    for (let i = 0; i < PERLIN_SIZE * 2 + 2; i++) {
      this.perm[i] = p[i % PERLIN_SIZE];
    }
  }

  // 简单的随机数生成器，使用种子
  private srandom(seed: number) {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  noise(x: number, y: number = 0, z: number = 0): number {
    if (!arguments.length) {
      return 0.5;
    }

    // 柏林噪声实现
    const PERLIN_N = 0x1000;
    const PERLIN_B = 0x40;
    const PERLIN_BM = 0xFF;

    let X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    if (X < 0) X--;
    if (Y < 0) Y--;
    if (Z < 0) Z--;

    x -= X;
    y -= Y;
    z -= Z;

    // 缓和曲线: 6t^5 - 15t^4 + 10t^3
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // 哈希坐标以获取梯度
    X = X & PERLIN_BM;
    Y = Y & PERLIN_BM;
    Z = Z & PERLIN_BM;

    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;

    // 加权梯度
    const g1 = this.grad(this.perm[AA], x, y, z);
    const g2 = this.grad(this.perm[BA], x - 1, y, z);
    const g3 = this.grad(this.perm[AB], x, y - 1, z);
    const g4 = this.grad(this.perm[BB], x - 1, y - 1, z);
    const g5 = this.grad(this.perm[AA + 1], x, y, z - 1);
    const g6 = this.grad(this.perm[BA + 1], x - 1, y, z - 1);
    const g7 = this.grad(this.perm[AB + 1], x, y - 1, z - 1);
    const g8 = this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1);

    // 插值
    const a = this.lerp(g1, g2, u);
    const b = this.lerp(g3, g4, u);
    const c = this.lerp(g5, g6, u);
    const d = this.lerp(g7, g8, u);

    const aa = this.lerp(a, b, v);
    const ba = this.lerp(c, d, v);

    return this.lerp(aa, ba, w);
  }

  // 分形布朗运动 (Fractal Brownian Motion)
  public noiseDetail(lod: number, falloff: number, x: number, y: number = 0, z: number = 0): number {
    let value = 0;
    let frequency = 1;
    let amplitude = 0.5;

    for (let i = 0; i < lod; i++) {
      value += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      frequency *= 2;
      amplitude *= falloff;
    }

    return value;
  }

  private fade(t: number): number {
    // 6t^5 - 15t^4 + 10t^3
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    // Convert low 4 bits of hash code into 12 gradient directions
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

// 地形生成配置接口 - 只保留Perlin Noise相关参数
interface TerrainConfig {
  // Perlin Noise 参数
  usePerlinNoise: boolean;        // 是否使用Perlin Noise
  perlinScale: number;            // Perlin Noise缩放系数
  perlinAmplitude: number;        // Perlin Noise振幅
  perlinOctaves: number;          // Perlin Noise八度数
  perlinPersistence: number;      // Perlin Noise持久度 (通常为0.5)
  perlinSeed?: number;            // Perlin Noise种子
}

// 默认配置 - 只保留Perlin Noise相关配置
const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  // Perlin Noise 默认配置
  usePerlinNoise: true,
  perlinScale: 0.1,
  perlinAmplitude: 0.1,
  perlinOctaves: 4,
  perlinPersistence: 0.5,
};

export class Terrarin {
  width: number;
  maxDepth: number;
  resolution: Array<number>;
  mesh: THREE.Mesh;
  mask: TextureGenerator;
  startCount: boolean = false;

  private config: TerrainConfig;  // 添加配置对象
  private perlinNoise: SimplexNoise; // 添加Perlin Noise实例
  private baseGeometry: THREE.BufferGeometry; // 保存基础几何体引用
  private originalPositions: Float32Array; // 保存原始地形位置
  private flatPositions: Float32Array; // 保存平面位置

  constructor(width: number, maxDepth: number, resolution: Array<number>, config?: Partial<TerrainConfig>) {
    this.width = width;
    this.maxDepth = maxDepth;
    this.resolution = resolution;
    this.config = { ...DEFAULT_TERRAIN_CONFIG, ...config };  // 合并配置

    // 初始化Perlin Noise实例
    this.perlinNoise = new SimplexNoise(this.config.perlinSeed);

    // 生成随机地形高度数据
    const grid = this.generateRandomTerrain();

    // 创建平面网格作为变形目标
    const planeGrid = this.createFlatGrid();

    this.originalPositions = new Float32Array(this.width * this.width * 3);
    this.flatPositions = new Float32Array(this.width * this.width * 3);

    this.calculateGridVertices(this.originalPositions, grid);
    this.calculateGridVertices(this.flatPositions, planeGrid);

    this.baseGeometry = this.createBaseGeometry();
    this.genUv(this.baseGeometry)
    this.baseGeometry.computeVertexNormals();

    const texGen = new TextureGenerator(320,320);
    // texGen.generateVoronii();
    texGen.generatePerlinNoise();
    const texture = texGen.getTexture();
    this.mask = texGen
    // const material = new THREE.MeshPhongMaterial({
    //   color: 0xffffff, // 纯白色
    //   emissive: 0xffffff,
    //   emissiveIntensity: 0.5,
    //   wireframe: true, // 保留线框模式
    //   side: THREE.DoubleSide, // 双面渲染
    //   morphTargets: false // 不使用 Morph Targets，直接操作顶点
    // });

    const material = new THREE.ShaderMaterial({
      uniforms: {
        ...WireShader.uniforms,
      },
      vertexShader: WireShader.vertexShader,
      fragmentShader: WireShader.fragmentShader,
      wireframe: true,
      side: THREE.DoubleSide,
      transparent: true,
    })

    const solidMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...WireShader.uniforms,
      },
      vertexShader: WireShader.vertexShader,
      fragmentShader: WireShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    })
    material.uniforms.tMask.value = texture;
    material.uniforms.inverse.value = 1.0;
    setTimeout(() => {
      material.uniforms.maxDepth.value = this.maxDepth;
      this.startCount = true;
    }, 3500);

    this.baseGeometry.addGroup(0, Infinity, 0);
    this.baseGeometry.addGroup(0, Infinity, 1);
    this.mesh = new THREE.Mesh(this.baseGeometry, [material,solidMaterial]);
    // this.mesh = new THREE.Mesh(this.baseGeometry, material);
  }
  updateUniforms(): void {
    if (this.startCount) {
      WireShader.uniforms.timer.value = performance.now() / 1000;
    }
  }
  // 创建基础几何体
  private createBaseGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // 设置顶点位置为平面（初始状态）
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.flatPositions), 3));

    // 生成索引数组，创建三角形面片
    const indices = [];
    for (let i = 0; i < this.width - 1; i++) {
      for (let j = 0; j < this.width - 1; j++) {
        // 定义两个三角形组成一个四边形面片
        const topLeft = i * this.width + j;
        const topRight = i * this.width + (j + 1);
        const bottomLeft = (i + 1) * this.width + j;
        const bottomRight = (i + 1) * this.width + (j + 1);

        // 第一个三角形: 左上 -> 右上 -> 左下
        indices.push(topLeft, topRight, bottomLeft);

        // 第二个三角形: 右上 -> 右下 -> 左下
        indices.push(topRight, bottomRight, bottomLeft);
      }
    }

    // 设置几何体索引
    geometry.setIndex(indices);

    // 计算法线和边界框
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    return geometry;
  }

  // 创建平面网格数据
  private createFlatGrid(): Array<Array<number>> {
    return Array.from({ length: this.width }, () =>
      Array.from({ length: this.width }, () => 0)
    );
  }

  // 使用 Perlin Noise 生成随机地形
  generateRandomTerrain(): Array<Array<number>> {
    // 初始化网格，所有值为 0
    const grid = Array.from({ length: this.width }, () =>
      Array.from({ length: this.width }, () => 0)
    );

    // 使用Perlin Noise生成地形
    for (let y = 0; y < this.width; y++) {
      for (let x = 0; x < this.width; x++) {
        // 应用Perlin Noise
        const perlinValue = this.applyPerlinNoise(x, y);
        const hw = this.width / 2;
        const maxDist = Math.sqrt(hw*hw + hw*hw);
        let centerFactor = 1 - Math.atan(Math.sqrt(Math.pow(x-hw,2) + Math.pow(y-hw,2)) / maxDist * 2)
        // 正态分布
        centerFactor = centerFactor * Math.exp(-Math.pow(x-hw,2) / (2 * Math.pow(hw,2)));
        centerFactor = centerFactor * 0.8;
        // 将Perlin Noise值转换到[0, maxDepth]范围内
        // grid[y][x] += this.perlinNoise.noiseDetail(x, y, grid[y][x]);
        const noise = perlinValue + 1
        grid[y][x] = noise * this.maxDepth  * centerFactor; // 将[-1,1]范围转换到[0,maxDepth]
        grid[y][x] = Math.max(0, Math.min(this.maxDepth,grid[y][x]));
      }
    }

    return grid;
  }

  /**
   * 应用Perlin Noise到指定坐标
   */
  private applyPerlinNoise(x: number, y: number): number {
    let value = 0;
    let amplitude = this.config.perlinAmplitude;
    let frequency = this.config.perlinScale;
    let maxValue = 0; // Track maximum possible value for normalization

    for (let i = 0; i < this.config.perlinOctaves; i++) {
      value += this.perlinNoise.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;

      amplitude *= this.config.perlinPersistence;
      frequency *= 2;
    }

    // 归一化到 [-1, 1] 范围
    value /= maxValue;

    return value;
  }

  calculateGridVertices(vertices: Float32Array, grid: Array<Array<number>>): Float32Array {
    // 计算网格顶点
    const offset = this.width % 2 === 1 ? 0 : 0.5;
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.width; j++) {
        const index = (i * this.width + j) * 3;
        vertices[index] = i - this.width / 2 + offset;     // x坐标，居中处理
        vertices[index + 1] = grid[i][j]; // y坐标，从grid获取高度
        vertices[index + 2] = j - this.width / 2 + offset; // z坐标，居中处理
      }
    }
    return vertices;
  }

  // 用于设置变形影响的公共方法，支持基于高度的延迟动画
  setMorphInfluenceWithDelay(animationProgress: number = 1.0, maxHeight: number = this.maxDepth) {
    if (!this.mesh || !this.baseGeometry) {
      return;
    }

    // 获取地形网格数据，用于计算每个顶点的延迟
    const positionAttr = this.baseGeometry.getAttribute('position');

    if (!positionAttr) {
      return;
    }

    // 创建一个新的attribute来存储动画进度
    const animatedPositions = new Float32Array(positionAttr.count * 3);

    // 根据高度设置每个顶点的动画进度
    for (let i = 0; i < positionAttr.count; i++) {
      const baseY = this.originalPositions[i * 3 + 1]; // 顶点的目标Y值（地形高度）
      const flatY = this.flatPositions[i * 3 + 1];    // 顶点的平面Y值（0）

      // 计算延迟：高度越高，延迟越小（越早开始动画）
      // 我们将高度归一化到[0,1]区间，然后应用延迟公式
      const normalizedHeight = Math.abs(baseY) / maxHeight;
      const delayFactor = 1 - normalizedHeight; // 高度越高，delayFactor越小

      // 计算该顶点的动画进度，受高度影响
      // 高的地方先变化，低的地方后变化
      let vertexProgress = 0;
      if (delayFactor <= animationProgress) {
        // 如果动画进度超过了该顶点的延迟，计算它的具体进度
        vertexProgress = Math.min(1, (animationProgress - delayFactor) / (1 - delayFactor));
      }

      // 计算插值后的顶点位置
      const interpolatedY = flatY + (baseY - flatY) * vertexProgress;

      // 设置新位置
      animatedPositions[i * 3] = this.originalPositions[i * 3]; // X坐标不变
      animatedPositions[i * 3 + 1] = interpolatedY;            // Y坐标插值
      animatedPositions[i * 3 + 2] = this.originalPositions[i * 3 + 2]; // Z坐标不变
    }

    // 更新几何体的顶点位置
    this.baseGeometry.setAttribute('position', new THREE.BufferAttribute(animatedPositions, 3));
    this.baseGeometry.attributes.position.needsUpdate = true;
  }

  // 用于设置变形影响的公共方法，支持统一影响值
  setMorphInfluence(value: number) {
    if (!this.mesh || !this.baseGeometry) {
      return;
    }

    const positionAttr = this.baseGeometry.getAttribute('position');
    if (!positionAttr) {
      return;
    }

    const animatedPositions = new Float32Array(positionAttr.count * 3);

    for (let i = 0; i < positionAttr.count; i++) {
      const baseY = this.originalPositions[i * 3 + 1];
      const flatY = this.flatPositions[i * 3 + 1];

      const interpolatedY = flatY + (baseY - flatY) * value;

      animatedPositions[i * 3] = this.originalPositions[i * 3];
      animatedPositions[i * 3 + 1] = interpolatedY;
      animatedPositions[i * 3 + 2] = this.originalPositions[i * 3 + 2];
    }

    this.baseGeometry.setAttribute('position', new THREE.BufferAttribute(animatedPositions, 3));
    this.baseGeometry.attributes.position.needsUpdate = true;
  }

  genUv(geo: THREE.BufferGeometry){
    // 获取顶点位置数据
    const positionAttribute = geo.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;

    // 创建UV数组 - 每个顶点对应2个UV坐标
    const uvArray = new Float32Array(positions.length * 2 / 3);

    // 获取几何体的边界框来计算UV坐标的归一化范围
    geo.computeBoundingBox();
    const boundingBox = geo.boundingBox!;

    const minX = boundingBox.min.x;
    const maxX = boundingBox.max.x;
    const minZ = boundingBox.min.z;
    const maxZ = boundingBox.max.z;

    const width = maxX - minX;
    const depth = maxZ - minZ;

    // 为每个顶点计算UV坐标
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];

      // 将世界坐标转换为[0,1]范围的UV坐标
      const u = width > 0 ? (x - minX) / width : 0;
      const v = depth > 0 ? (z - minZ) / depth : 0;

      // UV坐标存储在数组中的位置
      const uvIndex = (i / 3) * 2;
      uvArray[uvIndex] = u;     // U coordinate
      uvArray[uvIndex + 1] = v; // V coordinate
    }

    // 设置UV属性
    geo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

    // 标记UV数据需要更新
    geo.attributes.uv.needsUpdate = true;
  }

  // 旧的calcGrid方法保留在这里以防需要
  calcGrid(grid: Array<Array<number>>): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();

    // 创建顶点数组
    const vertices = new Float32Array(this.width * this.width * 3);
    this.calculateGridVertices(vertices, grid);

    // 设置顶点位置
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // 生成索引数组，创建三角形面片
    const indices = [];
    for (let i = 0; i < this.width - 1; i++) {
      for (let j = 0; j < this.width - 1; j++) {
        // 定义两个三角形组成一个四边形面片
        const topLeft = i * this.width + j;
        const topRight = i * this.width + (j + 1);
        const bottomLeft = (i + 1) * this.width + j;
        const bottomRight = (i + 1) * this.width + (j + 1);

        // 第一个三角形: 左上 -> 右上 -> 左下
        indices.push(topLeft, topRight, bottomLeft);

        // 第二个三角形: 右上 -> 右下 -> 左下
        indices.push(topRight, bottomRight, bottomLeft);
      }
    }

    // 设置几何体索引
    geometry.setIndex(indices);

    // 计算法线和边界框
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    const material = new THREE.MeshPhongMaterial({
      color: 0xfff, // 改为白色
      emissive: 0xfff,
      emissiveIntensity: 10.0,
      // color: 0x6495ED, // 改为海洋蓝颜色
      wireframe: true, // 关闭线框模式，显示实体
      side: THREE.DoubleSide // 双面渲染
    });

    const mesh = new THREE.Mesh(geometry, material);
    // this.mesh = mesh;
    return mesh;
  }
  setMesh(mesh: THREE.Mesh) {
    this.mesh = mesh;
  }
  getMesh(): THREE.Mesh {
    return this.mesh;
  }
}
