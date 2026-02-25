import * as THREE from "three";

const WireShader = {
  uniforms: {
    timer : { value: 0.0 },
    maxDepth : { value: 100000.0 },
    tMask: { value: null },
    inverse: { value: 0.0 },
    // 新增网格纹理生成相关uniforms
    uGridData: { value: null },
    uGridSize: { value: new THREE.Vector3(1, 1, 1) },
    uUseGridTexture: { value: 0.0 },
    uDirPos: {value: new THREE.Vector3(0.0, 0.0, 0.0)},
    // 光照相关uniforms
    uLightDirection: { value: new THREE.Vector3(1.0, -1.0, 1.0) },  // 斜向下光源
    uLightColor: { value: new THREE.Vector3(0.0, 1.0, 1.0) },      // 绿色光源
    uAmbientStrength: { value: 0.8 }                               // 30%环境光
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
    varying vec3 vColor;
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float timer;
    uniform float maxDepth;
    uniform sampler2D tMask;
    uniform float inverse;

    // 新增网格纹理生成相关uniforms
    uniform sampler2D uGridData;
    uniform vec2 uGridSize;
    uniform float uUseGridTexture;
    uniform vec3 uDirPos;

    // 光照相关uniforms
    uniform vec3 uLightDirection;  // 光源方向
    uniform vec3 uLightColor;      // 光源颜色
    uniform float uAmbientStrength; // 环境光强度

    float random(float x) {
      return fract(sin(x) * 43758.5453123);
    }

    float distanceToOrigin(vec3 point){
      return sqrt(point.x * point.x + point.z * point.z);
    }

    // 光照计算函数 - Lambert漫反射模型
    vec3 calculateLighting(vec3 normal, vec3 lightDir, vec3 lightColor, float ambientStrength) {
      // 简化的法线计算（基于顶点位置的近似法线）
      vec3 approxNormal = normalize(vec3(
        vPosition.x * 0.1,  // 根据X坐标变化
        1.0,                // Y方向为主
        vPosition.z * 0.1   // 根据Z坐标变化
      ));

      // 计算漫反射
      float diff = max(dot(approxNormal, normalize(-lightDir)), 0.0);

      // 环境光
      vec3 ambient = ambientStrength * lightColor;

      // 漫反射光
      vec3 diffuse = diff * lightColor;

      return ambient + diffuse;
    }

    // 灰度颜色表（16级灰度）
    vec3 getGrayscaleColor(float normalizedValue) {
      const vec3 grayscale[16] = vec3[](
        vec3(0.0, 0.0, 0.0),      // #000000
        vec3(0.067, 0.067, 0.067), // #111111
        vec3(0.133, 0.133, 0.133), // #222222
        vec3(0.2, 0.2, 0.2),      // #333333
        vec3(0.267, 0.267, 0.267), // #444444
        vec3(0.333, 0.333, 0.333), // #555555
        vec3(0.4, 0.4, 0.4),      // #666666
        vec3(0.467, 0.467, 0.467), // #777777
        vec3(0.533, 0.533, 0.533), // #888888
        vec3(0.6, 0.6, 0.6),      // #999999
        vec3(0.667, 0.667, 0.667), // #AAAAAA
        vec3(0.733, 0.733, 0.733), // #BBBBBB
        vec3(0.8, 0.8, 0.8),      // #CCCCCC
        vec3(0.867, 0.867, 0.867), // #DDDDDD
        vec3(0.933, 0.933, 0.933), // #EEEEEE
        vec3(1.0, 1.0, 1.0)       // #FFFFFF
      );

      float grayIndex = floor(normalizedValue * 15.0 + 0.5);
      grayIndex = clamp(grayIndex, 0.0, 15.0);
      int index = int(grayIndex);
      return grayscale[index];
    }

    void main() {
      vec3 color = vec3(0.3);
      float factor = 1.0/tan(timer * 0.2) * maxDepth ;
      float alpha = 1.0;
      if (inverse > 0.0){
        alpha = 0.3;
      }

      float maxDistance = sqrt(maxDepth/2.0 * maxDepth/2.0);

      float distance = distanceToOrigin(vPosition);
      float solid = 0.0;
      if (abs(log(distance/maxDistance) + factor * 0.5) < 5.0){
        alpha = inverse;
        solid = 1.0;
      }

      color += abs(vPosition.y / (maxDepth * 0.8) * color);

      // 新增：网格纹理生成逻辑（直接使用vPosition.y）
      if (maxDepth > 0.0) {
        // 直接使用顶点Y坐标作为网格值
        float gridValue = vPosition.y;

        // 归一化网格值
        float normalizedGridValue = gridValue / maxDepth;

        // 生成基于网格的纹理颜色
        vec3 gridColor = getGrayscaleColor(normalizedGridValue);

        // 将网格纹理颜色混合到最终颜色中
        color = mix(color * 0.1 * gridValue , gridColor, 0.7); // 70%网格纹理，30%原有颜色
        // color += gridColor;

        if(normalizedGridValue < 0.3 && solid == 1.0){
          // 光照计算
          vec3 lightContribution = calculateLighting(
            vec3(0.0,1.0,0.0),           // 法线（在函数内计算近似值）
            uLightDirection,     // 光源方向
            uLightColor,         // 光源颜色（绿色）
            uAmbientStrength     // 环境光强度
          );

          // 将光照贡献应用到颜色上
          color *= lightContribution;
        }

      }


      //mask
      // vec4 mask = texture2D(tMask, vUv);
      // if(mask.r > 0.0){
      //   color += vec3(mask.r * colorFac ,mask.g * colorFac ,mask.b * colorFac );
      // }

      gl_FragColor = vec4(color,alpha);
    }
  `
};

// 导出独立的网格纹理工具函数
export function setGridTexture(material: THREE.ShaderMaterial, maxDepth: number) {
  if (material.uniforms) {
    // 设置uniforms
    material.uniforms.uUseGridTexture = { value: 1.0 };
    material.uniforms.maxDepth = { value: maxDepth };
  }
}

export function disableGridTexture(material: THREE.ShaderMaterial) {
  if (material.uniforms) {
    material.uniforms.uUseGridTexture = { value: 0.0 };
  }
}

// 光照控制函数
export function enableLighting(material: THREE.ShaderMaterial, lightDirection?: THREE.Vector3, lightColor?: THREE.Vector3) {
  if (material.uniforms) {
    // 启用光照
    material.uniforms.uLightDirection = { value: lightDirection || new THREE.Vector3(1.0, -1.0, 1.0) };
    material.uniforms.uLightColor = { value: lightColor || new THREE.Vector3(0.0, 1.0, 0.0) }; // 默认绿色
    material.uniforms.uAmbientStrength = { value: 0.3 };
  }
}

export function disableLighting(material: THREE.ShaderMaterial) {
  if (material.uniforms) {
    material.uniforms.uLightColor = { value: new THREE.Vector3(1.0, 1.0, 1.0) }; // 白色，相当于关闭特殊光照
    material.uniforms.uAmbientStrength = { value: 1.0 }; // 100%环境光，消除光照效果
  }
}

export function setLightColor(material: THREE.ShaderMaterial, color: THREE.Vector3) {
  if (material.uniforms) {
    material.uniforms.uLightColor = { value: color };
  }
}

export default  WireShader ;
