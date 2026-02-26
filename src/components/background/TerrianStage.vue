<template>
  <div>
    <canvas ref="canvasRef"></canvas>
    <div class="test-window" v-if="generatedTexture">
      <img :src="generatedTexture || ''" alt="">
    </div>
  </div>
</template>
<script setup lang="ts">
import * as THREE from 'three';
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useThemeStore } from '../../stores/theme.ts';
import { ColorInterpolator } from './utils/ColorInterpolator';
import { OrbitControls } from 'three-stdlib';
import type { GLObject } from './entities/Terrarin.ts';
import { Terrarin } from './entities/Terrarin.ts';
import { GLTFLoader, DRACOLoader } from 'three-stdlib';
import {LightHouseShader, LightConeShader} from './shaders/lighthouse.ts';

const themeStore = useThemeStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
// 使用 shallowRef 替代 ref，避免 Vue 深层代理 Three.js 对象
const terrain = shallowRef<Terrarin | null>(null);
const clock = ref(new THREE.Clock());

// 创建一个便捷的 getter 函数，这样可以直接使用 terrainRef 而不是 terrain.value
const terrainRef = () => terrain.value!;
// 保存 GLObject 引用以便在主题切换时使用
const glObjRef = shallowRef<GLObject | null>(null);
const currentTheme = ref<'light' | 'dark'>(themeStore.isDarkMode ? 'dark' : 'light');
const generatedTexture = ref<string | null>(null);
// 颜色渐变相关变量
const isColorTransitioning = ref(false);
const colorTransitionStart = ref<number>(0);
const colorTransitionDuration = 0.4; // 过渡时间 1 秒
const fromColor = new THREE.Color();
const toColor = new THREE.Color();
const currentBgColor = new THREE.Color();
const seaLevel = ref(0);
const lightHousePos = new THREE.Vector3(0, 0, 0);

// 添加地形变形相关变量
const seaAnimationStartTime = ref<number>(0.0),
      isSeaAnimating = ref(false),

      terrainAnimationStartTime = ref<number>(0),
      terrainAnimationDuration = 3.0, // 变形持续时间 3 秒
      isTerrainAnimating = ref(true),

      lightHouseAnimationStartTime = ref<number>(0),
      isLightHouseAnimating = ref(false),
      isLightHouseSet = ref(false),

      lightConeAnimationStartTime = ref<number>(0),
      isLightConeAnimating = ref(false),
      isLightConeSet = ref(false);



defineOptions({
  name: 'TerrainStage'
})
const genHeight = ref(50); // 将genHeight提升为组件级别响应式变量

function setupStage() {
  return new Promise(async (resolve) => {
    const lightManager = new THREE.Group();
    lightManager.name = "lightManager"
    const objects = new THREE.Group();
    objects.name = "objects"
    const scene = new THREE.Scene();
    const stage = new THREE.Group();
    scene.add(stage);
    const cameraNear = 0.1;
    const cameraFar = 1;
    const resolution = [window.innerWidth, window.innerHeight];
    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      cameraNear,
      cameraFar
    );
    camera.position.set( 0, 5, 10 );
    camera.lookAt(0,0,0);
    scene.add(camera);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value as HTMLCanvasElement,
      antialias: true,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    terrain.value = new Terrarin(100, 30, resolution);

    const terrainMesh = terrainRef().getMesh();
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    stage.add(terrainMesh);

    // 设置地形变形初始状态为平面 (0) - 这样动画会从平面变为地形
    terrainRef().setMorphInfluence(0);

    // 自动调整相机以适应网格
    adjustCameraToFitMesh(camera as THREE.PerspectiveCamera, terrainMesh);

    const box = new THREE.Box3().setFromObject(terrainMesh);
    const boxSize = box.getSize(new THREE.Vector3());

    const fog = new THREE.Fog(0x000000, cameraNear, boxSize.z * 0.8);
    scene.fog = fog;

    // spotLight.position.set(camera.position.x, camera.position.y, camera.position.z);
    // 聚光灯辅助器已经在上面添加过了

    // objects.add(directionalLightHelper);
    scene.add(objects);

    const controls = new OrbitControls(camera, canvasRef.value as HTMLCanvasElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enableZoom = !false;
    controls.enableRotate = !false;
    controls.rotateSpeed = 0.5;
    controls.enablePan = false;
    controls.update();
    renderer.setClearColor(0x000000, 0.0); // 黑色背景，完全透明

    const GLObj : GLObject = {
      scene,
      lightManager,
      objects,
      controls,
      renderer,
      camera,
    }
    resolve(GLObj)
  })
}

