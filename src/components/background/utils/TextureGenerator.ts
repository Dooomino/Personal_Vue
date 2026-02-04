import * as THREE from 'three';

const GRAYSCALE = [
  '#000000', '#111111', '#222222', '#333333', '#444444',
  '#555555', '#666666', '#777777', '#888888', '#999999',
  '#AAAAAA', '#BBBBBB', '#CCCCCC', '#DDDDDD', '#EEEEEE',
  '#FFFFFF'
];

// Voronoi生成器类 - 封装所有Voronoi相关逻辑
class VoronoiGenerator {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  // 计算两点间距离
  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // 获取最近的种子点索引
  private getClosestPointIndex(x: number, y: number, points: Array<{x: number, y: number}>): number {
    let minDist = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < points.length; i++) {
      const dist = this.distance(x, y, points[i].x, points[i].y);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  // 获取多个最近种子点的信息用于渐变
  private getClosestPointsInfo(x: number, y: number, points: Array<{x: number, y: number}>, count: number = 3): Array<{index: number, distance: number, weight: number}> {
    const distances = points.map((point, index) => ({
      index,
      distance: this.distance(x, y, point.x, point.y)
    }));

    // 按距离排序
    distances.sort((a, b) => a.distance - b.distance);

    // 取前count个最近的点
    const closestPoints = distances.slice(0, Math.min(count, points.length));

    // 计算权重（距离越近权重越高）
    const maxDistance = closestPoints[closestPoints.length - 1]?.distance || 1;
    const weights = closestPoints.map(point => ({
      ...point,
      weight: 1 - (point.distance / maxDistance)
    }));

    // 归一化权重
    const totalWeight = weights.reduce((sum, point) => sum + point.weight, 0);
    return weights.map(point => ({
      ...point,
      weight: point.weight / totalWeight
    }));
  }

  // 根据权重混合颜色
  private blendColors(colors: Array<{color: string, weight: number}>): {r: number, g: number, b: number} {
    let r = 0, g = 0, b = 0;

    for (const {color, weight} of colors) {
      const rgb = this.hexToRgb(color);
      r += rgb.r * weight;
      g += rgb.g * weight;
      b += rgb.b * weight;
    }

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b)
    };
  }

  // 十六进制颜色转 RGB
  private hexToRgb(hex: string): {r: number, g: number, b: number} {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  }

  // 绘制 Voronoi 边界线
  private drawVoronoiBorders(
    ctx: CanvasRenderingContext2D,
    points: Array<{x: number, y: number}>,
    borderColor: string,
    borderWidth: number
  ) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    // 检查每条边是否是 Voronoi 边界
    for (let x = 0; x < this.width - 1; x++) {
      for (let y = 0; y < this.height - 1; y++) {
        // 检查水平边
        const leftPoint = this.getClosestPointIndex(x, y, points);
        const rightPoint = this.getClosestPointIndex(x + 1, y, points);

        if (leftPoint !== rightPoint) {
          ctx.beginPath();
          ctx.moveTo(x + 0.5, y);
          ctx.lineTo(x + 0.5, y + 1);
          ctx.stroke();
        }

        // 检查垂直边
        const topPoint = this.getClosestPointIndex(x, y, points);
        const bottomPoint = this.getClosestPointIndex(x, y + 1, points);

        if (topPoint !== bottomPoint) {
          ctx.beginPath();
          ctx.moveTo(x, y + 0.5);
          ctx.lineTo(x + 1, y + 0.5);
          ctx.stroke();
        }
      }
    }
  }

  // 生成Voronoi纹理的主要方法
  generateTexture(canvas: HTMLCanvasElement, options?: {
    pointCount?: number;
    colors?: string[];
    drawBorders?: boolean;
    borderColor?: string;
    borderWidth?: number;
  }) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // 默认配置
    const config = {
      pointCount: options?.pointCount || 30,
      colors: options?.colors || GRAYSCALE,
      drawBorders: options?.drawBorders ?? false,
      borderColor: options?.borderColor || '#000000',
      borderWidth: options?.borderWidth || 1
    };

    // 生成随机种子点
    const seedPoints = Array.from({ length: config.pointCount }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height
    }));

    // 为每个种子点分配颜色
    const pointColors = seedPoints.map((_, index) =>
      config.colors[index % config.colors.length]
    );

    // 清空画布
    ctx.clearRect(0, 0, this.width, this.height);

    // 绘制 Voronoi 区域
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    // 逐像素计算最近的种子点并着色（改为渐变样式）
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pixelIndex = (y * this.width + x) * 4;

        // 获取多个最近的种子点信息
        const closestPoints = this.getClosestPointsInfo(x, y, seedPoints, 3);

        // 准备颜色和权重数组
        const colorWeights = closestPoints.map(point => ({
          color: pointColors[point.index],
          weight: point.weight
        }));

        // 混合颜色
        const blendedColor = this.blendColors(colorWeights);

        // 设置像素颜色
        data[pixelIndex] = blendedColor.r;     // Red
        data[pixelIndex + 1] = blendedColor.g; // Green
        data[pixelIndex + 2] = blendedColor.b; // Blue
        data[pixelIndex + 3] = 255;            // Alpha
      }
    }

    // 将图像数据绘制到画布
    ctx.putImageData(imageData, 0, 0);

    // 绘制边界线（可选）
    if (config.drawBorders) {
      this.drawVoronoiBorders(ctx, seedPoints, config.borderColor, config.borderWidth);
    }

    return canvas;
  }
}

