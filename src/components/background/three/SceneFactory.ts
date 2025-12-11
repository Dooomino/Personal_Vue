import * as THREE from 'three'
import { SceneConfig } from './SceneConfig'
import { MaterialManager } from './MaterialManager'

export class SceneFactory {
  private materialManager: MaterialManager
  
  constructor() {
    this.materialManager = new MaterialManager()
  }
  
  public createScene(config: SceneConfig): {
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    objects: Map<string, THREE.Object3D>
  } {
    // 创建基本元素
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      config.camera.fov,
      window.innerWidth / window.innerHeight,
      config.camera.near,
      config.camera.far
    )
    
    const renderer = new THREE.WebGLRenderer({
      antialias: config.renderer.antialias,
      alpha: config.renderer.alpha
    })
    
    renderer.setClearColor(config.renderer.clearColor, config.renderer.clearAlpha)
    renderer.setSize(window.innerWidth, window.innerHeight)
    
    camera.position.set(...config.camera.position)
    camera.lookAt(...config.camera.lookAt)
    
    // 创建灯光
    this.createLights(scene, config.lights)
    
    // 创建对象
    const objects = this.createObjects(scene, config.objects)
    
    return { scene, camera, renderer, objects }
  }
  
  private createLights(scene: THREE.Scene, lightsConfig: SceneConfig['lights']): void {
    lightsConfig.forEach(lightConfig => {
      switch (lightConfig.type) {
        case 'ambient':
          const ambientLight = new THREE.AmbientLight(
            lightConfig.color,
            lightConfig.intensity
          )
          scene.add(ambientLight)
          break
          
        case 'directional':
          const directionalLight = new THREE.DirectionalLight(
            lightConfig.color,
            lightConfig.intensity
          )
          
          if (lightConfig.position) {
            directionalLight.position.set(...lightConfig.position)
          }
          
          directionalLight.castShadow = true
          directionalLight.target.position.set(0, 0, 0)
          scene.add(directionalLight)
          scene.add(directionalLight.target)
          break
      }
    })
  }
  
  private createObjects(
    scene: THREE.Scene,
    objectsConfig: SceneConfig['objects']
  ): Map<string, THREE.Object3D> {
    const objects = new Map<string, THREE.Object3D>()
    
    objectsConfig.forEach((objConfig, index) => {
      let geometry: THREE.BufferGeometry
      let material: THREE.Material
      
      // 创建几何体
      switch (objConfig.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(...objConfig.size)
          break
        case 'plane':
          geometry = new THREE.PlaneGeometry(objConfig.size[0], objConfig.size[1])
          break
        default:
          throw new Error(`Unsupported object type: ${objConfig.type}`)
      }
      
      // 创建材质
      if (objConfig.texture) {
        switch (objConfig.material) {
          case 'phong':
            material = this.materialManager.createBoxMaterial(
              objConfig.texture.url,
              objConfig.texture.repeat
            )
            break
          case 'basic':
          default:
            material = new THREE.MeshBasicMaterial({ 
              map: this.materialManager.createRepeatTexture(
                objConfig.texture.url,
                objConfig.texture.repeat
              ) 
            })
            break
        }
      } else {
        material = new THREE.MeshBasicMaterial({ color: 0xcccccc })
      }
      
      // 创建网格
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...objConfig.position)
      mesh.scale.set(...objConfig.scale)
      
      if (objConfig.rotation) {
        mesh.rotation.set(...objConfig.rotation)
      }
      
      scene.add(mesh)
      objects.set(`object_${index}`, mesh)
    })
    
    return objects
  }
}