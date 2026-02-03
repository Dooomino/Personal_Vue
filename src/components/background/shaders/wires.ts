import * as THREE from "three";

const WireShader = {
  uniforms: {
    timer : { value: 0.0 },
    maxDepth : { value: 100000.0 }
  },
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vColor;
    float random(float x) {
      return fract(sin(x) * 43758.5453123);
    }

    void main() {
      vPosition = position;
      vColor = vec3(0.8);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying vec3 vPosition;
    uniform float timer;
    uniform float maxDepth;

    float random(float x) {
      return fract(sin(x) * 43758.5453123);
    }

    void main() {
      vec3 color = vec3(0.3);
      float factor = 1.0/tan(timer * 0.5) * maxDepth ;

      if(abs(vPosition.y - factor) < 0.5 ){
        color = vec3(1.0,0.8,0.0);
      }else if(abs(vPosition.y + 2.0 - factor) < 0.5 ){
        color = vec3(1.0,0.6,0.0);
      }

      color += vPosition.y / (maxDepth * 0.3) * color;

      gl_FragColor = vec4(color,1.0);
    }
  `,

};

export default  WireShader ;