// perlin noise生成器类
class PerlinNoiseGenerator {
  private width: number;
  private height: number;
  private permutation: number[];

  // Perlin噪声配置接口
  public static readonly Config = {
    enabled: true,
    scale: 0.01,
    amplitude: 1.0,
    octaves: 4,
    persistence: 0.5,
    seed: 12345,
    // 颜色映射配置
    colorMapping: {
      useColor: true,
      colorLow: '#000000',
      colorHigh: '#ffffff',
      grayscale: false
    }
  };

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.permutation = this.generatePermutation(PerlinNoiseGenerator.Config.seed);
  }

  // 生成置换数组
  private generatePermutation(seed: number): number[] {
    // 使用种子初始化随机数生成器
    const random = this.seededRandom(seed);

    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // 洗牌算法
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // 复制数组以避免边界检查
    return p.concat(p);
  }

  // 带种子的随机数生成器
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }

  // 渐变哈希函数
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // 平滑插值函数
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // 线性插值
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  // 生成单层Perlin噪声值
  private noise(x: number, y: number): number {
    // 单元格坐标
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // 单元格内坐标
    x -= Math.floor(x);
    y -= Math.floor(y);

    // 平滑插值
    const u = this.fade(x);
    const v = this.fade(y);

    // 获取四个角的梯度值
    const a = this.permutation[X] + Y;
    const b = this.permutation[X + 1] + Y;

    // 双线性插值
    return this.lerp(
      this.lerp(
        this.grad(this.permutation[a], x, y),
        this.grad(this.permutation[b], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.permutation[a + 1], x, y - 1),
        this.grad(this.permutation[b + 1], x - 1, y - 1),
        u
      ),
      v
    );
  }

  // 生成分形布朗运动(FBM)噪声
  private fbmNoise(x: number, y: number, octaves: number, persistence: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }

  // 十六进制颜色转RGB
  private hexToRgb(hex: string): {r: number, g: number, b: number} {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  }

  // RGB转十六进制颜色
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // 根据噪声值映射颜色
  private mapNoiseToColor(noiseValue: number, config: typeof PerlinNoiseGenerator.Config): string {
    const normalized = (noiseValue + 1) / 2; // 将[-1,1]映射到[0,1]

    if (config.colorMapping.grayscale) {
      const gray = Math.round(normalized * 255);
      return this.rgbToHex(gray, gray, gray);
    }

    if (config.colorMapping.useColor) {
      const lowRgb = this.hexToRgb(config.colorMapping.colorLow);
      const highRgb = this.hexToRgb(config.colorMapping.colorHigh);

      const r = Math.round(lowRgb.r + (highRgb.r - lowRgb.r) * normalized);
      const g = Math.round(lowRgb.g + (highRgb.g - lowRgb.g) * normalized);
      const b = Math.round(lowRgb.b + (highRgb.b - lowRgb.b) * normalized);

      return this.rgbToHex(r, g, b);
    }

    // 默认返回灰度值
    const gray = Math.round(normalized * 255);
    return this.rgbToHex(gray, gray, gray);
  }

  // 更新配置
  public updateConfig(newConfig: Partial<typeof PerlinNoiseGenerator.Config>): void {
    Object.assign(PerlinNoiseGenerator.Config, newConfig);
    // 如果种子改变，重新生成置换数组
    if (newConfig.seed !== undefined) {
      this.permutation = this.generatePermutation(PerlinNoiseGenerator.Config.seed);
    }
  }

  // 生成Perlin噪声纹理
  generateTexture(canvas: HTMLCanvasElement, options?: Partial<typeof PerlinNoiseGenerator.Config>) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // 合并配置
    const config = { ...PerlinNoiseGenerator.Config, ...options };

    // 清空画布
    ctx.clearRect(0, 0, this.width, this.height);

    // 创建图像数据
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    // 逐像素生成噪声值
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pixelIndex = (y * this.width + x) * 4;

        // 计算噪声坐标
        const nx = x * config.scale;
        const ny = y * config.scale;

        // 生成FBM噪声值
        const noiseValue = this.fbmNoise(nx, ny, config.octaves, config.persistence);

        // 应用振幅
        const finalValue = noiseValue * config.amplitude;

        // 映射到颜色
        const color = this.mapNoiseToColor(finalValue, config);
        const rgb = this.hexToRgb(color);

        // 设置像素颜色
        data[pixelIndex] = rgb.r;     // Red
        data[pixelIndex + 1] = rgb.g; // Green
        data[pixelIndex + 2] = rgb.b; // Blue
        data[pixelIndex + 3] = 255;   // Alpha
      }
    }

    // 将图像数据绘制到画布
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }
}