// 添加一个函数来调整相机以适应网格
function adjustCameraToFitMesh(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh) {
  // 计算网格的边界框
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3()); // 获取网格中心
  const size = box.getSize(new THREE.Vector3()); // 获取网格大小

  // 计算网格的最大尺寸
  const maxSize = Math.max(size.x, size.y, size.z);

  // 计算相机距离，以确保网格适合视野
  // 使用视野角度和网格大小来计算合适的距离
  const fov = camera.fov * (Math.PI / 180); // 转换为弧度
  let cameraDistance = maxSize / 2 / Math.tan(fov / 2);

  // 添加一点边距，确保网格完全适合视图
  cameraDistance *= 1.5; // 增加边距

  // 调整相机位置，使其看向网格中心
  const direction = camera.position.clone().normalize(); // 保留当前相机的方向
  camera.position.copy(direction.multiplyScalar(cameraDistance));
  camera.position.add(center);
  camera.position.y += 10;
  camera.lookAt(center);

  // 修复相机的近远裁剪面设置
  camera.near = 0.1; // 使用合理的近裁剪面
  camera.far = cameraDistance * 10; // 增加远裁剪面距离
  camera.updateProjectionMatrix();
}

async function startUpStage(gl:GLObject) {

  // 保存 GLObject 引用
  glObjRef.value = gl;
  glObjRef.value.scene.background = null;
  // 初始化背景颜色
  if (terrainRef().mask){
    generatedTexture.value = terrainRef().mask.getImage();
  }
  const { scene, camera, renderer, controls, objects, lightManager} = glObjRef.value as GLObject;
  seaLevel.value = terrainRef().maxDepth * 0.3;
  const seaWidth = terrainRef().width;

  // 创建海面网格
  const seaGeometry = new THREE.PlaneGeometry(seaWidth, seaWidth, 100, 100);

  // 导入波浪着色器
  import('./shaders/waves').then(({ WaveShader }) => {
    const seaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...WaveShader.uniforms,
        uColor: { value: new THREE.Color(0x005577) },
        uAlpha: { value: 0.0 },
        uLightPosition: { value: new THREE.Vector3(0, 10, 0) }, // 默认光源位置
        uLightColor: { value: new THREE.Color(0xffffff) }, // 默认光源颜色
        uShininess: { value: 2.0 }, // 镜面反射强度
        uSpecularStrength: { value: 0.2 }, // 镜面反射系数
      },
      vertexShader: WaveShader.vertexShader,
      fragmentShader: WaveShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      // wireframe: true,
    });

    const sea = new THREE.Mesh(seaGeometry, seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 0, 0);
    // sea.castShadow = true;
    sea.receiveShadow = true;
    // sea.scale.set(3, 1, 3);
    sea.name = "sea";
    scene.add(sea);
  });

  const lighthouse = new THREE.Group();
  // const lightHouseMesh = new THREE.Mesh(
  //   new THREE.BoxGeometry(1, 3, 1),
  //   new THREE.MeshBasicMaterial({ color: 0xffffff })
  // );
  // load glb
  const loaderFunction  = async () => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./lib/draco/gltf/');
    loader.setDRACOLoader(dracoLoader);
    const gltf = await loader.loadAsync('/src/assets/model/lighthouse.glb');

    const lightHouseMesh = gltf.scene.children[0] as THREE.Mesh;

    // 使用正确的路径格式 - 从public目录访问
    const texturePath = '/src/assets/textures/Lighthouse_AlphaMap.png';
    // const texturePath = '/src/assets/textures/Worn_1K_BaseColor.jpg';

    // 创建纹理加载器并使用onLoad回调确保加载完成
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      texturePath,
      // onLoad回调：纹理加载完成后执行
      (loadedTexture) => {
        loadedTexture.flipY = false
        loadedTexture.needsUpdate = true;

        // 确保在下一帧渲染前更新材质
        requestAnimationFrame(() => {
          if (lightHouseMesh) {

            lightHouseMesh.material = new THREE.ShaderMaterial({
              uniforms: {
                ...LightHouseShader.uniforms,
                tAlphaMap: { value: loadedTexture },
              },
              vertexShader: LightHouseShader.vertexShader,
              fragmentShader: LightHouseShader.fragmentShader,
              side: THREE.DoubleSide,
              transparent: true,
            });
          }
        });
      },
      undefined, // onProgress
      (error) => {
        console.error('AlphaMap纹理加载失败:', error);
        // 加载失败时使用默认材质
        if (lightHouseMesh) {
          lightHouseMesh.material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
          });
        }
      }
    );
    // 获取灯塔的世界矩阵（如果后续需要使用可以取消注释）
    // const lightHouseWorldMatrix = lightHouseMesh.matrixWorld;

    // 使用转换后世界坐标设置灯塔位置
    const lightHouseWorldPosition = terrainRef().getLightHouseWorldPosition();
    lighthouse.position.copy(lightHouseWorldPosition);
    lighthouse.position.y *= 0.8;
    lightHouseMesh.scale.set(1.2,1.2,1.2);
    // lighthouse.scale.set(4,4,4);
    const coneHeight = 20;
    const lightCone = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.2,      // radiusTop: 上平面半径（小口）
        1.5,     // radiusBottom: 下平面半径（大口）
        coneHeight,     // height: 高度
        32,     // radialSegments: 圆周分段数（越多越圆）
        4,      // heightSegments: 高度分段数
        false,  // openEnded: false = 封闭上下底
        0,      // thetaStart: 起始角度
        Math.PI * 2 // thetaLength: 完整圆
      ),
      new THREE.ShaderMaterial({
        uniforms: {
          ...LightConeShader.uniforms,
          uMaxHeight: { value: coneHeight },
        },
        vertexShader: LightConeShader.vertexShader,
        fragmentShader: LightConeShader.fragmentShader,
        transparent: true,
        // side: THREE.DoubleSide
      })
    );
    lightCone.geometry.computeBoundingBox();
    const lightConeHeight = lightCone.geometry.boundingBox?.getSize(new THREE.Vector3()).y as number;
    const offsetCenter = new THREE.Vector3(0,0,0);
    offsetCenter.z = lightConeHeight / 2;
    // lightCone.position.copy(offsetCenter);
    lightCone.rotation.x = Math.PI / 2;
    lightCone.position.z = -offsetCenter.z; // 本地
    const lightConeWrapper = new THREE.Object3D();

    lightConeWrapper.add(lightCone);
    lightConeWrapper.position.y = 6.5;
    lightConeWrapper.name = "lightConeWarp";
    lightConeWrapper.scale.set(0,0,0)
    // lightHouseMesh.name = "lightHouse";
    lighthouse.add(lightHouseMesh);
    lighthouse.add(lightConeWrapper);

    lightHousePos.copy(lighthouse.position);
    // 修复：不要将灯塔放到y=-1000的位置，而是保持在地形表面上
    lighthouse.position.y = -1000;
    lighthouse.scale.x = 0.1;
    objects.add(lighthouse);
    scene.add(lighthouse);


    // 添加聚光灯，增强地形的立体感
    const spotLight = new THREE.SpotLight(0xffffff, 1.0);
    spotLight.name = 'directionalLight'; // 保持原有名称以确保兼容性
    spotLight.angle = Math.PI / 32; // 设置聚光灯角度为30度
    spotLight.penumbra = 0.1; // 设置边缘柔和度
    spotLight.decay = 10; // 距离衰减
    spotLight.distance = genHeight.value * 2; // 设置照射距离

    // 将聚光灯添加到灯塔的lightConeWrapper中，而不是直接添加到场景
    if (lightConeWrapper) {
      // 设置聚光灯相对于lightConeWrapper的位置
      spotLight.position.set(0, 2, 0); // 相对于lightConeWrapper的局部位置
      lightConeWrapper.add(spotLight);

      // 设置聚光灯的目标也添加到lightConeWrapper中
      spotLight.target.position.set(0, -10, 0); // 相对于lightConeWrapper的目标位置
      lightConeWrapper.add(spotLight.target);
    }

    // 添加聚光灯辅助器来可视化光源位置和照射范围
    const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    spotLightHelper.name = 'spotLightHelper';
    lightConeWrapper.add(spotLightHelper);

    lightManager.add(spotLight);
    scene.add(lightManager);
  }
  await loaderFunction()



  const animate = () => {

    // 保存 animateId 到 GLObject
    gl.animateId = requestAnimationFrame(animate);
    renderer.setClearColor(0x000000, 0.0); // 黑色背景，完全透明
    // 更新控制器状态，确保 damping 等效果生效
    controls.update();

    // 更新聚光灯信息到海面材质
    const spotLight = lightManager.getObjectByName('directionalLight') as THREE.SpotLight;
    if (spotLight) {
      const sea = scene.getObjectByName("sea") as THREE.Mesh;
      if (sea && sea.material instanceof THREE.ShaderMaterial) {
        // 更新光源位置
        sea.material.uniforms.uLightPosition.value.copy(spotLight.position);
        // 更新光源颜色
        sea.material.uniforms.uLightColor.value.copy(spotLight.color);
      }
    }


    // 处理地形变形动画
    if (isTerrainAnimating.value) {
      const currentTime = performance.now();
      const progress = ColorInterpolator.calculateProgressWithEasing(
        terrainAnimationStartTime.value,
        currentTime,
        terrainAnimationDuration,
        ColorInterpolator.easeInOutQuad
      );

      if (progress >= 1) {
        isTerrainAnimating.value = false;
        // 地形动画完成后开始海面动画
        isSeaAnimating.value = true;
        seaAnimationStartTime.value = performance.now();
      } else {
        terrainRef().setMorphInfluenceWithDelay(progress, 30);
      }
    }

    // 确保灯塔始终可见并朝向相机
    if (lighthouse && camera && !isLightConeAnimating.value) {
      // const oldRotation = lighthouse.rotation
      // lighthouse.lookAt(camera.position);
      // lock xz rotation
      lighthouse.rotation.y = Math.atan2(camera.position.x - lighthouse.position.x, camera.position.z - lighthouse.position.z) + Math.PI / 2;
      // lighthouse.rotation.x = oldRotation.x
      // lighthouse.rotation.z = oldRotation.z

    }

    if (!isTerrainAnimating.value && isSeaAnimating.value) {
      // 海面透明度动画
      const sea = scene.getObjectByName("sea") as THREE.Mesh;
      if (sea) {
        const currentTime = performance.now();
        const progress = ColorInterpolator.calculateProgressWithEasing(
          seaAnimationStartTime.value,
          currentTime,
          3.0, // 1秒持续时间
          ColorInterpolator.easeInCubic
        );
        // 将透明度限制在0-0.3范围内
        const seaMaterial = sea.material as THREE.ShaderMaterial;
        seaMaterial.uniforms.uAlpha.value = Math.min(progress, 0.5);
        sea.position.y = seaLevel.value * progress;
        if (progress >= 1) {
          isSeaAnimating.value = false;
          seaAnimationStartTime.value = 0.0; // 重置开始时间
          lightHouseAnimationStartTime.value = performance.now();
          isLightHouseAnimating.value = true;
          // controls.target.copy(lightHousePosposition);
        }

      }
    } else {
      //sin 波
      const sea = scene.getObjectByName("sea") as THREE.Mesh;
      const seaMaterial = sea.material as THREE.ShaderMaterial;
      seaMaterial.uniforms.uTime.value = clock.value.getElapsedTime();

      if(isLightHouseSet.value){
        // 修复语法错误并确保lighthouse始终朝向相机
        const lightCone = lighthouse.getObjectByName('lightConeWarp') as THREE.Group;
        if(lightCone && !isLightConeSet.value){
          const progress = ColorInterpolator.calculateProgressWithEasing(
            lightConeAnimationStartTime.value,
            performance.now(),
            1,
            ColorInterpolator.easeInOutQuad
          );
          if (progress >= 1) {
            isLightConeSet.value = true;
            isLightConeAnimating.value = false;
          }else{
            lightCone.scale.set(progress, progress, progress);
          }
        }else{
          if (lightCone && !isLightHouseAnimating.value) {
            lightCone.rotation.y = (lightCone.rotation.y + 0.01) % (Math.PI * 2);
          }
        }
      }
    }
    if (isLightHouseAnimating.value) {
      // const lighthouseMesh = lightHouse.getObjectByName('lighthouse') as THREE.Mesh;

      runLightHouseAnimation(lighthouse);
    }
    // 处理颜色渐变
    if (isColorTransitioning.value && colorTransitionStart.value !== null) {
      const currentTime = performance.now();
      const progress = ColorInterpolator.calculateProgress(
        colorTransitionStart.value,
        currentTime,
        colorTransitionDuration
      );
      ColorInterpolator.interpolateColors(
        fromColor,
        toColor,
        progress,
        currentBgColor
      );

      if (progress >= 1) {
        isColorTransitioning.value = false;
      }
    }

    terrainRef().updateUniforms(glObjRef.value as GLObject);
    renderer.render(scene, camera);
  };

  // 开始地形变形动画
  isTerrainAnimating.value = true;
  terrainAnimationStartTime.value = performance.now();

  // 启动动画循环并保存 ID
  gl.animateId = requestAnimationFrame(animate);
}
function runLightHouseAnimation(lighthouse: THREE.Group){
  // debugger
  const progress = ColorInterpolator.calculateProgressWithEasing(
    lightHouseAnimationStartTime.value,
    performance.now(),
    3.0,
    ColorInterpolator.easeInOutQuad
  );
  if(progress >= 1){
    isLightHouseAnimating.value = false;
    isLightHouseSet.value = true;

    lightConeAnimationStartTime.value = performance.now();
    lightHouseAnimationStartTime.value = performance.now();
  }else{
    lighthouse.position.y = lightHousePos.y * progress;
    // 确保在动画过程中灯塔也朝向相机
    const { camera } = glObjRef.value as GLObject;
    // lighthouse.lookAt(camera.position);
  }
}
// 主题切换处理函数
function handleThemeChange(isDark: boolean) {
  const newTheme = isDark ? 'dark' : 'light';
  if (newTheme != currentTheme.value && glObjRef.value) {

    // 开始颜色过渡
    const oldTheme = currentTheme.value;
    fromColor.copy(new THREE.Color( oldTheme === 'light' ? '#f3f4f6' : '#1e1e1e'))
    toColor.set(newTheme === 'light' ? '#f3f4f6' : '#1e1e1e');

    currentTheme.value = newTheme;
    isColorTransitioning.value = true;
    colorTransitionStart.value = performance.now();
  }
}

