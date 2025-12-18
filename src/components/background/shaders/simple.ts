import * as THREE from "three";

export const SimpleShader  = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    tNormal: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    cameraNear: { value: 0.1 },
    lightPosition: { value: new THREE.Vector3(1, 1, 1) },
    objectColor: { value: new THREE.Color(0xcccccc) },
    viewPosition: { value: new THREE.Vector3(0, 0, 0) },
  },
  vertexShader: `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
      vNormal = normalize(normal * position);
      vUv = uv;
      vPosition =  vec3(modelMatrix * vec4(position, 1.0));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 lightPosition;
    uniform vec3 objectColor;
    uniform vec3 viewPosition;
    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(viewPosition - vPosition);
      vec3 position = normalize(vPosition);
      float diffuse = max(dot(N, lightPosition), 0.0);

      gl_FragColor = vec4(objectColor * diffuse, 1.0);
      // gl_FragColor = vec4(, 1.0);
      // gl_FragColor = vec4(1.0,1.0,1.0, 1.0);
      // gl_FragColor = vec4(vNormal, 1.0);
    }
  `
};
