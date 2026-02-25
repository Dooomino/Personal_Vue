import { TextureGenerator } from './TextureGenerator';

// 示例：创建一个简单的高度图网格
function createHeightMap(width: number, height: number): number[][] {
  const grid: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // 生成一些有趣的地形数据
      const distance = Math.sqrt(
        Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2)
      );
      const normalizedDistance = distance / Math.max(width, height) * 2;
      
      // 创建一个山丘形状的高度值
      const heightValue = Math.max(0, 1 - normalizedDistance);
      
      // 添加一些噪声
      const noise = (Math.sin(x * 0.3) * Math.cos(y * 0.2) + 1) * 0.1;
      
      row.push(Math.min(1, Math.max(0, heightValue + noise)));
    }
    grid.push(row);
  }
  
  return grid;
}

// 自定义颜色映射函数 - 地形配色方案
function terrainColorMap(height: number): string {
  if (height < 0.2) return '#1e40af'; // 深蓝色 - 海洋
  if (height < 0.3) return '#3b82f6'; // 蓝色 - 浅海
  if (height < 0.4) return '#fbbf24'; // 黄色 - 沙滩
  if (height < 0.6) return '#16a34a'; // 绿色 - 平原
  if (height < 0.8) return '#65a30d'; // 深绿色 - 山丘
  return '#92400e'; // 棕色 - 山峰
}

// 热力图颜色映射
function heatmapColorMap(value: number): string {
  const colors = [
    '#0000ff', // 蓝色
    '#00ffff', // 青色
    '#00ff00', // 绿色
    '#ffff00', // 黄色
    '#ff7f00', // 橙色
    '#ff0000'  // 红色
  ];
  
  const index = Math.floor(value * (colors.length - 1));
  return colors[Math.max(0, Math.min(colors.length - 1, index))];
}

// 使用示例
export function generateTerrainTexture() {
  const generator = new TextureGenerator(256, 256);
  
  // 创建高度图数据
  const heightGrid = createHeightMap(32, 32);
  
  // 生成地形纹理
  generator.generateFromGrid(heightGrid, terrainColorMap);
  
  return generator.getTexture();
}

export function generateHeatmapTexture(data: number[][]) {
  const generator = new TextureGenerator(256, 256);
  
  // 生成热力图纹理
  generator.generateFromGrid(data, heatmapColorMap);
  
  return generator.getTexture();
}

// 默认导出示例函数
export default function createGridBasedTextures() {
  console.log('Creating grid-based textures...');
  
  // 生成地形纹理
  const terrainTexture = generateTerrainTexture();
  console.log('Terrain texture created:', terrainTexture);
  
  // 生成简单的测试数据
  const testData = [
    [0.1, 0.3, 0.5, 0.7],
    [0.2, 0.4, 0.6, 0.8],
    [0.15, 0.35, 0.55, 0.75],
    [0.25, 0.45, 0.65, 0.85]
  ];
  
  // 生成热力图纹理
  const heatmapTexture = generateHeatmapTexture(testData);
  console.log('Heatmap texture created:', heatmapTexture);
  
  return { terrainTexture, heatmapTexture };
}