export class TextureGenerator {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  private voronoiGenerator: VoronoiGenerator;
  private perlinGenerator: PerlinNoiseGenerator;

  constructor(width: number, height: number){
    this.canvas = document.createElement('canvas');
    const canvas = this.canvas;
    canvas.width = width;
    canvas.height = height;
    this.width = width;
    this.height = height;
    this.voronoiGenerator = new VoronoiGenerator(width, height);
    this.perlinGenerator = new PerlinNoiseGenerator(width, height);
  }

  generateVoronii(options?: {
    pointCount?: number;
    colors?: string[];
    drawBorders?: boolean;
    borderColor?: string;
    borderWidth?: number;
  }){
    this.voronoiGenerator.generateTexture(this.canvas, options);
    return this;
  }

  // 生成简单的棋盘格纹理
  generateCheckerboard(cellSize: number = 20, color1: string = '#ffffff', color2: string = '#000000') {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const cols = Math.ceil(this.width / cellSize);
    const rows = Math.ceil(this.height / cellSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color = (row + col) % 2 === 0 ? color1 : color2;
        ctx.fillStyle = color;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    return this;
  }

  // 生成渐变纹理
  generateGradient(startColor: string = '#ff0000', endColor: string = '#0000ff', direction: 'horizontal' | 'vertical' = 'horizontal') {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const gradient = direction === 'horizontal'
      ? ctx.createLinearGradient(0, 0, this.width, 0)
      : ctx.createLinearGradient(0, 0, 0, this.height);

    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    return this;
  }

  // 生成Perlin噪声纹理
  generatePerlinNoise(options?: Partial<typeof PerlinNoiseGenerator.Config>){
    this.perlinGenerator.generateTexture(this.canvas, options);
    return this;
  }

  // 更新Perlin噪声配置
  updatePerlinConfig(newConfig: Partial<typeof PerlinNoiseGenerator.Config>): void {
    this.perlinGenerator.updateConfig(newConfig);
  }

  // 获取Perlin噪声配置
  getPerlinConfig(): typeof PerlinNoiseGenerator.Config {
    return PerlinNoiseGenerator.Config;
  }

  // 获取图像数据 URL
  getImage(): string {
    return this.canvas.toDataURL();
  }

  // 获取 Three.js 纹理
  getTexture(): THREE.Texture {
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.needsUpdate = true;
    return texture;
  }
}
