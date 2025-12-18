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
    lamp: null as THREE.Mesh | null,
    sphere: null as THREE.Mesh | null,
  },
  materials: {
    box: null as THREE.Material | null,
    plane: null as THREE.Material | null
  },
  geometries: {
    box: null as THREE.BoxGeometry | null,
    plane: null as THREE.PlaneGeometry | null,
    sphere: null as THREE.SphereGeometry | null
  },
  lights: {
    ambient: null as THREE.AmbientLight | null,
    objSpot: null as THREE.SpotLight | null,
    point: null as THREE.PointLight | null,
    spot: null as THREE.SpotLight | null
  },
  targets:{
    objSpot: null as THREE.Object3D | null,
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
  // scene.background = new THREE.Color(0x2288cc);
  threeObjects.scene = scene;
  return scene;
}

function createGeometries() {
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  threeObjects.geometries.box = boxGeometry;

  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  threeObjects.geometries.sphere = sphereGeometry;

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
  shaderMaterial.uniforms.outlineThickness.value = 10.0;
  shaderMaterial.uniforms.objectColor.value = new THREE.Color(0xffe9c7); // 默认对象颜色
  // shaderMaterial.uniforms.tDiffuse.value = await loadTexture('/src/assets/textures/Worn_1K_BaseColor.jpg');
  // shaderMaterial.uniforms.tNormal.value = await loadTexture('/src/assets/textures/Worn_1K_Normal.jpg');
  // shaderMaterial.uniforms.tDepth.value = await loadTexture('/src/assets/textures/Worn_1K_Displacement.jpg');
  const boxMaterial = shaderMaterial.clone();
  // 为盒子设置不同的颜色

  threeObjects.materials.box = boxMaterial;

  // const planeMaterial = shaderMaterial.clone();
  const planeMaterial = new THREE.MeshPhysicalMaterial({
    side: THREE.DoubleSide,
    map: await createRepeatTextures('/src/assets/textures/checker.png', 40),
    ior: 0.15,
    metalness: 0.4,
    roughness: 0.4,
    transparent: true,
    clearcoat: 0.8,
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
  threeObjects.meshes.box = boxMesh;
  // scene.add(boxMesh);

  const sphereGeometry = threeObjects.geometries.sphere as THREE.SphereGeometry;
  const sphereMesh = new THREE.Mesh(sphereGeometry, boxMaterial);
  sphereMesh.position.set(30, 16, 0);
  sphereMesh.scale.set(10,10,10);
  threeObjects.meshes.sphere = sphereMesh;
  scene.add(sphereMesh);

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
  return { boxMesh, planeMesh };
}

function addTracker(scene: THREE.Scene,object: THREE.Object3D,name:string){
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  const mesh = new THREE.Mesh(sphereGeometry, material);
  mesh.position.set(object.position.x, object.position.y, object.position.z);
  // @ts-expect-error 缺少属性
  threeObjects.tracker[name] = mesh;
  scene.add(mesh);
}
function updateTracker(object: THREE.Object3D,name:string){
  // @ts-expect-error 缺少属性
  threeObjects.tracker[name].position.set(object.position.x, object.position.y, object.position.z);
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
function createAmbientLight(scene: THREE.Scene,intense:number) {
  const ambientLight = new THREE.AmbientLight(0x333333, intense??0.1);
  scene.add(ambientLight);
  threeObjects.lights.ambient = ambientLight;
}

function createDirectionalLight(scene: THREE.Scene,intense:number) {
    const directionalLight = new THREE.DirectionalLight(0xffffff, intense);
    scene.add(directionalLight);
    return directionalLight;
}
function createSpotLight(scene: THREE.Scene,intense:number,lookAt:THREE.Vector3,color:number,options:object,name:string){
  if(!options){
    options = {
      distance: 0,
      angle: Math.PI / 2,
      penumbra: 1.5,
      decay: 1.5,
    };
  }
  // @ts-expect-error 缺少属性
  const spotLight = new THREE.SpotLight(color, intense,options.distance, options.angle, options.penumbra, options.decay);
  const target = new THREE.Object3D();
  target.position.set(lookAt.x, lookAt.y, lookAt.z);
  spotLight.target = target;
  // @ts-expect-error 缺少属性
  threeObjects.targets[name] = target;
  // @ts-expect-error 缺少属性
  threeObjects.lights[name] = spotLight;

  scene.add(target);
  scene.add(spotLight);
  return spotLight;
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
  // createLights(scene,'ambient');
  createAmbientLight(scene,3);
  createSpotLight(scene,100,new THREE.Vector3(8,0,0),0xffd294,{},'spot')
  if(threeObjects.lights.spot){
    threeObjects.lights.spot.position.set(3.5,20,0)
  }
  // threeObjects.lights.objSpot = createLights(scene,'directional') as THREE.DirectionalLight;
  threeObjects.lights.objSpot = createSpotLight(scene,1000,new THREE.Vector3(0,0,0),0xffffff,{},'objSpot');
  threeObjects.lights.objSpot.position.set(60, 60, 60);
  // threeObjects.lights.objSpot.target.position.set(0, 0, 0);
  // 修复未使用变量的问题
  await createMeshes(scene);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const camera = createCamera(width, height);

  addTracker(scene,threeObjects.lights.objSpot,'directional');
  // 更新所有使用着色器的对象的uniforms
  const updateShaderUniforms = (material: THREE.ShaderMaterial,type:string) => {
    if (material && material.uniforms) {
      material.uniforms.resolution.value = new THREE.Vector2(width, height);
      material.uniforms.cameraNear.value = camera.near;
      material.uniforms.cameraFar.value = camera.far;
      if(type==='outline'){
        material.uniforms.lightPosition.value = threeObjects.lights.objSpot?.position;
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
  if(threeObjects.lights.objSpot){
    // 以点(5, 0, 5)为中心旋转
    const centerX = threeObjects.meshes.box?.position.x || 5.0;
    const centerZ = threeObjects.meshes.box?.position.z || 5.0;

    const x = threeObjects.lights.objSpot.position.x;
    const z = threeObjects.lights.objSpot.position.z;

    // 平移到以旋转中心为原点的坐标系
    const relX = x - centerX;
    const relZ = z - centerZ;

    // 绕Y轴旋转
    threeObjects.lights.objSpot.position.x = relX * Math.cos(0.01) - relZ * Math.sin(0.01) + centerX;
    threeObjects.lights.objSpot.position.z = relX * Math.sin(0.01) + relZ * Math.cos(0.01) + centerZ;
    threeObjects.lights.objSpot.target.position.copy(threeObjects.meshes.box?.position?? new THREE.Vector3(0,0,0));
    threeObjects.targets.objSpot?.position.copy(threeObjects.meshes.box?.position?? new THREE.Vector3(0,0,0));
    updateTracker(threeObjects.lights.objSpot,'directional')
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
  if (threeObjects.lights.objSpot) {
    directionalLightFolder.add(threeObjects.lights.objSpot, 'intensity', 0, 2);
    directionalLightFolder.add(threeObjects.lights.objSpot.position, 'x', -100, 100);
    directionalLightFolder.add(threeObjects.lights.objSpot.position, 'y', -100, 100);
    directionalLightFolder.add(threeObjects.lights.objSpot.position, 'z', 0,100)
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
