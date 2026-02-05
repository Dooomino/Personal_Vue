import * as THREE from "three";

const WireShader = {
  uniforms: {
    periodTimer : { value: 0.0 },
    maxDepth : { value: 100000.0 },
    tMask: { value: null },
    inverse: { value: 0.0 }
  },
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vColor;
    varying vec2 vUv;
    float random(float x) {
      return fract(sin(x) * 43758.5453123);
    }

    void main() {
      vPosition = position;
      vColor = vec3(0.8);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision mediump float;
    varying vec3 vColor;
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float periodTimer;
    uniform float maxDepth;
    uniform sampler2D tMask;
    uniform float inverse;

    float random(float x) {
      return fract(sin(x) * 43758.5453123);
    }

    float distanceToOrigin(vec3 point){
      return sqrt(point.x * point.x + point.z * point.z);
    }

    float periodicFunction(float t){

      return -sin(t * 0.5);
    }

    void main() {
      vec3 color = vec3(0.3);
      float factor = 1.0/tan(periodTimer * 0.2) * maxDepth ;
      float alpha = 1.0;
      if (inverse > 0.0){
        alpha = 0.3;
      }

      float maxDistance = sqrt(maxDepth/2.0 * maxDepth/2.0);
      // if(abs(vPosition.y - factor) < maxDepth ){
        //   // color = vec3(0.4);
        //   alpha = inverse;
        // }else if(abs(vPosition.y + 1.0 - factor) < maxDepth ){
      //   // color = vec3(0.2);
      //   alpha = inverse;
      // }else if(abs(vPosition.y + 2.0 - factor) < maxDepth ){
        //   // color = vec3(0.1);
        //   alpha = inverse;
        // }

      float distance = distanceToOrigin(vPosition);

      float f1 = periodicFunction(periodTimer);

      if ( abs(f1 * distance - maxDistance) < 0.3 ){
        alpha = inverse;
      }


      color += vec3(0.118);
      color += abs(vPosition.y / (maxDepth * 0.5) * color);

      //mask
      vec4 mask = texture2D(tMask, vUv);
      if(mask.r > 0.0){
        float colorFac = sin(periodTimer) * 0.5;
        color += vec3(mask.r * colorFac ,mask.g * colorFac ,mask.b * colorFac );
      }

      gl_FragColor = vec4(color,alpha);
    }
  `
};

export default  WireShader ;
