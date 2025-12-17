import * as THREE from 'three'

export class ColorSwitcher{
  private darkColor: THREE.Color
  private lightColor: THREE.Color
  public currentColor: THREE.Color

  constructor(color1: THREE.Color, color2: THREE.Color,isDarkMode: boolean) {
    this.darkColor = color1 // 暗色主题背景
    this.lightColor = color2 // 亮色主题背景
    this.currentColor = isDarkMode ? this.darkColor : this.lightColor
  }
  switchColor(isDarkMode: boolean): void {
    this.currentColor = isDarkMode ? this.darkColor : this.lightColor
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
  constructor(public name: string,isDarkMode: boolean) {
    this.isDarkMode = isDarkMode
    this.stage = new THREE.Object3D()
    this.stage.name = name
  }
  addColorPair(name: string, color1:number, color2: number): void {
    const darkColor = new THREE.Color(color1)
    const lightColor = new THREE.Color(color2)
    this.colors[name] = new ColorSwitcher(darkColor, lightColor,this.isDarkMode)
  }
  add(object: THREE.Object3D,name?: string ): void {
    if(name){
      object.name = name
    }
    this.stage.add(object)
    this.tracker?.push(object)
  }
  remove(object: THREE.Object3D): void {
    this.stage.remove(object)
    this.tracker = this.tracker?.filter(item => item !== object)
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
}