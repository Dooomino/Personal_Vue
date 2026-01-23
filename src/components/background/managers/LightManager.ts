import * as THREE from 'three';

export class LightManager {
  private lights: Map<string, THREE.Light> = new Map();
  private lightTargets: Map<string, THREE.Object3D> = new Map();
  private lightObjects: Map<string, THREE.Object3D> = new Map();

  addLight(name: string, light: THREE.Light, target?: THREE.Object3D, lightObject?: THREE.Object3D) {
    this.lights.set(name, light);

    if (target) {
      this.lightTargets.set(name, target);
      light.target = target;
    }

    if (lightObject) {
      this.lightObjects.set(name, lightObject);
    }
  }

  getLight(name: string): THREE.Light | undefined {
    return this.lights.get(name);
  }

  getLightTarget(name: string): THREE.Object3D | undefined {
    return this.lightTargets.get(name);
  }

  getLightObject(name: string): THREE.Object3D | undefined {
    return this.lightObjects.get(name);
  }

  getAllLights(): Map<string, THREE.Light> {
    return this.lights;
  }

  updateLightIntensity(name: string, intensity: number) {
    const light = this.lights.get(name);
    if (light) {
      light.intensity = intensity;
    }
  }

  updateLightPosition(name: string, position: THREE.Vector3) {
    const light = this.lights.get(name);
    if (light) {
      light.position.copy(position);
    }

    const lightObject = this.lightObjects.get(name);
    if (lightObject) {
      lightObject.position.copy(position);
    }
  }

  updateLightTarget(name: string, target: THREE.Vector3) {
    const targetObject = this.lightTargets.get(name);
    if (targetObject) {
      targetObject.position.copy(target);
    }
  }

  // 批量设置所有光源的强度
  setAllLightsIntensity(intensity: number) {
    this.lights.forEach(light => {
      light.intensity = intensity;
    });
  }

  // 根据主题设置光源强度
  setLightsByTheme(isDarkMode: boolean) {
    this.lights.forEach((light, name) => {
      if (name === 'light') { // 主光源
        light.intensity = isDarkMode ? 5.0 : 0.5;
      } else if (name === 'indoorLight') { // 室内光源
        light.intensity = isDarkMode ? 2.0 : 1.0;
      }
    });
  }
}