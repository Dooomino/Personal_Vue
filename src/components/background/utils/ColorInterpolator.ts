import * as THREE from 'three';

export class ColorInterpolator {
  // Easing functions
  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeInCubic(t: number): number {
    return t * t * t;
  }

  static easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  static interpolateColors(
    fromColor: THREE.Color,
    toColor: THREE.Color,
    progress: number,
    targetColor: THREE.Color,
    easingFunction?: (t: number) => number
  ): void {
    // 确保 progress 在 0-1 范围内
    progress = Math.max(0, Math.min(1, progress));

    // 如果提供了缓动函数，则应用它
    if (easingFunction) {
      progress = easingFunction(progress);
    }

    // 使用 THREE.Color.prototype.lerp 方法进行插值
    targetColor.copy(fromColor).lerp(toColor, progress);
  }

  static areColorsAlmostEqual(color1: THREE.Color, color2: THREE.Color, threshold: number = 0.001): boolean {
    const delta = Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
    );
    return delta < threshold;
  }

  static calculateProgress(startTime: number, currentTime: number, duration: number): number {
    const elapsed = (currentTime - startTime) / 1000; // 转换为秒
    return Math.min(elapsed / duration, 1.0);
  }

  // 新增方法：使用指定的缓动函数计算进度
  static calculateProgressWithEasing(
    startTime: number,
    currentTime: number,
    duration: number,
    easingFunction: (t: number) => number,
    max?: number
  ): number {
    const progress = ColorInterpolator.calculateProgress(startTime, currentTime, duration);
    if (max) {
      return Math.min(easingFunction(progress), max);
    }
    return easingFunction(progress);
  }
}
