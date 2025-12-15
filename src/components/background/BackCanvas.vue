<template>
  <div id='three-canvas'></div>
  <div id='gui'>
    <n-button @click="resetControls" class="float-btn">Reset</n-button>
  </div>
</template>
<script setup lang="ts">
  /* eslint-disable-next-line */
import { onMounted, reactive, ref, watchEffect } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { SketchOutlineShader } from './shaders/moebius';
interface MeshRefValue {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
}

// 创建一个对象来管理所有的Three.js对象
const threeObjects = reactive({
  scene: null as THREE.Scene | null,
  camera: null as THREE.PerspectiveCamera | null,
  renderer: null as THREE.WebGLRenderer | null,
  controls: null as OrbitControls | null,
  textures: {
    box: null as THREE.Texture | null,
    plane: null as THREE.Texture | null
  },
  meshes: {
    box: null as THREE.Mesh | null,
    plane: null as THREE.Mesh | null,
    lamp: null as THREE.Mesh | null
  },
  materials: {
    box: null as THREE.Material | null,
    plane: null as THREE.Material | null
  },
  geometries: {
    box: null as THREE.BoxGeometry | null,
    plane: null as THREE.PlaneGeometry | null
  },
  lights: {
    ambient: null as THREE.AmbientLight | null,
    directional: null as THREE.DirectionalLight | null,
    point: null as THREE.PointLight | null,
    spot: null as THREE.SpotLight | null
  },
  tracker:{
    spotTracker: null as THREE.Mesh | null,
  }
});

const meshRef = ref<MeshRefValue | null>(null);

onMounted(async () => {
  meshRef.value = await initStage();
  initPanel();
})
function resetControls() {
  if (threeObjects.controls) {
    threeObjects.controls.reset();
  }
  if (threeObjects.meshes.box) {
    threeObjects.meshes.box.position.set(0, 16, 0);
  }
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2288cc);
  threeObjects.scene = scene;
  return scene;
}

function createGeometries() {
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  threeObjects.geometries.box = boxGeometry;

  const planeGeometry = new THREE.PlaneGeometry(100, 100);
  threeObjects.geometries.plane = planeGeometry;


  return { boxGeometry, planeGeometry };
}
function createRepeatTextures(url: string, repeat: number): Promise<THREE.Texture> {
  // 返回一个Promise，确保纹理完全加载
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(url, () => {
      // onLoad回调，纹理加载完成后调用
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.magFilter = THREE.NearestFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.repeat.set(repeat, repeat);
      texture.needsUpdate = true;
      resolve(texture);
    });
  });
}

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(url, () => {
      // 纹理加载完成
      texture.needsUpdate = true;
      resolve(texture);
    });
  });
}

async function createMaterials() {
  // const boxMaterial = new THREE.MeshPhongMaterial({
  //   side: THREE.DoubleSide,
  //   map: await createRepeatTextures('/src/assets/textures/concrete.png', 1),
  //   normalMap: await loadTexture('/src/assets/textures/concrete-normal-map.png'),
  //   aoMap: await loadTexture('/src/assets/textures/concrete-ao-map.png'),
  //   // displacementMap: loadTexture('/src/assets/textures/concrete-displacement-map.png'),
  //   // roughness : 1,
  //   // metalness:0,
  //   // clearcoat: 0,
  // });
  // const boxMaterial = new THREE.MeshPhysicalMaterial({
  //   metalness: .9,
  //   roughness: .05,
  //   envMapIntensity: 0.9,
  //   clearcoat: 1,
  //   transparent: true,
  //   opacity: .5,
  //   reflectivity: 0.2,
  //   ior: 0.9,
  //   side: THREE.BackSide,
  //   })
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(SketchOutlineShader.uniforms),
    vertexShader: SketchOutlineShader.vertexShader,
    fragmentShader: SketchOutlineShader.fragmentShader,
  });

  // 设置默认属性
  shaderMaterial.uniforms.outlineColor.value = new THREE.Color(0x333333);
  shaderMaterial.uniforms.outlineThickness.value = 1.0;
  shaderMaterial.uniforms.objectColor.value = new THREE.Color(0xcccccc); // 默认对象颜色
  shaderMaterial.uniforms.tDiffuse.value = await loadTexture('/src/assets/textures/Worn_1K_BaseColor.jpg');
  shaderMaterial.uniforms.tNormal.value = await loadTexture('/src/assets/textures/Worn_1K_Normal.jpg');
  shaderMaterial.uniforms.tDepth.value = await loadTexture('/src/assets/textures/Worn_1K_Displacement.jpg');
  const boxMaterial = shaderMaterial.clone();
  // 为盒子设置不同的颜色

  threeObjects.materials.box = boxMaterial;

  // const planeMaterial = shaderMaterial.clone();
  const planeMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    map: await createRepeatTextures('/src/assets/textures/checker.png', 40),
  });
  // // 为平面设置不同的颜色
  // planeMaterial.uniforms.objectColor.value = new THREE.Color(0x9E9E9E); // 灰色
  threeObjects.materials.plane = planeMaterial;

  // 使用普通材质给灯具
  const lampMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
  });

  return { boxMaterial, planeMaterial, lampMaterial };
}

