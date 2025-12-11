import { SceneConfig } from '../three/SceneConfig'

export const defaultSceneConfig: SceneConfig = {
  camera: {
    fov: 50,
    near: 0.1,
    far: 3000,
    position: [200, 10, 200],
    lookAt: [0, 0, 0]
  },
  renderer: {
    antialias: true,
    alpha: true,
    clearColor: 0x000000,
    clearAlpha: 0
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    screenSpacePanning: false,
    minDistance: 100,
    maxDistance: 500,
    maxPolarAngle: Math.PI / 2 - 0.1,
    minPolarAngle: 0
  },
  lights: [
    {
      type: 'ambient',
      color: 0xffffff,
      intensity: 0.4
    },
    {
      type: 'directional',
      color: 0xffffff,
      intensity: 10,
      position: [100, 10, 100]
    }
  ],
  objects: [
    {
      type: 'box',
      size: [1, 1, 1],
      position: [0, 15.1, 0],
      scale: [30, 30, 30],
      texture: {
        url: '/textures/checker.png',
        repeat: 4
      },
      material: 'phong'
    },
    {
      type: 'plane',
      size: [100, 100, 1],
      position: [0, 0, 0],
      rotation: [Math.PI / 2, 0, 0],
      scale: [100, 100, 100],
      texture: {
        url: '/textures/checker.png',
        repeat: 40
      },
      material: 'phong'
    }
  ]
}