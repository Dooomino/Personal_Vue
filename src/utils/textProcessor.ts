export class TextProcessor {
  private ctx: CanvasRenderingContext2D;
  private cache = new Map<string, number>();

  constructor(font: string) {
    const canvas = document.createElement('canvas');
    this.ctx = canvas.getContext('2d')!;
    this.ctx.font = font;
  }

  measure(text: string): number {
    if (this.cache.has(text)) return this.cache.get(text)!;
    const w = this.ctx.measureText(text).width;
    this.cache.set(text, w);
    return w;
  }
}
