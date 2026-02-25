import * as THREE from 'three';

export const WaveShader = {
  uniforms: {
    uTime: { value: 0 },
    uFrequency: { value: 0.3 },  // 基础波频
    uAmplitude: { value: 3.0 },  // 基础波幅
    uSpeed: { value: 1.0 },       // 基础传播速度
    uDirection: { value: 0.0 },   // 主波浪方向角度（弧度）
    uWaveCount: { value: 3.0 },   // 波浪组数量
    uStaggerOffset: { value: 1.0 }, // 交错偏移时间
    uWaveSpacing: { value: 2.0 },   // 波浪间距
    uColor: { value: new THREE.Color(0xffffff) },
    uAlpha: { value: 0.0 },
    uLightPosition: { value: new THREE.Vector3(0, 0, 0) },
    uLightColor: { value: new THREE.Color(0xffffff) },
    uShininess: { value: 2.0 },  // 镜面反射强度
    uSpecularStrength: { value: 0.2 }, // 镜面反射系数
  },
  vertexShader: `
      uniform float uTime;
      uniform float uFrequency;
      uniform float uAmplitude;
      uniform float uSpeed;
      uniform float uDirection;
      uniform float uWaveCount;
      uniform float uStaggerOffset;
      uniform float uWaveSpacing;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vElevation;

      float random(vec2 st){
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      // 创建交错波纹函数
      float createStaggeredWaves(vec2 pos, float time, float direction, float waveIndex) {
          // 创建旋转矩阵
          float cosDir = cos(direction);
          float sinDir = sin(direction);

          // 旋转坐标到波浪方向
          float rotatedX = pos.x * cosDir + pos.y * sinDir;
          float rotatedY = -pos.x * sinDir + pos.y * cosDir;

          // 计算交错时间偏移
          float staggerTime = time + waveIndex * uStaggerOffset;

          // 主波浪
          float wave = sin(rotatedX * uFrequency - staggerTime * uSpeed) * uAmplitude;

          // 添加高频细节波浪
          wave += sin(rotatedX * uFrequency * 2.0 - staggerTime * uSpeed * 1.5) * uAmplitude * 0.5;
          wave += sin(rotatedX * uFrequency * 3.0 - staggerTime * uSpeed * 2.0) * uAmplitude * 0.3;

          // 添加垂直方向的交叉波浪
          float crossWave = sin(rotatedY * uFrequency * 0.7 + staggerTime * uSpeed * 0.8) * uAmplitude * 0.4;
          wave += crossWave;

          // 根据波浪索引调整振幅（创建渐变效果）
          float amplitudeMod = 1.0 - (waveIndex / uWaveCount) * 0.3;
          wave *= amplitudeMod;

          return wave;
      }

      void main() {
          vUv = uv;
          vec3 pos = position;

          float totalWave = 0.0;
          float waveContribution = 0.0;

          // 创建多个交错的波浪组
          for(float i = 0.0; i < 6.0; i++) {
              if(i >= uWaveCount) break;

              // 计算不同的波浪方向（放射状分布）
              float waveDirection = uDirection + (i / uWaveCount) * 3.14159 * 2.0;

              // 计算位置偏移创造交错效果
              vec2 offsetPos = vec2(pos.x, pos.z);
              offsetPos.x += sin(i * 1.3) * uWaveSpacing;
              offsetPos.y += cos(i * 1.7) * uWaveSpacing;

              // 生成交错波纹
              float waveValue = createStaggeredWaves(offsetPos, uTime, waveDirection, i);

              // 应用距离衰减
              float distanceFromCenter = length(offsetPos);
              float attenuation = 1.0 / (1.0 + distanceFromCenter * 0.1);
              waveValue *= attenuation;

              totalWave += waveValue;
              waveContribution += 1.0;
          }

          // 平均化波浪贡献
          if(waveContribution > 0.0) {
              totalWave /= waveContribution;
          }

          // 添加基础噪声
          // float noise = vec2(pos.x * 0.05, pos.z * 0.05 + uTime * 0.1) * 0.5;
          float noise = 1.0;
          totalWave += noise * uAmplitude * 0.2;

          pos.y += totalWave;
          vElevation = totalWave;

          // 计算法线（简化近似）
          vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
          vec3 dx = vec3(1.0, 0.0, 0.0);
          vec3 dz = vec3(0.0, 0.0, 1.0);

          // 通过高度差近似计算法线
          float height_dx = totalWave + 0.1;
          float height_dz = totalWave + 0.1;

          vec3 normal = normalize(cross(dx, dz));
          vNormal = normal;
          vPosition = worldPos;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
  `,
  fragmentShader: `
      uniform vec3 uColor;
      uniform float uAlpha;

      varying vec2 vUv;
      varying float vElevation;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 uLightPosition;
      uniform vec3 uLightColor;
      uniform float uShininess;
      uniform float uSpecularStrength;

      void main() {
          // 基础颜色 - 根据高度和UV变化
          vec3 baseColor = uColor;

          // 根据波浪高度调整颜色
          float heightFactor = clamp(vElevation * 0.2 + 0.5, 0.0, 1.0);
          vec3 heightColor = mix(vec3(0.1, 0.3, 0.6), vec3(0.6, 0.8, 1.0), heightFactor);

          // 根据UV坐标添加纹理效果
          float uvPattern = sin(vUv.x * 20.0) * sin(vUv.y * 20.0);
          vec3 patternColor = mix(vec3(0.8, 0.9, 1.0), vec3(0.3, 0.5, 0.8), uvPattern * 0.5 + 0.5);

          baseColor = mix(baseColor, heightColor, 0.4);
          baseColor = mix(baseColor, patternColor, 0.2);

          // 观察方向
          vec3 viewDir = normalize(cameraPosition - vPosition);

          // 光线方向
          vec3 lightDir = normalize(uLightPosition - vPosition);

          // 漫反射计算
          float diff = max(dot(vNormal, lightDir), 0.0);
          vec3 diffuse = diff * uLightColor;

          // 镜面反射计算
          vec3 reflectDir = reflect(-lightDir, vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
          vec3 specular = uSpecularStrength * spec * uLightColor;

          // 最终颜色 = 基础色 + 漫反射 + 镜面反射 + 发光效果
          vec3 finalColor = baseColor * 0.4 + diffuse * 0.4 + specular;

          // 添加基于高度的发光效果
          float glow = smoothstep(0.0, 1.0, vElevation * 0.3);
          finalColor += vec3(0.2, 0.4, 0.8) * glow * 0.3;

          gl_FragColor = vec4(finalColor, uAlpha);
      }
  `,
};
