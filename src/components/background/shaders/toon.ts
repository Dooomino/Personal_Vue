import * as THREE from 'three'

export class ToonShader {
  static uniforms = {
    tDiffuse: { value: null },
    tDepth: { value: null },
    tNormal: { value: null },
    cameraNear: { value: null },
    cameraFar: { value: null },
    resolution: { value: null },
    shadowType: { value: null }
  }

  static vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`

  static fragmentShader = `
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform sampler2D tNormal;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform vec2 resolution;
  uniform float shadowType;

  varying vec2 vUv;
  varying vec3 vNormal;

  // const float shadowType = 1.0;

  const mat3 Sx = mat3( -1, -2, -1, 0, 0, 0, 1, 2, 1);
  const mat3 Sy = mat3( -1, 0, 1, -2, 0, 2, -1, 0, 1);
  const mat3 Sxy = mat3( -1, -2, -1, 0, 0, 0, 1, 2, 1);
  const mat3 Sxz = mat3( -1, 0, 1, -2, 0, 2, -1, 0, 1);
  const mat3 Syz = mat3( -1, 0, 1, 0, 0, 0, 1, 2, 1);
  const mat3 Sxyz = mat3( -1, -2, -1, 0, 0, 0, 1, 2, 1);

  void main() {
    gl_FragColor = vec4(1.0,1.0,1.0, 1.0);
  }`
}

export default {
  ToonShader
}
