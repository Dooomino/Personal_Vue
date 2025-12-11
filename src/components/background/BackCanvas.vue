<template>
  <div id='three-canvas'></div>
  <div id='gui'>
    <n-button @click="resetControls" class="float-btn">Reset</n-button>
  </div>
</template>
<script setup lang="ts">
  /* eslint-disable-next-line */
import { onMounted, reactive, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

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
    plane: null as THREE.Mesh | null
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
    ambient: null as THREE.AmbientLight | null
  }
});

const meshRef = ref<MeshRefValue | null>(null);

onMounted(() => {
  meshRef.value = initStage();
  initPanel();
})
function resetControls() {
  if (threeObjects.controls) {
    threeObjects.controls.reset();
  }
  if (threeObjects.meshes.box) {
    threeObjects.meshes.box.position.set(0, 15.1, 0);
  }
}

function createScene() {
  const scene = new THREE.Scene();
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
function createRepeatTextures(url:string,repeat:number){
  // 使用public目录中的纹理文件
  const loader = new THREE.TextureLoader();
  const texture = loader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(repeat, repeat);
  return texture;
}
function createMaterials() {
  const boxMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    map: createRepeatTextures('/src/assets/textures/checker.png',4)
  });
  threeObjects.materials.box = boxMaterial;

  // const planeMaterial = new THREE.MeshBasicMaterial({
  //   color: 0x999999,
  //   side: THREE.DoubleSide
  // });
  const planeMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    map: createRepeatTextures('/src/assets/textures/checker.png',40)
  });

  threeObjects.materials.plane = planeMaterial;

  return { boxMaterial, planeMaterial };
}

function createMeshes(scene: THREE.Scene) {
  const { boxGeometry, planeGeometry } = createGeometries();
  const { boxMaterial, planeMaterial } = createMaterials();

  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.position.set(0, 15.1, 0);
  boxMesh.scale.set(30,30,30);
  threeObjects.meshes.box = boxMesh;
  scene.add(boxMesh);

  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  // 注意：这里修正了原代码中的问题，应该是对planeMesh进行scale操作而不是plane几何体
  planeMesh.scale.set(100, 100, 100);
  scene.add(planeMesh);
  threeObjects.meshes.plane = planeMesh;
  planeMesh.rotateX(Math.PI / 2);

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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  threeObjects.lights.ambient = ambientLight;

}

function createDirectionalLight(scene: THREE.Scene) {
    // 添加方向光，这是Phong材质必需的
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 200, 10);
    directionalLight.castShadow = true;
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);
}
function createLights(scene: THREE.Scene,type:string) {
  if (!type){
    return
  }
  if(type==='ambient'){
    createAmbientLight(scene);
  } else if (type === 'directional') {
    createDirectionalLight(scene);
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

function initStage(){
  const scene = createScene();
  createLights(scene,'ambient');
  createLights(scene,'directional');

  const meshes = createMeshes(scene);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const camera = createCamera(width, height);

  const renderer = createRenderer(width, height);
  // renderer.render(scene, camera);

  document.querySelector('#three-canvas')?.appendChild(renderer.domElement);

  // 添加 OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 100;
  controls.maxDistance = 500;
  controls.maxPolarAngle = Math.PI / 2 - 0.1
  controls.minPolarAngle = 0
  threeObjects.controls = controls;

  // 确保box mesh已经创建后再传递给createControlsForMesh
  let handleKeyboardInput = () => {}; // 默认空函数
  if (meshes.boxMesh) {
    handleKeyboardInput = createControlsForMesh(meshes.boxMesh);
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

  /* eslint-disable-next-line */
  const animate = () => {
    requestAnimationFrame(animate);

    // 处理键盘输入
    handleKeyboardInput();

    // 更新控制器
    if (controls) {
      controls.update();
    }

    if (scene && camera) {
      renderer.render(scene, camera);
    }
  };

  animate();
  return reactive({
    mesh: meshes.boxMesh,
    material: threeObjects.materials.box as THREE.MeshBasicMaterial,
  });
};

function initPanel(){
  /* eslint-disable-next-line */
  const gui = new GUI({title: 'Panel'});
  const obj = {
    color: '#ff0000',
    speed: 2.5,
    isVisible: false
  }
  //添加颜色选择器，默认色值为'#ff0000'
  gui.addColor(obj,'color').onChange((value) => {
    if (meshRef.value) {
      const material = meshRef.value.mesh.material;
      if (Array.isArray(material)) {
        (material[0] as THREE.MeshBasicMaterial).color.set(value);
      } else {
        (material as THREE.MeshBasicMaterial).color.set(value);
      }
    }
  });

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
