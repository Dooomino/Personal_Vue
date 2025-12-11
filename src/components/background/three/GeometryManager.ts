import * as THREE from 'three'

export class GeometryManager {
  public boxGeometry: THREE.BoxGeometry
  public planeGeometry: THREE.PlaneGeometry
  public boxMesh: THREE.Mesh | null = null
  public planeMesh: THREE.Mesh | null = null

  constructor() {
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    this.planeGeometry = new THREE.PlaneGeometry(100, 100)
  }

  public createBoxMesh(material: THREE.Material): THREE.Mesh {
    this.boxMesh = new THREE.Mesh(this.boxGeometry, material)
    this.boxMesh.position.set(0, 15.1, 0)
    this.boxMesh.scale.set(30, 30, 30)
    return this.boxMesh
  }

  public createPlaneMesh(material: THREE.Material): THREE.Mesh {
    this.planeMesh = new THREE.Mesh(this.planeGeometry, material)
    this.planeMesh.scale.set(100, 100, 100)
    this.planeMesh.rotateX(Math.PI / 2)
    return this.planeMesh
  }

  public dispose(): void {
    this.boxGeometry.dispose()
    this.planeGeometry.dispose()
  }
}