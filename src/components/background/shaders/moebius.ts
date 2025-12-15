import * as THREE from 'three'

export const SketchOutlineShader = {
  uniforms: {
    "tDiffuse": { value: null },           // 颜色纹理
    "tDepth": { value: null },             // 深度纹理
    "tNormal": { value: null },            // 法线纹理
    "resolution": { value: new THREE.Vector2(1, 1) },
    "cameraNear": { value: 0.1 },
    "cameraFar": { value: 100 },
    "outlineThickness": { value: 0.2 },
    "outlineColor": { value: new THREE.Color(0x333333) },
    "wiggleFrequency": { value: 0.008},
    "wiggleAmplitude": { value: 1.0 },
    "objectColor": { value: new THREE.Color(0xcccccc) }, // 添加对象本身的颜色
    lightPosition: { value: new THREE.Vector3(1, 1, 1) },
  },

  vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
  `,

  fragmentShader: `
      #include <packing>

      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform sampler2D tNormal;
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

      // Sobel 算子 x 方向
      const mat3 Gx = mat3(
          -1.0, 0.0, 1.0,
          -2.0, 0.0, 2.0,
          -1.0, 0.0, 1.0
      );

      // Sobel 算子 y 方向
      const mat3 Gy = mat3(
          1.0, 2.0, 1.0,
          0.0, 0.0, 0.0,
          -1.0, -2.0, -1.0
      );

      // 从深度缓冲区获取线性深度
      float getLinearDepth(float depth) {
          float z = depth * 2.0 - 1.0; // 从 [0,1] 转换到 [-1,1]
          return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
      }

      // 从非线性深度纹理获取线性深度
      float readDepth(sampler2D depthTexture, vec2 coord) {
          float depth = texture2D(depthTexture, coord).r;
          return getLinearDepth(depth);
      }

      // 随机函数（用于抖动效果）
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      // Sobel 边缘检测（深度）
      float sobelDepth(sampler2D depthTex, vec2 uv) {
          // 如果没有深度纹理，则返回0
          // 注意：不能用 depthTex == null，改用采样值判断
          vec4 depthSample = texture2D(depthTex, uv);
          if (depthSample.r == 0.0) return 0.0; // 假设未绑定时返回0

          float depth[9];
          vec2 texelSize = 1.0 / resolution;

          for (int i = -1; i <= 1; i++) {
              for (int j = -1; j <= 1; j++) {
                  vec2 offset = vec2(i, j) * texelSize * outlineThickness;
                  int index = (i + 1) * 3 + (j + 1);
                  depth[index] = readDepth(depthTex, uv + offset);
              }
          }

          float dx = 0.0;
          float dy = 0.0;

          for (int i = 0; i < 9; i++) {
              int x = i % 3 - 1;
              int y = i / 3 - 1;
              dx += depth[i] * Gx[y + 1][x + 1];
              dy += depth[i] * Gy[y + 1][x + 1];
          }

          return sqrt(dx * dx + dy * dy);
      }

      // Sobel 边缘检测（法线）
      float sobelNormal(sampler2D normalTex, vec2 uv) {
          // 如果没有法线纹理，则返回0
          vec4 normalSample = texture2D(normalTex, uv);
          if (normalSample.r == 0.0) return 0.0; // 假设未绑定时返回0

          vec3 normal[9];
          vec2 texelSize = 1.0 / resolution;

          for (int i = -1; i <= 1; i++) {
              for (int j = -1; j <= 1; j++) {
                  vec2 offset = vec2(i, j) * texelSize * outlineThickness;
                  int index = (i + 1) * 3 + (j + 1);
                  normal[index] = texture2D(normalTex, uv + offset).rgb * 2.0 - 1.0;
              }
          }

          float dx = 0.0;
          float dy = 0.0;

          for (int i = 0; i < 9; i++) {
              int x = i % 3 - 1;
              int y = i / 3 - 1;
              float intensity = length(normal[i]);
              dx += intensity * Gx[y + 1][x + 1];
              dy += intensity * Gy[y + 1][x + 1];
          }

          return sqrt(dx * dx + dy * dy);
      }

      void main() {
          vec2 uv = vUv;
          vec2 screenPos = uv * resolution;
          // 创建抖动效果（如果启用）
          float rand = 0.0;
          vec2 displacement = vec2(0.0);
          if (wiggleAmplitude > 0.0 && wiggleFrequency > 0.0) {
              rand = random(screenPos);
              displacement = vec2(
                  rand * sin(screenPos.y * wiggleFrequency),
                  rand * cos(screenPos.x * wiggleFrequency)
              ) * wiggleAmplitude / resolution;
          }

          // 读取颜色和深度
          vec3 color = objectColor; // 默认使用对象颜色
          float depth = 0.0;

          // 如果提供了diffuse纹理，则使用它
          // vec4 diffuseSample = texture2D(tDiffuse, uv);
          // if (diffuseSample.a > 0.0) { // 有透明度说明纹理存在
          //     color = diffuseSample.rgb;
          // }

          // 默认情况下显示基本颜色
          vec3 finalColor = vec3(1.0, 1.0, 1.0);

          // 计算边缘
          float depthEdge = sobelDepth(tDepth, uv + displacement) ;
          float normalEdge = sobelNormal(tNormal, uv + displacement) ;

          // 混合边缘检测结果
          float edge = depthEdge * 25.0 + normalEdge;
          edge = smoothstep(0.0, 1.0, edge);

          spectralColor = lightPosition * vec3(1.0) * tNormal;
          // 素描效果 - 基于亮度的线条（仅在启用了抖动时）
          float luma = dot(lightPosition*color, vec3(0.299, 0.587, 0.114)); // 使用内置 luminance
          float pattern = 0.0;

          if (wiggleAmplitude > 0.0 && wiggleFrequency > 0.0) {
              float modVal = 11.0;

              // 暗区 - 水平线条
              if (luma <= 0.05) {
                  if (mod(screenPos.y + displacement.y, modVal) < outlineThickness) {
                      pattern = 1.0;
                  }
              }

              // 中暗区 - 垂直线条（25%混合）
              if (luma <= 0.1) {
                  if (mod(screenPos.x + displacement.x, modVal) < outlineThickness) {
                      pattern = max(pattern, 0.25);
                  }
              }

              // 亮区 - 斜线条（50%混合）
              if (luma <= 0.2) {
                  if (mod(screenPos.x + displacement.x + screenPos.y + displacement.y, modVal) < outlineThickness) {
                      pattern = max(pattern, 0.5);
                  }
              }

              // 无 - 条（75%混合）
              if (luma <= 0.3) {
                  if (mod(screenPos.x + displacement.x - screenPos.y + displacement.y, modVal) < outlineThickness) {
                      pattern = 0.0;
                  }
              }
          }

          // 应用素描线条
          if (pattern > 0.0) {
              finalColor = mix(finalColor, outlineColor, pattern);
          }

          // 应用边缘轮廓
          // if (edge > 0.0) {
          //     finalColor = mix(finalColor, outlineColor, edge);
          // }

          gl_FragColor = vec4(finalColor, 1.0);
          // gl_FragColor = vec4(edge,1.0,1.0,1.0);
      }
  `
};
