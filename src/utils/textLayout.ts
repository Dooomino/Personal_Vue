/**
 * 计算球体在高度 y 处的截面半径
 */
export function sphereRadiusAtY(y: number, radius: number): number {
  return Math.abs(y) >= radius ? 0 : Math.sqrt(radius * radius - y * y);
}
