import * as THREE from 'three';

export const  LightHouseShader = {
  uniforms: {
    tAlphaMap: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    uniform sampler2D tAlphaMap;

    void main() {
      vec3 baseColor = vec3(0.467, 0.467, 0.467);
      vec3 color = vec3(0.0, 0.0, 0.0);

      // 检查纹理是否有效
      bool hasTexture = false;
      if (textureSize(tAlphaMap, 0).x > 0) {
        hasTexture = true;
      }

      vec4 alphaMap = texture2D(tAlphaMap, vUv);

      // 如果纹理无效，使用基础颜色
      if (!hasTexture) {
        gl_FragColor = vec4(baseColor, 1.0);
      } else {
        float alpha = 1.0;
        if (alphaMap.r < 0.5) {
          alpha = 0.3;
        }
        // 使用纹理颜色
        gl_FragColor = vec4(baseColor, alpha );
      }
    }
  `
};

export const LightConeShader = {
  uniforms: {
    uMaxHeight:{ value: 0.0 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    uniform float uMaxHeight;
    void main() {
      vec3 color = vec3(1.0,0.5,0.0);
      // 以几何体高度0为基准计算距离
      float distance = vPosition.y;
      float intensity = min(1.0 - smoothstep(0.0, uMaxHeight * 0.5, -distance),0.9);
      gl_FragColor = vec4(intensity * color, intensity);
    }
  `
}
export default {
  LightHouseShader,
  LightConeShader
};
