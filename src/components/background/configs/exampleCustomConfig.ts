import { SceneConfig } from '../three/SceneConfig'

// 示例：自定义场景配置
export const exampleCustomConfig: SceneConfig = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 0, 50],
    lookAt: [0, 0, 0]
  },
  renderer: {
    antialias: true,
    alpha: true,
    clearColor: 0x333333,
    clearAlpha: 1
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.1,
    screenSpacePanning: true,
    minDistance: 10,
    maxDistance: 200,
    maxPolarAngle: Math.PI,
    minPolarAngle: 0
  },
  lights: [
    {
      type: 'ambient',
      color: 0x666666,
      intensity: 0.5
    },
    {
      type: 'directional',
      color: 0xffffff,
      intensity: 1,
      position: [10, 10, 10]
    }
  ],
  objects: [
    {
      type: 'box',
      size: [10, 10, 10],
      position: [0, 0, 0],
      scale: [1, 1, 1],
      texture: {
        url: '/textures/checker.png',
        repeat: 2
      },
      material: 'phong'
    }
  ]
}