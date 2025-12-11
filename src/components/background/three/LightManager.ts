import * as THREE from 'three'

export class LightManager {
  public ambientLight: THREE.AmbientLight | null = null
  public directionalLight: THREE.DirectionalLight | null = null

  public addAmbientLight(scene: THREE.Scene, color: number = 0xffffff, intensity: number = 0.4): THREE.AmbientLight {
    this.ambientLight = new THREE.AmbientLight(color, intensity)
    scene.add(this.ambientLight)
    return this.ambientLight
  }

  public addDirectionalLight(
    scene: THREE.Scene, 
    color: number = 0xffffff, 
    intensity: number = 10,
    position: [number, number, number] = [100, 10, 100]
  ): THREE.DirectionalLight {
    this.directionalLight = new THREE.DirectionalLight(color, intensity)
    this.directionalLight.position.set(...position)
    this.directionalLight.castShadow = true
    this.directionalLight.target.position.set(0, 0, 0)
    scene.add(this.directionalLight)
    scene.add(this.directionalLight.target)
    return this.directionalLight
  }
}