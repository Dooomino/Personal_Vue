import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  EffectComposer,
  RenderPass,
  ShaderPass,
  OutlinePass
} from 'three/examples/jsm/Addons.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { Stage } from './entities/Stage';
import { LightManager } from './managers/LightManager';

export class BackCanvas {
  canvas: HTMLCanvasElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  isDarkTheme: boolean = false
  stage: Stage
  objs: THREE.Object3D[] = []
  composer: EffectComposer | null = null  // 添加composer实例
  lightManager: LightManager = new LightManager();  // 添加光源管理器

  constructor(canvas: HTMLCanvasElement, themeStore: { isDarkMode: boolean }) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    // 启用阴影映射以支持深度信息
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      logarithmicDepthBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x1e1e1e, 0);
    this.renderer.shadowMap.enabled = true;
    // 使用更好的阴影类型
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 重要：启用physicallyCorrectLights以获得更好的光照效果
    // this.renderer.physicallyCorrectLights = true

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enableZoom = false
    this.controls.enableRotate = false
    this.controls.zoomSpeed = 1.5
    this.camera.position.set(5, 5, -20)
    this.controls.target = new THREE.Vector3(0,0,0)
    this.controls.update()
    this.stage = new Stage("stage", themeStore.isDarkMode)

    this.initScene()
    this.setStage()
  }

  toggleControls(isOn: boolean){
    this.controls.enablePan = isOn
    this.controls.enableRotate = isOn
    this.controls.enableZoom = isOn
    this.controls.update()
  }

  initScene(){
    const scene = this.scene
    scene.add(this.camera)
  }

  setStage(){
    const scene = this.scene
    scene.add(this.stage.stage)
  }

  getStage(){
    return this.stage
  }

  // 初始化后期处理效果
  initPostProcessing() {
    // 使用Three.js自带的EffectComposer
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    // 添加渲染通道
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // 创建轮廓通道 - 使用正确的selectedObjects格式
    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    outlinePass.edgeStrength = 10;      // 轮廓强度
    outlinePass.edgeGlow = 0;         // 轮廓辉光
    outlinePass.edgeThickness = 2.0;    // 轮廓厚度
    outlinePass.pulsePeriod = 0;        // 脉冲周期
    outlinePass.visibleEdgeColor.set(0x1e1e1e);  // 可见边缘颜色
    outlinePass.hiddenEdgeColor.set(0x190a05);  // 隐藏边缘颜色
    // 设置要突出显示的对象 - 需要注意selectedObjects需要是Object3D数组
    // 确保在设置selectedObjects时stage.children已经添加了对象

    outlinePass.selectedObjects = this.stage.stage.children.length > 0 ?
      this.stage.stage.children.filter((i) => i.isMesh) : [this.stage.stage];

    this.composer.addPass(outlinePass);

    // const toonPass = new ShaderPass(ToonShader2);
    // toonPass.uniforms.uBaseColor.value.set(0x1e1e1e);
    // this.composer.addPass(toonPass);

    // const moebiusPass = new MoebiusPass();
    // this.composer.addPass(moebiusPass);
    // 设置最后一个通道渲染到屏幕
    const copyPass = new ShaderPass(CopyShader);
    copyPass.renderToScreen = true;
    this.composer.addPass(copyPass);
  }
}
