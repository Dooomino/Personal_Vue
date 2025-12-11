import * as THREE from 'three'

export class MaterialManager {
  private textureLoader: THREE.TextureLoader

  constructor() {
    this.textureLoader = new THREE.TextureLoader()
  }

  public createRepeatTexture(url: string, repeat: number): THREE.Texture {
    const texture = this.textureLoader.load(url)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.NearestFilter
    texture.colorSpace = THREE.SRGBColorSpace
    texture.repeat.set(repeat, repeat)
    return texture
  }

  public createBoxMaterial(textureUrl: string, repeat: number = 4): THREE.MeshPhongMaterial {
    return new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      map: this.createRepeatTexture(textureUrl, repeat)
    })
  }

  public createPlaneMaterial(textureUrl: string, repeat: number = 40): THREE.MeshPhongMaterial {
    return new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      map: this.createRepeatTexture(textureUrl, repeat)
    })
  }
}