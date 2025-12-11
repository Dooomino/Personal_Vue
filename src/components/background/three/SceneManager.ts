import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls | null = null

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    )
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.setupRenderer()
    this.setupCamera()
  }

  private setupRenderer(): void {
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private setupCamera(): void {
    this.camera.position.set(200, 10, 200)
    this.camera.lookAt(0, 0, 0)
  }

  public setupControls(): OrbitControls {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = false
    this.controls.minDistance = 100
    this.controls.maxDistance = 500
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1
    this.controls.minPolarAngle = 0
    return this.controls
  }

  public onResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  public render(): void {
    if (this.controls) {
      this.controls.update()
    }
    this.renderer.render(this.scene, this.camera)
  }

  public addToDOM(container: HTMLElement): void {
    container.appendChild(this.renderer.domElement)
  }

  public dispose(): void {
    if (this.controls) {
      this.controls.dispose()
    }
    this.renderer.dispose()
  }
}