import * as THREE from 'three'

export const moebiusShader = {
  uniforms: {
    "tDiffuse": { value: null },           // 颜色纹理
    "resolution": { value: new THREE.Vector2(1, 1) },
    "cameraNear": { value: 0.1 },
    "cameraFar": { value: 100 },
    "outlineThickness": { value: 1 },
    "outlineColor": { value: new THREE.Color(0xffffff) },
    "wiggleFrequency": { value: 0.08},
    "wiggleAmplitude": { value: 1.0 },
    "objectColor": { value: new THREE.Color(0xcccccc) }, // 添加对象本身的颜色
    lightPosition: { value: new THREE.Vector3(1, 1, 1) },
  },

  vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      out vec3 FragPos;

      void main() {
          vUv = uv;
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          FragPos = vec3(modelMatrix * vec4(position, 1.0));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
  `,

  fragmentShader: `
      #include <packing>

      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float cameraNear;
      uniform float cameraFar;
      uniform float outlineThickness;
      uniform vec3 outlineColor;
      uniform float wiggleFrequency;
      uniform float wiggleAmplitude;
      uniform vec3 objectColor; // 对象本身的颜色
      uniform vec3 lightPosition;

      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;

      in vec3 FragPos;

      // 随机函数（用于抖动效果）
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      // 基于法线和光线的边缘检测
      float edgeDetection() {
          // 获取当前片段的法线和光线方向
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(lightPosition - FragPos);

          // 计算法线与光线的夹角
          // 当夹角接近90度时（即NdotL接近0），说明这是背光边缘
          float NdotL = abs(dot(normal, lightDir));

          // 基于法线变化率检测边缘（曲率）
          vec3 dNdx = dFdx(normal);
          vec3 dNdy = dFdy(normal);
          float curvature = length(dNdx) + length(dNdy);

          // 结合多种因素计算边缘强度
          float edge = (1.0 - NdotL) * 0.7; // 光线边缘贡献70%
          edge += clamp(curvature * 10.0, 0.0, 0.3) * 0.3; // 曲率贡献30%

          return edge;
      }

      void main() {
          vec2 uv = vUv;
          vec2 screenPos = uv * resolution;
          // 创建抖动效果（如果启用）
          float rand = 0.0;
          vec2 displacement = vec2(0.0);
          vec3 norm = normalize(vNormal);

          vec3 color = objectColor; // 默认使用对象颜色

          // 原有方向光计算
          vec3 lightDir = normalize(lightPosition - FragPos);
          float diffuse = max(dot(norm, lightDir), 0.0);
          // 减少环境光强度，使阴影区域更暗
          // vec3 ambient = 0.2 * vec3(1.0); // 从0.4降低到0.2
          vec3 ambient = 0.2 * (vec3(1.0) - lightDir); // 从0.4降低到0.2

          // 改进方向光计算 - 控制方向光强度
          float directionalLightIntensity = 0.5; // 添加方向光强度控制
          vec3 directionalLighting = (diffuse * vec3(1.0)) * directionalLightIntensity;

          // 总光照 = 环境光 + 方向光 + 镜面反射
          vec3 totalLighting = ambient + directionalLighting;

          vec4 diffuseSample = texture2D(tDiffuse, uv);
          if (diffuseSample.a > 0.0) { // 有透明度说明纹理存在
              color *= diffuseSample.rgb;
          }

          // 应用光照
          color += totalLighting;

          if (wiggleAmplitude > 0.0 && wiggleFrequency > 0.0) {
              rand = random(screenPos);
              displacement =  vec2(
                  rand * sin(screenPos.y * wiggleFrequency),
                  rand * cos(screenPos.x * wiggleFrequency)
              )  ;
          }


          // 默认情况下显示基本颜色
          vec3 finalColor = color;

          // 使用改进的几何边缘检测
          float edge = edgeDetection();
          edge = smoothstep(0.2, 0.8, edge);


          // 素描效果 - 基于光照和亮度的点阵（替代原来的线条）
          // 使用光照信息来决定素描密度，使得面向光源的部分素描较少，背光部分素描较多
          float NdotL = max(dot(norm, lightDir), 0.0);
          float luma = dot(finalColor, vec3(0.299, 0.587, 0.114)); // 使用内置 luminance

          // 结合光照和亮度信息来确定素描密度
          float sketchFactor = (1.0 - NdotL) * (1.0 - luma);
          float pattern = 0.0;

          if (wiggleAmplitude > 0.0 && wiggleFrequency > 0.0) {
              float modVal = 0.1 + sketchFactor / 10.0; // 根据光照调整网格密度

              // 暗区 - 点阵
              if (luma <= 0.2) {
                  float gridX = mod(screenPos.x + displacement.x, modVal);
                  float gridY = mod(screenPos.y + displacement.y, modVal);
                  if (gridX < outlineThickness && gridY < outlineThickness) {
                      pattern = 1.0;
                  }
              }

              // 中暗区 - 稀疏点阵（25%混合）
              if (luma <= 0.3) {
                  float gridX = mod(screenPos.x + displacement.x, modVal);
                  float gridY = mod(screenPos.y + displacement.y, modVal);
                  if (gridX < outlineThickness && gridY < outlineThickness) {
                      pattern = max(pattern, 0.15);
                  }
              }

              // 亮区 - 更稀疏点阵（50%混合）
              if (luma <= 0.4) {
                  float gridX = mod((screenPos.x + displacement.x) * 0.707 - (screenPos.y + displacement.y) * 0.707, modVal);
                  float gridY = mod((screenPos.x + displacement.x) * 0.707 + (screenPos.y + displacement.y) * 0.707, modVal);
                  if (gridX < outlineThickness && gridY < outlineThickness) {
                      pattern = max(pattern, 0.25);
                  }
              }

              // 最亮区 - 最稀疏点阵（75%混合）
              if (luma <= 0.6) {
                  float gridX = mod((screenPos.x + displacement.x) * 0.707 + (screenPos.y + displacement.y) * 0.707, modVal);
                  float gridY = mod((screenPos.x + displacement.x) * 0.707 - (screenPos.y + displacement.y) * 0.707, modVal);
                  if (gridX < outlineThickness && gridY < outlineThickness) {
                      pattern = max(pattern, 0.3);
                  }
              }

              // 根据光照调整图案强度
              pattern *= (0.5 + 0.5 * NdotL);
          }
          // 应用素描线条
          if (pattern > 0.0) {
              finalColor = mix(finalColor ,outlineColor, pattern);
          }

          // 应用边缘轮廓
          if (edge > 0.0) {
              finalColor = mix(finalColor, outlineColor, edge);
          }
          // finalColor = vec3(1.0 - finalColor.r, 1.0 - finalColor.g, 1.0 - finalColor.b);
          gl_FragColor = vec4(finalColor, 1.0);
          // gl_FragColor = vec4(outlineColor, 1.0);
          // gl_FragColor = vec4(normalize(directionalLighting), 1.0);
          // gl_FragColor = vec4(finalColor, 1.0);
          // gl_FragColor = depthSample;
          // gl_FragColor = vec4(normalize() ,0.0, 1.0);
          // 调试输出，显示不同的边缘检测结果
          // gl_FragColor = vec4(NdotL, NdotL, NdotL, 1.0);  // 显示边缘强度
          // gl_FragColor = vec4(edge, edge, edge, 1.0);  // 显示边缘强度
          // gl_FragColor = vec4(pattern, 0.0 ,0.0 , 1.0);  // 显示边缘强度
          // gl_FragColor = vec4(finalColor, 1.0);
      }
  `
};