function loadGLB(url: string,scene:THREE.Scene){
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/public/lib/draco/gltf/draco_decoder.js');
  loader.setDRACOLoader(dracoLoader);
  return new Promise((resolve) => {
    loader.load(url, (gltf) => {
      gltf.scene.scale.set(1,1,1);
      scene.add(gltf.scene);
      resolve(gltf.scene.children[0]);
    }, () => {
      // progress
      // console.debug(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
    }, (error) => {
      console.error('加载失败:', error);
    });
  })
}
async function createMeshes(scene: THREE.Scene) {
  const { boxGeometry, planeGeometry } = createGeometries();
  const { boxMaterial, planeMaterial, lampMaterial } = await createMaterials();

  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.position.set(30, 16, 0);
  boxMesh.scale.set(30,30,30);
  boxMesh.castShadow = true; // 启用投影
  threeObjects.meshes.box = boxMesh;
  scene.add(boxMesh);

  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  // 注意：这里修正了原代码中的问题，应该是对planeMesh进行scale操作而不是plane几何体
  planeMesh.scale.set(100, 100, 100);
  planeMesh.receiveShadow = true; // 接收阴影
  scene.add(planeMesh);
  threeObjects.meshes.plane = planeMesh;
  planeMesh.rotateX(Math.PI / 2);

  const lamp = await loadGLB('/src/assets/model/lamp.glb',scene) as THREE.Mesh;

  const oglampMat = lamp.material as THREE.MeshPhysicalMaterial;
  lamp.material = lampMaterial;
  // 修复类型错误
  if ('map' in oglampMat && oglampMat.map) {
    (lamp.material as THREE.MeshPhysicalMaterial).map = oglampMat.map;
  }
  threeObjects.meshes.lamp = lamp;

  lamp.scale.set(30,30,30);
  lamp.castShadow = true; // 启用投影

  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  const spotMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  const spotMesh = new THREE.Mesh(sphereGeometry, spotMaterial);
  spotMesh.position.set(0,0,0);
  threeObjects.tracker.spotTracker = spotMesh;
  // scene.add(spotMesh);

  return { boxMesh, planeMesh };
}
function createCamera(width: number, height: number) {
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 3000);
  camera.position.set(200, 10, 200);
  camera.lookAt(0, 0, 0);
  threeObjects.camera = camera;
  return camera;
}

function createRenderer(width: number, height: number) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(width, height);
  threeObjects.renderer = renderer;
  return renderer;
}
function createAmbientLight(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  threeObjects.lights.ambient = ambientLight;

}

