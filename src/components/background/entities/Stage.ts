import * as THREE from 'three'

export class ColorSwitcher{
  darkColor: THREE.Color
  lightColor: THREE.Color
  currentColor: THREE.Color
  targetColor: THREE.Color
  initialColor: THREE.Color
  isTransitioning: boolean = false
  transitionStartTime: number = 0
  transitionDuration: number = 300 // 过渡时间300ms

  constructor(color1: THREE.Color, color2: THREE.Color,isDarkMode: boolean) {
    this.darkColor = color1 // 暗色主题背景
    this.lightColor = color2 // 亮色主题背景
    this.currentColor = new THREE.Color(isDarkMode ? this.darkColor : this.lightColor)
    this.initialColor = new THREE.Color(this.currentColor)
    this.targetColor = new THREE.Color(this.currentColor)
  }

  switchColor(isDarkMode: boolean): void {
    // 设置目标颜色
    this.targetColor = isDarkMode ? this.darkColor : this.lightColor
    // 重置初始颜色为当前颜色
    this.initialColor.copy(this.currentColor)
    // 开始新的过渡
    this.isTransitioning = true
    this.transitionStartTime = performance.now()
  }

  updateColor(): boolean {
    if (!this.isTransitioning) return false

    const currentTime = performance.now()
    const elapsed = currentTime - this.transitionStartTime
    const progress = Math.min(elapsed / this.transitionDuration, 1)

    // 使用lerpColors方法进行颜色插值，从初始颜色到目标颜色
    this.currentColor.lerpColors(this.initialColor, this.targetColor, progress)

    // 检查是否到达目标颜色（允许小的容差值）
    const delta = Math.sqrt(
      Math.pow(this.currentColor.r - this.targetColor.r, 2) +
      Math.pow(this.currentColor.g - this.targetColor.g, 2) +
      Math.pow(this.currentColor.b - this.targetColor.b, 2)
    );

    if (progress >= 1 || delta < 0.001) {
      this.currentColor.copy(this.targetColor)
      this.isTransitioning = false
      return false // 表示过渡已完成
    }

    return true // 表示仍在过渡中
  }

  setColor(color: THREE.Color,isDarkMode: boolean): void {
    if(isDarkMode){
      this.darkColor.set(color)
    }else{
      this.lightColor.set(color)
    }
  }
  getColor(): THREE.Color {
    return this.currentColor
  }
}

export class Stage {
  isDarkMode: boolean = true
  stage: THREE.Object3D
  tracker: THREE.Object3D[] = []
  colors:{ [key:string]: ColorSwitcher} = {}
  materials: { [key: string]: THREE.Material } = {}
  constructor(public name: string,isDarkMode: boolean) {
    this.isDarkMode = isDarkMode
    this.stage = new THREE.Object3D()
    this.stage.name = name
  }
  addColorPair(name: string, dark:number, light: number): void {
    const darkColor = new THREE.Color(dark)
    const lightColor = new THREE.Color(light)
    this.colors[name] = new ColorSwitcher(darkColor, lightColor,this.isDarkMode)
  }
  getColorPair(name: string): ColorSwitcher | null {
    return this.colors[name]
  }
  add(object: THREE.Object3D,name?: string ): void {
    if(name){
      object.name = name
    }
    this.stage.add(object)
    this.tracker?.push(object)
  }
  addMaterial( material: THREE.Material, name: string): void {
    this.materials[name] = material
  }
  remove(object: THREE.Object3D): void {
    this.stage.remove(object)
    this.tracker = this.tracker?.filter(item => item !== object)
  }
  getMaterial(materialName: string): THREE.Material | null {
    return this.materials[materialName]
  }
  get(objectName: string): THREE.Object3D | null {
    // @ts-expect-error - it doesn't know about getObjectByName
    return this.stage.getObjectByName(objectName)
  }

  switchTheme(isDarkMode: boolean): void {
    this.isDarkMode = isDarkMode;
    // 更新所有颜色开关的颜色
    Object.values(this.colors).forEach(colorSwitcher => {
      colorSwitcher.switchColor(isDarkMode);
    });
  }

  updateColors(): void {
    let anyTransitioning = false;
    Object.values(this.colors).forEach(colorSwitcher => {
      if (colorSwitcher.updateColor()) {
        anyTransitioning = true;
      }
    });
  }
}
