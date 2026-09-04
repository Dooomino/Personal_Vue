import * as THREE from 'three'

/**
 * 从 canvas 创建标准 THREE 渲染管线。
 * 返回 renderer/scene/camera，slide 组件只需添加对象并 render。
 */
export function createThreeScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true })
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    1000
  )

  return { renderer, scene, camera }
}
