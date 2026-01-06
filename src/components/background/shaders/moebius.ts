import { Pass } from "postprocessing";
import * as THREE from "three";
import { FullScreenQuad } from "three-stdlib";

// 定义着色器对象，用于BackCanvas.vue中直接材质使用
const moebiusShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    tNormal: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 1000 },
    resolution: { value: new THREE.Vector2(1, 1) },
    shadowType: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
  #include <packing>
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform sampler2D tNormal;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform vec2 resolution;
  uniform float shadowType;

  // const float shadowType = 1.0;

  const mat3 Sx = mat3( -1, -2, -1, 0, 0, 0, 1, 2, 1 );
  const mat3 Sy = mat3( -1, 0, 1, -2, 0, 2, -1, 0, 1 );

  float hash(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);

    return fract((p3.x + p3.y) * p3.z);
  }

  float readDepth( sampler2D depthTexture, vec2 coord ) {
    float fragCoordZ = texture2D( depthTexture, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
  }

  float luma(vec3 color) {
    const vec3 magic = vec3(0.2125, 0.7154, 0.0721);
    return dot(magic, color);
  }

  void main() {
    vec2 uv = vUv;
    vec2 texel = vec2( 1.0 / resolution.x, 1.0 / resolution.y );

    float outlineThickness = 1.5;
    vec4 outlineColor = vec4(0.0, 0.0, 0.0, 1.0);

    vec2 displacement = vec2(
      (hash(gl_FragCoord.xy) * sin(gl_FragCoord.y * 0.05)) ,
      (hash(gl_FragCoord.xy) * cos(gl_FragCoord.x * 0.05))
    ) * 2.0 /resolution.xy;

    // 检查深度和法线纹理是否存在，如果不存在则使用默认值
    float depth = 0.9;
    vec4 normal = vec4(0.5, 0.5, 1.0, 1.0);
    vec4 pixelColor = texture2D(tDiffuse, vUv);

    if (tDepth != null) {
      depth = readDepth(tDepth, vUv);
    }

    if (tNormal != null) {
      normal = texture2D(tNormal, vUv);
    }

    float depth00 = depth;
    float depth01 = depth;
    float depth02 = depth;
    float depth10 = depth;
    float depth11 = depth;
    float depth12 = depth;
    float depth20 = depth;
    float depth21 = depth;
    float depth22 = depth;

    if (tDepth != null) {
      depth00 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(-1, 1));
      depth01 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(-1, 0));
      depth02 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(-1, -1));
      depth10 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(0, -1));
      depth11 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(0, 0));
      depth12 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(0, 1));
      depth20 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(1, -1));
      depth21 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(1, 0));
      depth22 = readDepth(tDepth, vUv + displacement + outlineThickness * texel * vec2(1, 1));
    }

    float xSobelValueDepth =
      Sx[0][0] * depth00 + Sx[1][0] * depth01 + Sx[2][0] * depth02 +
      Sx[0][1] * depth10 + Sx[1][1] * depth11 + Sx[2][1] * depth12 +
      Sx[0][2] * depth20 + Sx[1][2] * depth21 + Sx[2][2] * depth22;

    float ySobelValueDepth =
      Sy[0][0] * depth00 + Sy[1][0] * depth01 + Sx[2][0] * depth02 +
      Sy[0][1] * depth10 + Sy[1][1] * depth11 + Sy[2][1] * depth12 +
      Sy[0][2] * depth20 + Sy[1][2] * depth21 + Sy[2][2] * depth22;

    float gradientDepth = sqrt(pow(xSobelValueDepth, 2.0) + pow(ySobelValueDepth, 2.0));

    float normal00 = luma(normal.rgb);
    float normal01 = luma(normal.rgb);
    float normal02 = luma(normal.rgb);
    float normal10 = luma(normal.rgb);
    float normal11 = luma(normal.rgb);
    float normal12 = luma(normal.rgb);
    float normal20 = luma(normal.rgb);
    float normal21 = luma(normal.rgb);
    float normal22 = luma(normal.rgb);

    if (tNormal != null) {
      normal00 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(-1, -1)).rgb);
      normal01 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(-1, 0)).rgb);
      normal02 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(-1, 1)).rgb);
      normal10 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(0, -1)).rgb);
      normal11 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(0, 0)).rgb);
      normal12 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(0, 1)).rgb);
      normal20 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(1, -1)).rgb);
      normal21 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(1, 0)).rgb);
      normal22 = luma(texture2D(tNormal, vUv + displacement + outlineThickness * texel * vec2(1, 1)).rgb);
    }

    float xSobelNormal =
      Sx[0][0] * normal00 + Sx[1][0] * normal10 + Sx[2][0] * normal20 +
    Sx[0][1] * normal01 + Sx[1][1] * normal11 + Sx[2][1] * normal21 +
    Sx[0][2] * normal02 + Sx[1][2] * normal12 + Sx[2][2] * normal22;

    float ySobelNormal =
      Sy[0][0] * normal00 + Sy[1][0] * normal10 + Sy[2][0] * normal20 +
      Sy[0][1] * normal01 + Sy[1][1] * normal11 + Sy[2][1] * normal21 +
      Sy[0][2] * normal02 + Sy[1][2] * normal12 + Sy[2][2] * normal22;

    float gradientNormal = sqrt(pow(xSobelNormal, 2.0) + pow(ySobelNormal, 2.0));

    float outline = gradientDepth * 25.0 + gradientNormal;

    float diffuseLight = normal.a;
    float pixelLuma = luma(pixelColor.rgb + diffuseLight * 0.65);

    if (shadowType == 1.0) {
      if(pixelLuma <= 0.35 && depth <= 0.99) {
        pixelColor = vec4(0.0, 0.0, 0.0, 1.0);
      }

      if (pixelLuma <= 0.45 && depth <= 0.99) {
        pixelColor = pixelColor * vec4(0.25, 0.25, 0.25, 1.0);
      }

      if (pixelLuma <= 0.6 && depth <= 0.99) {
        pixelColor = pixelColor * vec4(0.5, 0.5, 0.5, 1.0);
      }

      if (pixelLuma <= 0.75 && depth <= 0.99) {
        pixelColor = pixelColor * vec4(0.7, 0.7, 0.7, 1.0);
      }
    }

    // if(shadowType == 2.0) {
    //   const float rasterSize = 6.0;
    //   float raster = length(mod(vUv * resolution.xy, vec2(rasterSize)) / rasterSize - vec2(0.5));

    //   if(pixelLuma <= raster * 1.25 && depth <= 0.99) {
    //     pixelColor = vec4(0.0, 0.0, 0.0, 1.0);
    //   }
    // }

    float modVal = 11.0;

    if(shadowType == 3.0) {
      if (pixelLuma <= 0.35 && depth <= 0.99) {
        if (mod((vUv.y + displacement.y) * resolution.y , modVal)  < outlineThickness) {
          pixelColor = outlineColor;
        };
      }
      if (pixelLuma <= 0.55 && depth <= 0.99) {
        if (mod((vUv.x + displacement.x) * resolution.x , modVal)  < outlineThickness) {
          pixelColor = outlineColor;
        };

      }
      if (pixelLuma <= 0.80 && depth <= 0.99) {
        if (mod((vUv.x + displacement.x) * resolution.y + (vUv.y + displacement.y) * resolution.x, modVal) <= outlineThickness) {
          pixelColor = outlineColor;
        };
      }
    }

    if(normal.r >= 1.0 && normal.g >= 1.0 && normal.b >= 1.0) {
      pixelColor = vec4(1.0, 1.0, 1.0, 1.0);
    }

    vec4 color = mix(pixelColor, outlineColor, outline);

    gl_FragColor = color;
  }
  `,
};

class MoebiusPass extends Pass {
  material: THREE.ShaderMaterial;
  fsQuad: FullScreenQuad;

  constructor(options = {}) {
    super();

    // 合并默认uniforms和传入的options
    const uniforms = {
      ...moebiusShader.uniforms,  // 使用基础着色器的uniforms作为默认值
      cameraNear: { value: options.cameraNear || 0.1 },
      cameraFar: { value: options.cameraFar || 1000 },
      resolution: { value: options.resolution || new THREE.Vector2(1, 1) },
      shadowType: { value: options.shadowType || 1.0 },
      ...options.uniforms
    };

    const shader = {
      uniforms: uniforms,
      vertexShader: moebiusShader.vertexShader,
      fragmentShader: moebiusShader.fragmentShader,
    };

    this.material = new THREE.ShaderMaterial(shader);
    this.fsQuad = new FullScreenQuad(this.material);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }

  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    // 传递主要纹理
    this.material.uniforms.tDiffuse.value = readBuffer.texture;

    // 尝试获取深度纹理 - 但标准的EffectComposer不直接提供深度和法线纹理
    // 所以我们需要在着色器中处理缺失的情况

    // 从renderer获取当前视口尺寸
    this.material.uniforms.resolution.value.set(
      renderer.getSize(new THREE.Vector2()).width,
      renderer.getSize(new THREE.Vector2()).height
    );

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
      this.fsQuad.render(renderer);
    }
  }
}

export default MoebiusPass;
export { moebiusShader };
