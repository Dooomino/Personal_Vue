import * as THREE from 'three';

export class NumericInterpolator {
  static id: number = 0;
  // 使用 Three.js 的内置插值方法
  static interpolate(fromValue: number, toValue: number, progress: number): number {
    // 确保 progress 在 0-1 范围内
    progress = Math.max(0, Math.min(1, progress));

    // 使用 THREE.MathUtils.lerp 方法进行插值
    return THREE.MathUtils.lerp(fromValue, toValue, progress);
  }

  static calculateProgress(startTime: number, currentTime: number, duration: number): number {
    const elapsed = (currentTime - startTime) / 1000; // 转换为秒
    return Math.min(elapsed / duration, 1.0);
  }

  // 创建一个随时间平滑变化的数值插值函数
  static createInterpolation(
    initialValue: number,
    targetValue: number,
    duration: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): void {
    const startTime = performance.now();
    const fromValue = initialValue;

    const interpolateStep = () => {
      const currentTime = performance.now();
      const progress = NumericInterpolator.calculateProgress(
        startTime,
        currentTime,
        duration
      );

      const currentValue = NumericInterpolator.interpolate(
        fromValue,
        targetValue,
        progress
      );

      onUpdate(currentValue);

      // 如果插值未完成，继续下一帧
      if (progress < 1.0) {
        this.id = requestAnimationFrame(interpolateStep);
      } else {
        // 确保最终值是精确的目标值
        onUpdate(targetValue);
        cancelAnimationFrame(this.id);
        console.info(`Interpolation id:${this.id}(duration:${duration}s) completed.`);
        if (onComplete) {
          onComplete();
        }
      }
    };

    // 开始插值
    interpolateStep();
  }
}