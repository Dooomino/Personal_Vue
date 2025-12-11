import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import * as THREE from 'three'

type GUIController = any; // lil-gui 控制器类型

export class GuiController {
  private gui: GUI
  private config: Record<string, any>

  constructor(title: string = 'Panel') {
    this.gui = new GUI({ title })
    this.config = {}
  }

  public addColorControl(
    object: THREE.Object3D, 
    property: string, 
    initialValue: string = '#ff0000'
  ): GUIController {
    this.config[property] = initialValue
    
    return this.gui.addColor(this.config, property).onChange((value) => {
      // 如果目标对象是网格并且有材质，则更新材质颜色
      if (object instanceof THREE.Mesh && object.material) {
        const material = object.material
        if (Array.isArray(material)) {
          (material[0] as THREE.MeshBasicMaterial).color.set(value)
        } else {
          (material as THREE.MeshBasicMaterial).color.set(value)
        }
      }
    })
  }

  public addSlider(
    target: object,
    property: string,
    min: number,
    max: number,
    step: number
  ): GUIController {
    return this.gui.add(target, property, min, max, step)
  }

  public addButton(name: string, callback: () => void): GUIController {
    return this.gui.add({ [name]: callback }, name)
  }

  public destroy(): void {
    this.gui.destroy()
  }
}