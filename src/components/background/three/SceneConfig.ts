export interface SceneConfig {
  camera: {
    fov: number
    near: number
    far: number
    position: [number, number, number]
    lookAt: [number, number, number]
  }
  renderer: {
    antialias: boolean
    alpha: boolean
    clearColor: number
    clearAlpha: number
  }
  controls: {
    enableDamping: boolean
    dampingFactor: number
    screenSpacePanning: boolean
    minDistance: number
    maxDistance: number
    maxPolarAngle: number
    minPolarAngle: number
  }
  lights: Array<{
    type: 'ambient' | 'directional'
    color: number
    intensity: number
    position?: [number, number, number]
  }>
  objects: Array<{
    type: 'box' | 'plane'
    size: [number, number, number]
    position: [number, number, number]
    rotation?: [number, number, number]
    scale: [number, number, number]
    texture?: {
      url: string
      repeat: number
    }
    material: 'basic' | 'phong'
  }>
}