function createDirectionalLight(scene: THREE.Scene,intense:number) {
    // 添加方向光，这是Phong材质必需的
    const directionalLight = new THREE.DirectionalLight(0xffffff, intense);
    directionalLight.position.set(30, 20, 30);
    directionalLight.castShadow = true;
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);
    return directionalLight;
}
function createSpotLight(scene: THREE.Scene,intense:number,lookAt:THREE.Vector3,color:number) {
  const spotLight = new THREE.SpotLight(color, intense,0,Math.PI/2, 1.5, 1.5);
  const target = new THREE.Object3D();
  target.position.set(lookAt.x, lookAt.y, lookAt.z);
  scene.add(target);
  spotLight.target = target;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 500;
  spotLight.shadow.camera.far = 4000;
  spotLight.shadow.camera.fov = 30;
  threeObjects.lights.spot = spotLight;
  scene.add(spotLight);
}
function createLights(scene: THREE.Scene,type:string) {
  if (!type){
    return
  }
  if(type==='ambient'){
    return createAmbientLight(scene);
  } else if (type === 'directional') {
    return createDirectionalLight(scene,1);
  }
}
function createControlsForMesh(mesh:THREE.Mesh){
  // 创建一个对象来跟踪按键状态
  const keys: Record<string, boolean> = {};

  // 监听键盘事件并更新按键状态
  window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
  });

  window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
  });

  // 在动画循环中处理键盘输入
  const handleKeyboardInput = () => {
    if (keys['w'] || keys['W']) {
      mesh.position.z -= 1;
    }
    if (keys['s'] || keys['S']) {
      mesh.position.z += 1;
    }
    if (keys['a'] || keys['A']) {
      mesh.position.x -= 1;
    }
    if (keys['d'] || keys['D']) {
      mesh.position.x += 1;
    }
  };

  // 将键盘输入处理函数返回，以便在动画循环中调用
  return handleKeyboardInput;
}