themeStore.$onAction((action) => {
  if(action.name === 'toggleDarkMode'){
    handleThemeChange(action.args[0]);
  }
})

onMounted(() => {
  if(canvasRef.value){
    setupStage().then((gl) =>{
      startUpStage(gl as GLObject)
    })
  }
})

onUnmounted(() => {
  const gl = glObjRef.value;
  if (gl) {
    // 关键修复：取消动画循环
    if (gl.animateId !== undefined) {
      cancelAnimationFrame(gl.animateId);
    }

    // 清理控制器
    gl.controls.dispose();

    // 清理场景对象
    function disposeSceneObjects(object: THREE.Object3D) {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material?.dispose();
        }
      }
      for (let i = object.children.length - 1; i >= 0; i--) {
        disposeSceneObjects(object.children[i]);
        object.remove(object.children[i]);
      }
    }

    disposeSceneObjects(gl.scene);

    // 清理渲染器和 canvas
    if (gl.renderer) {
      gl.renderer.dispose();
      if (gl.renderer.domElement) {
        gl.renderer.domElement.remove();
      }
    }

    // 彻底清理 canvas 引用
    if (canvasRef.value) {
      canvasRef.value.remove();
      canvasRef.value = null;
    }

    // 清理地形对象
    if (terrain.value) {
      terrain.value.dispose?.();
      terrain.value = null;
    }

    // 清理引用
    glObjRef.value = null;
  }

  // 重置状态
  isColorTransitioning.value = false;
  isTerrainAnimating.value = false;
})


</script>
<style lang="scss" scoped>
.test-window{
  position: fixed !important;
  z-index: 9999;
  padding-top: 5rem;
  padding-left: 2rem;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 9999;
  img{
    min-width: 15rem;
  }
}
</style>
