<template>
    <canvas ref="canvasRef"></canvas>
</template>
<script setup lang="ts">

  import { onMounted, onUnmounted, reactive, shallowRef } from 'vue'  // 修改这里，使用shallowRef
  import * as THREE from 'three'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
  import {
    DRACOLoader,
    GLTFLoader
  } from 'three/examples/jsm/Addons.js';
  import { useThemeStore } from '@/stores/theme';
  import { Stage } from '../entities/Stage';
  import { NumericInterpolator } from '../utils/NumericInterpolator';
  import { BackCanvas } from '../BackCanvasClass';


  const canvasRef = shallowRef<HTMLCanvasElement | null>(null)
  const backCanvasRef = shallowRef<BackCanvas | null>(null)
  const guiRef = shallowRef<GUI | null>(null) // 新增：使用 shallowRef 管理 GUI 实例
  const themeStore = useThemeStore()
  const isStartUp = shallowRef(false)
  let animationFrameId: number

  // 添加交互状态相关变量
  let lastInteractionTime = 0
  let isActive = true
  const INACTIVE_TIMEOUT = 1000 // 1秒无操作后降低帧率
  const LOW_FPS_INTERVAL = 1000 / 5 // 降低到5fps，即每200ms执行一次
  let lastFrameTime = 0
  const isMouseAction = shallowRef(false)
  onMounted(async() => {
    if (canvasRef.value) {
      const backCanvas = new BackCanvas(canvasRef.value, themeStore)
      backCanvasRef.value = backCanvas

      // 添加交互事件监听，用于检测用户操作
      const handleInteraction = () => {
        lastInteractionTime = performance.now()
        isActive = true
      }

      // 监听用户交互事件
      window.addEventListener('mousemove',()=>{
        if(isMouseAction.value) {
          handleInteraction()
        }
      })
      window.addEventListener('mousedown', ()=>{
        isMouseAction.value = true
        handleInteraction()
      })
      window.addEventListener('mouseup',()=>{
        isMouseAction.value = false
        handleInteraction()
      })
      window.addEventListener('keydown', handleInteraction)
      window.addEventListener('keyup', handleInteraction)
      window.addEventListener('touchstart', handleInteraction)
      window.addEventListener('touchmove', handleInteraction)
      window.addEventListener('touchend', handleInteraction)

      // 添加动画循环
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        // 检查是否应该渲染
        const currentTime = performance.now()

        // 检查是否在启动过程中
        if(isStartUp.value) {
          backCanvas.controls.update()
          if(backCanvas.composer) {
            backCanvas.composer.render();
          } else {
            backCanvas.renderer.render(backCanvas.scene, backCanvas.camera)
          }
          return
        }

        // 检查是否处于颜色过渡状态（主题切换等）
        const stage = backCanvas.getStage()
        let hasTransitioningColors = false
        if (stage) {
          hasTransitioningColors = Object.values(stage.colors).some(colorSwitcher => colorSwitcher.isTransitioning)
        }

        // 检查是否处于光源强度变化状态
        const light = backCanvas.lightManager.getLight('mainLight') as THREE.DirectionalLight
        const isLightIntensityChanging = light && Math.abs(light.intensity - (themeStore.isDarkMode ? 5.0 : 0.5)) > 0.01

        // 检查是否有交互或动画需求
        const isWithinTimeout = currentTime - lastInteractionTime < INACTIVE_TIMEOUT
        const hasActiveAnimations = hasTransitioningColors || isLightIntensityChanging

        // 判断是否需要渲染
        if (isWithinTimeout || hasActiveAnimations) {
          isActive = true
          updateStage()
          backCanvas.controls.update()
          // 使用EffectComposer进行渲染
          if(backCanvas.composer) {
            backCanvas.composer.render();
          } else {
            backCanvas.renderer.render(backCanvas.scene, backCanvas.camera)
          }
        } else{
          // 标记当前为非活跃状态
          isActive = false
        }
      }

      await setupStage().then(async()=>{
        startUpStage()
        animate()
      });

      // 处理窗口大小调整
      const handleResize = () => {
        backCanvas.camera.aspect = window.innerWidth / window.innerHeight
        backCanvas.camera.updateProjectionMatrix()
        backCanvas.renderer.setSize(window.innerWidth, window.innerHeight)
        // 同时更新composer的尺寸
        if(backCanvas.composer) {
          backCanvas.composer.setSize(window.innerWidth, window.innerHeight)
        }
      }

      window.addEventListener('resize', handleResize)
    }
  })
  function loadGLB(url: string){
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./lib/draco/gltf/');
    loader.setDRACOLoader(dracoLoader);
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        gltf.scene.scale.set(1,1,1);
        resolve(gltf.scene.children[0]);
      }, undefined, (error) => {
        console.error('加载失败:', error);
        reject(error);
      });
    })
  }
  function setupStage() {
    return new Promise(async (resolve) => {
      const backCanvas = backCanvasRef.value;
      if (!backCanvas) {
        resolve(true);
        return;
      }

      const stage = backCanvas.getStage();
      const lightManager = backCanvas.lightManager;

      // TEST
      backCanvasRef.value?.toggleControls(true)
      if(stage){
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // 提高环境光强度，提供更亮的基础照明
        stage.add(ambientLight,'ambient');

        stage.addColorPair("room",0x001580,0xa77558)
        // Room
        // debugger

        const room = await loadGLB('/src/assets/model/room.glb') as THREE.Mesh
        // const roomGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const boxColor = stage.getColorPair("room")?.getColor() || new THREE.Color(0x020D45);

        // 使用MeshToonMaterial替代之前的材质定义
        const roomMat = new THREE.MeshPhongMaterial({
          shininess: 100,
          color: boxColor,
          emissive: boxColor,
        })

        // const roomMat = new THREE.ShaderMaterial(
        //   {
        //     uniforms: {
        //       ...ToonShader.uniforms,
        //     },
        //     vertexShader: ToonShader.vertexShader,
        //     fragmentShader: ToonShader.fragmentShader,
        //   }
        // )

        // @ts-expect-error 缺少属性
        room.material = roomMat
        // const room = new THREE.Mesh(roomGeo, roomMat);
        room.scale.set(30, 30, 30);
        room.position.set(0, 0, 0);
        room.receiveShadow = true;
        room.castShadow = true;

        stage.add(room, 'room');
        stage.addMaterial( roomMat,"room")

        const glass = new THREE.Mesh(
          new THREE.PlaneGeometry(30, 60),
          new THREE.MeshPhysicalMaterial({
            side: THREE.DoubleSide,
            color: 0xffffff,
            opacity: 0.8,
            transparent: true,
            metalness: 0.7,
            roughness: 0.5,
            ior: 1.5,
            clearcoat: 1.0,
            transmission: 1.0,
            thickness: 0.1,
          })
        )

        glass.position.set(29, 0, 15);
        glass.rotation.y = -Math.PI / 2;
        stage.add(glass, 'glass');

        // light
        // const light = new THREE.SpotLight(0xffffff, 100.0 , 180.0, Math.PI / 6,0.8,100)
        const light = new THREE.DirectionalLight(0xffffff, 0.0);
        // light.scale.set(10,10,10)
        light.position.set(glass.position.x+100, glass.position.y, glass.position.z)
        light.castShadow = true
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.left = -50;
        light.shadow.camera.right = 50;
        light.shadow.camera.top = 50;
        light.shadow.camera.bottom = -50;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500;
        // 启用shadow map优化
        light.shadow.bias = -0.005;
        light.shadow.radius = 1;

        const lightObjectGeo = new THREE.SphereGeometry(1, 16, 16);
        const lightObjectMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });
        // const lightObject = new THREE.Mesh(lightObjectGeo, lightObjectMat);
        const lightObject = new THREE.Object3D();
        lightObject.castShadow = false; // 光源物体本身不需要投射阴影
        // const lightTarget = new THREE.Mesh(lightObjectGeo, lightObjectMat);
        const lightTarget = new THREE.Object3D();
        // light.position.set(0, 5, -55)
        lightTarget.position.set(-light.position.x,light.position.y,light.position.z);

        // 使用光源管理器管理光源
        lightManager.addLight('mainLight', light, lightTarget, lightObject);

        stage.add(light,'light')
        stage.add(lightObject, 'lightObject');
        stage.add(lightTarget, 'lightTarget');

        // 添加室内光源
        const indoorLight = new THREE.PointLight(0xffffff, 50.0, 100, 2);
        indoorLight.position.set(0, 5, 0);
        const indoorLightHelper = new THREE.PointLightHelper(indoorLight, 1);

        lightManager.addLight('indoorLight', indoorLight);
        stage.add(indoorLight, 'indoorLight');
        // stage.add(indoorLightHelper, 'indoorLightHelper');

      }
      setUpGUI()

      // 初始化后期处理效果
      backCanvasRef.value?.initPostProcessing();

      resolve(true)
    })
  }
  function startUpStage(){
    isStartUp.value = true
    const backCanvas = backCanvasRef.value || null
    const stage = backCanvas?.getStage()
    const lightManager = backCanvas?.lightManager;

    const s1 = new Promise(async (resolve) => {
      if(stage && lightManager){
        const light = lightManager.getLight('mainLight') as THREE.DirectionalLight

        if(light){
          // 使用 NumericInterpolator 类创建光强度插值
          NumericInterpolator.createInterpolation(
            light.intensity, // 初始强度
            5.0, // 目标强度
            1, // 持续时间（秒）
            (value) => {
              light.intensity = value;
            },
            () => {
              resolve(true)
            });
        }
      }
    }).finally(()=>{
      isStartUp.value = false
    })
    return Promise.all([s1])
  }
  function updateStage() {
    if (backCanvasRef.value) {
      const stage = backCanvasRef.value.getStage()
      const lightManager = backCanvasRef.value.lightManager;
      const light = lightManager.getLight('mainLight') as THREE.DirectionalLight
      const ambientLight = stage.get('ambient') as THREE.AmbientLight
      const room = stage.get('room') as THREE.Mesh
      if (stage) {
        // 更新所有颜色的过渡
        stage.updateColors()

        // const lightObject = stage.get('lightObject')
        // const lightHelper = stage.get('lightHelper')as THREE.DirectionalLightHelper
        // rotate around 0,0,0
        if (light) {
        //   // 使用更大的半径，并保持合适的高度，避免光源穿过模型
        //   const radius = 200; // 增加半径使光源远离中心
        //   const height = 5; // 调整高度避免穿过地面
        //   const speed = 0.2; // 降低旋转速度使动画更平滑
        //   light.position.x = radius * Math.sin(Date.now() / 1000 * speed)
        //   light.position.y = height
        //   light.position.z = radius * Math.cos(Date.now() / 1000 * speed)
        //   // 更新光源目标位置，确保光照方向正确
        //   if (light.target) {
        //     light.target.position.set(0, 0, 0);
        //   }
        }

        if(room && room.material){
          if(room.material instanceof THREE.Material){
            const roomColor = stage.getColorPair("room")?.getColor();
            if(roomColor) {
              if (room.material && (room.material as THREE.ShaderMaterial).isShaderMaterial){
                const roomMat = room.material as THREE.ShaderMaterial;
                // 确保uniforms已初始化且objectColor存在
                if (roomMat.uniforms && roomMat.uniforms.objectColor) {
                  roomMat.uniforms.objectColor.value = roomColor;
                  roomMat.needsUpdate = true
                }
              }else{
                // 对于非着色器材质，直接更新颜色属性
                (room.material as THREE.MeshToonMaterial).color.copy(roomColor);
                (room.material as THREE.MeshToonMaterial).needsUpdate = true;
              }
            }
          }
        }

        // lightObject?.position.copy(light?.position)
        if (ambientLight) {
          ambientLight.intensity = ambientLight.intensity * (themeStore.isDarkMode ? 0.5 : 1)
        }

        updateUniforms()
        updateGUI()
      }
    }

  }
  function updateUniforms(){
    if (backCanvasRef.value) {
      const { camera } = backCanvasRef.value
      const stage = backCanvasRef.value.getStage()
      const lightManager = backCanvasRef.value.lightManager;
      const light = lightManager.getLight('mainLight') as THREE.DirectionalLight
      if (stage) {
        const room = stage.get('room') as THREE.Mesh
        if(room){
          // const roomMat = room.material as THREE.ShaderMaterial
          // roomMat.uniforms.objectColor.value = stage.colors["room"].getColor()

          // roomMat.uniforms.lightPosition.value = light.position
          // roomMat.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight)
          // roomMat.uniforms.cameraNear.value = camera.near;
          // roomMat.uniforms.cameraFar.value = camera.far;
          // roomMat.needsUpdate = true

          // 更新区域光相关的uniforms
          const areaLight = stage.get('areaLight') as THREE.Mesh
          if (areaLight) {

          }

        }
      }
    }
  }
  function setUpGUI(){
    // 使用 ref 存储 GUI 实例
    const gui = new GUI();
    guiRef.value = gui; // 将实例存入 ref

    const backCanvas = backCanvasRef.value;
    if (!backCanvas) return;

    const stage = backCanvas.getStage() || null
    const lightManager = backCanvas.lightManager;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stage?.add(marker,"marker")
    const controller = backCanvasRef.value?.controls as OrbitControls
    if(controller){
      controller.target = marker.position
    }
    marker.position.lerp(new THREE.Vector3(0,0,16),0.5)
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '4rem';
    const markerFolder = gui.addFolder('Marker');
    markerFolder.add(stage?.get("marker")?.position , "x", -100,100,0.01);
    markerFolder.add(stage?.get("marker")?.position , "y", -100,100,0.01);
    markerFolder.add(stage?.get("marker")?.position , "z", -100,100,0.01);

    const mainLight = lightManager.getLight('mainLight')
    if (mainLight) {
      const dirLightFolder = gui.addFolder('Directional Light');
      dirLightFolder.add(mainLight.position, 'x', -100,100,0.01);
      dirLightFolder.add(mainLight.position, 'y', -100,100,0.01);
      dirLightFolder.add(mainLight.position, 'z', -100,100,0.01);
      dirLightFolder.add(mainLight.rotation, 'x', -Math.PI,Math.PI,0.01);
      dirLightFolder.add(mainLight.rotation, 'y', -Math.PI,Math.PI,0.01);
      dirLightFolder.add(mainLight.rotation, 'z', -Math.PI,Math.PI,0.01);
      dirLightFolder.add(mainLight,'intensity', 0, 10, 0.01)
    }

    // 室内光源控制
    const indoorLight = lightManager.getLight('indoorLight')
    if (indoorLight) {
      const indoorLightFolder = gui.addFolder('Indoor Light');
      indoorLightFolder.add(indoorLight.position, 'x', -100,100,0.01);
      indoorLightFolder.add(indoorLight.position, 'y', -100,100,0.01);
      indoorLightFolder.add(indoorLight.position, 'z', -100,100,0.01);
      indoorLightFolder.add(indoorLight,'intensity', 0, 10, 0.01)
    }

    const shadersFolder = gui.addFolder('Shaders');
    const shader = stage?.getMaterial("room") as THREE.ShaderMaterial
    const color = stage?.colors["room"]
    if(color){
      shadersFolder.addColor(color, "lightColor");
      shadersFolder.addColor(color, "darkColor");
    }

  }

  function updateGUI(){
    const gui = guiRef.value
    if(gui){
      // 更新标记的位置显示
      const stage = backCanvasRef.value?.getStage() || null
      if(stage){
        // 更新标记位置
        const marker = stage.get("marker")
        if(marker && marker instanceof THREE.Object3D){
          // 遍历GUI中的控制器并更新它们的值
          gui.controllers.forEach(controller => {
            // 如果控制器的object是marker的位置属性，则更新控制器的显示值
            if(controller.object === marker.position){
              // 不需要手动更新，因为Three.js的GUI会自动监听对象属性变化
            }
          })
        }

        // 更新灯光位置
        const dirLight = stage.get("light")
        if(dirLight && dirLight instanceof THREE.Light){
          // 同样，GUI会自动更新显示值，但我们可以确保它们是最新的
          // 如果需要强制更新，可以在这里添加相关逻辑
        }
      }
    }
  }

  // 监听主题变化
  themeStore.$subscribe((mutation, state) => {
    if (backCanvasRef.value) {
      backCanvasRef.value.isDarkTheme = state.isDarkMode
      // 切换Stage中的所有颜色
      const stage = backCanvasRef.value.getStage()
      if (stage) {
        stage.switchTheme(state.isDarkMode)
        // 更新已存在的对象的颜色
        updateStageObjectsColor(stage)
      }

      // 更新光源强度根据主题
      const lightManager = backCanvasRef.value.lightManager;
      lightManager.setLightsByTheme(state.isDarkMode);
    }
  })
  function rgbaToHex(r, g, b, a = 1) {
    const toHex = (x) => {
        const value = Math.round(Math.max(0, Math.min(1, x)) * 255);
        return value.toString(16).padStart(2, '0').toUpperCase();
    };

    const alphaHex = a === 1 ? '' : toHex(a);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
  }
  window.objToHex =(obj)=> {
    return rgbaToHex(obj.r, obj.g, obj.b)
  }
  function updateStageObjectsColor(stage: Stage) {
    // 更新room的颜色
    const room = stage.get('room')

    if (room && room instanceof THREE.Mesh) {
      const materials = Array.isArray(room.material) ? room.material : [room.material]
      const colorPair = stage.getColorPair("room");
      const boxColor = colorPair?.getColor();

      if (boxColor) {
        materials.forEach(mat => {
          if (mat && mat.isMaterial) {
            // 根据材质类型分别处理
            if ((mat as THREE.ShaderMaterial).isShaderMaterial) {
              const shaderMat = mat as THREE.ShaderMaterial;
              if (shaderMat.uniforms && shaderMat.uniforms.objectColor) {
                shaderMat.uniforms.objectColor.value = boxColor;
                shaderMat.needsUpdate = true;
              }
            } else {
              // 对于MeshToonMaterial等基础材质
              (mat as THREE.MeshToonMaterial).color.copy(boxColor);
              (mat as THREE.MeshToonMaterial).needsUpdate = true;
            }
          }
        })
      }
    }
  }

  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    // 清理资源
    if (backCanvasRef.value?.composer) {
      backCanvasRef.value.composer.dispose();
    }
    // 清理 GUI
    if (guiRef.value) {
      guiRef.value.destroy();
    }
  })
  </script>