async function initStage(){
  const scene = createScene();
  createLights(scene,'ambient');
  createSpotLight(scene,100,new THREE.Vector3(8,0,0),0xffd294)
  if(threeObjects.lights.spot){
    threeObjects.lights.spot.position.set(3.5,20,0)
  }
  threeObjects.lights.directional = createLights(scene,'directional') as THREE.DirectionalLight;

  // 修复未使用变量的问题
  await createMeshes(scene);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const camera = createCamera(width, height);

  // 更新所有使用着色器的对象的uniforms
  const updateShaderUniforms = (material: THREE.ShaderMaterial,type:string) => {
    if (material && material.uniforms) {
      material.uniforms.resolution.value = new THREE.Vector2(width, height);
      material.uniforms.cameraNear.value = camera.near;
      material.uniforms.cameraFar.value = camera.far;
      if(type==='outline'){
        material.uniforms.lightPosition.value = threeObjects.lights.directional?.position;
      }
    }
  };

  const boxMat = threeObjects.materials.box as THREE.ShaderMaterial;
  const planeMat = threeObjects.materials.plane as THREE.ShaderMaterial;
  // const lampMat = threeObjects.materials.lamp as THREE.ShaderMaterial;

  if(boxMat) updateShaderUniforms(boxMat,'outline');
  if(planeMat) updateShaderUniforms(planeMat,'');
  // if(lampMat) updateShaderUniforms(lampMat);

  const renderer = createRenderer(width, height);
  // renderer.render(scene, camera);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用软阴影

  renderer.setAnimationLoop(() => {
    // 处理键盘输入
    handleKeyboardInput();

    updateThreeObjects();
    // 更新控制器
    if (controls) {
      controls.update();
    }

    // 更新所有着色器材质的uniforms
    const updateShaderUniforms = (material: THREE.ShaderMaterial) => {
      if (material && material.uniforms) {
        material.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
        if (camera) {
          material.uniforms.cameraNear.value = camera.near;
          material.uniforms.cameraFar.value = camera.far;
        }
      }
    };

    // 更新所有对象的着色器uniforms
    if (threeObjects.materials.box instanceof THREE.ShaderMaterial) {
      updateShaderUniforms(threeObjects.materials.box);
    }

    if (threeObjects.materials.plane instanceof THREE.ShaderMaterial) {
      updateShaderUniforms(threeObjects.materials.plane);
    }

    if (scene && camera) {
      renderer.render(scene, camera);
    }
  })
  document.querySelector('#three-canvas')?.appendChild(renderer.domElement);

  // 添加 OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.zoomSpeed = 3;
  controls.screenSpacePanning = false;
  controls.minDistance = 10;
  controls.maxDistance = 500;
  controls.maxPolarAngle = Math.PI / 2 - 0.1
  controls.minPolarAngle = 0
  threeObjects.controls = controls;

  // 确保box mesh已经创建后再传递给createControlsForMesh
  let handleKeyboardInput = () => {}; // 默认空函数
  if (threeObjects.meshes.box) {
    handleKeyboardInput = createControlsForMesh(threeObjects.meshes.box);
  }

  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  });

  return reactive({
    mesh: threeObjects.meshes.box as THREE.Mesh,
    material: threeObjects.materials.box as THREE.MeshBasicMaterial,
  });
};
function updateThreeObjects(){
  if(threeObjects.tracker.spotTracker && threeObjects.lights.spot){
    threeObjects.tracker.spotTracker.position.copy(threeObjects.lights.spot.position);
  }
  if(threeObjects.lights.directional){
    // rotate arond 0,0,0
    const x = threeObjects.lights.directional.position.x;
    const y = threeObjects.lights.directional.position.y;
    const z = threeObjects.lights.directional.position.z;
    threeObjects.lights.directional.position.x = x * Math.cos(0.01) - z * Math.sin(0.01);
    threeObjects.lights.directional.position.z = x * Math.sin(0.01) + z * Math.cos(0.01);
    threeObjects.lights.directional.lookAt(0,0,0);
  }
};
function initPanel(){
  /* eslint-disable-next-line */
  const gui = new GUI({title: 'Panel'});

  // 材质设置文件夹
  const materialFolder = gui.addFolder('Material Settings');

  // 着色器设置文件夹
  const shaderFolder = gui.addFolder('Shader Settings');
  shaderFolder.close();

  // 获取着色器材质
  const boxMat = threeObjects.materials.box as THREE.ShaderMaterial;
  const planeMat = threeObjects.materials.plane as THREE.ShaderMaterial;

  if (boxMat && boxMat.uniforms) {
    // 轮廓设置
    shaderFolder.add(boxMat.uniforms.outlineThickness, 'value', 0, 5).name('Outline Thickness');
    shaderFolder.addColor(boxMat.uniforms.outlineColor, 'value').name('Outline Color');

    // 对象颜色设置
    materialFolder.addColor(boxMat.uniforms.objectColor, 'value').name('Box Color').onChange((value) => {
      if (planeMat && planeMat.uniforms) {
        planeMat.uniforms.objectColor.value.set(value);
      }
    });

    // 抖动效果设置
    shaderFolder.add(boxMat.uniforms.wiggleFrequency, 'value', 0, 0.5).name('Wiggle Frequency');
    shaderFolder.add(boxMat.uniforms.wiggleAmplitude, 'value', 0, 10).name('Wiggle Amplitude');
  }

  const spotLightFolder = gui.addFolder('Spot Light');
  if (threeObjects.lights.spot) {
    spotLightFolder.add(threeObjects.lights.spot, 'intensity', 0, 1000);
    spotLightFolder.add(threeObjects.lights.spot.position, 'x', -100, 100);
    spotLightFolder.add(threeObjects.lights.spot.position, 'y', -100, 100);
    spotLightFolder.add(threeObjects.lights.spot.position, 'z', -100, 100);
    spotLightFolder.addColor(threeObjects.lights.spot, 'color').onChange((value) => {
      if (threeObjects.lights.spot) {
        threeObjects.lights.spot.color.set(value);
      }
    });
  }

  // 创建一个控制DirectionalLight文件夹
  const directionalLightFolder = gui.addFolder('Directional Light');
  if (threeObjects.lights.directional) {
    directionalLightFolder.add(threeObjects.lights.directional, 'intensity', 0, 2);
    directionalLightFolder.add(threeObjects.lights.directional.position, 'x', -100, 100);
    directionalLightFolder.add(threeObjects.lights.directional.position, 'y', -100, 100);
    directionalLightFolder.add(threeObjects.lights.directional.position, 'z', 0,100)
  }
};

</script>

<style scoped>
#three-canvas {
  width: 100%;
  height: 100%;
  /* opacity: 0.3; */
  z-index: -1;
}

.float-btn{
  position: absolute;
  right: 20px;
  bottom: 1rem;
  z-index: 999;
  background: #fff;
  padding: 0.1rem 1rem;
  color: black;
}
</style>
