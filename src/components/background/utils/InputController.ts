import * as THREE from 'three'

export class InputController {
  private keys: Record<string, boolean> = {}

  constructor() {
    window.addEventListener('keydown', (event) => {
      this.keys[event.key] = true
    })

    window.addEventListener('keyup', (event) => {
      this.keys[event.key] = false
    })
  }

  public isPressed(key: string): boolean {
    return !!this.keys[key]
  }

  public updateMovement(target: THREE.Object3D, speed: number = 1): void {
    if (this.keys['w'] || this.keys['W']) {
      target.position.z -= speed
    }
    if (this.keys['s'] || this.keys['S']) {
      target.position.z += speed
    }
    if (this.keys['a'] || this.keys['A']) {
      target.position.x -= speed
    }
    if (this.keys['d'] || this.keys['D']) {
      target.position.x += speed
    }
  }
}