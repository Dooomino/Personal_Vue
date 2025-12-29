import { Pass } from "postprocessing";
import * as THREE from "three";
import { FullScreenQuad } from "three-stdlib";

export const moebiusShader = {
  uniforms: {
    tDiffuse: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;

    void main() {
      vec2 uv = vUv;
      vec4 color = texture2D(tDiffuse, uv);

      gl_FragColor = vec4(color.r + 0.2, color.g, color.b, color.a);
    }
  `,
};

class MoebiusPass extends Pass {
  private _material: THREE.ShaderMaterial;
  private _fsQuad: FullScreenQuad;

  constructor() {
    super("MoebiusPass");

    this._material = new THREE.ShaderMaterial({
      ...moebiusShader,
      side: THREE.DoubleSide,  // 添加此属性以避免可能的渲染问题
      uniforms: {
        ...moebiusShader.uniforms
      }
    });
    this._fsQuad = new FullScreenQuad(this._material);
  }

  dispose() {
    this._material.dispose();
    this._fsQuad.dispose();
  }

  render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget, outputBuffer: THREE.WebGLRenderTarget) {
    // 确保uniforms存在且有效
    if (this._material.uniforms && this._material.uniforms.tDiffuse) {
      this._material.uniforms.tDiffuse.value = inputBuffer.texture;
    }

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this._fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(outputBuffer);
      if (this.enabled) renderer.clear(this.clearColor, this.clearDepth, this.clearStencil);
      this._fsQuad.render(renderer);
    }
  }
}

export default MoebiusPass;