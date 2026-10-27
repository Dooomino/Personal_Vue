export interface WorkProject {
  name: string
  period: string
  description: string[]
  techStack: string[]
}

export interface WorkExperience {
  company: string
  title: string
  period: string
  projects: WorkProject[]
}

export interface SkillCategory {
  category: string
  items: string[]
}

export interface PortfolioProject {
  name: string
  description: string
  techStack: string[]
  github?: string
  demo?: string
  /** 老站作品截图（public/works/），可多张 */
  images?: string[]
  /** 老站演示视频（public/works/） */
  video?: string
  variant?: 'fade-up' | 'fade-left' | 'scale' | 'blur' | 'none'
}

export interface Education {
  school: string
  degree: string
  period: string
  courses: string[]
}

export interface ContactInfo {
  phone: string
  email: string
  github: string
  website: string
  location: string
}

export const contact: ContactInfo = {
  phone: '136-8335-1052',
  email: 'yudi.tao@outlook.com',
  github: 'https://github.com/Dooomino',
  website: 'https://mino.moe',
  location: '北京/朝阳',
}

export const summary =
  '具备 2 年+前端开发经验的全栈开发者，熟练掌握 Vue.js 生态与 TypeScript，主导完成多个企业级 Web 应用的前端架构设计与开发。具备 AI 产品前端开发经验（大模型对话界面、流式交互），熟悉 Node.js 后端服务与 DevOps 部署。注重工程质量、用户体验与代码可维护性。'

/** 关于页个人简介（混搭自 Personal_Web 老站 ABOUT ME 段落，去掉过时的年限表述） */
export const aboutIntro: string[] = [
  '多年来，我的每一次学习经历都是对我改进和发展的激励，极大地促进了我今天的编程能力。',
  '我毕业于加拿大的安大略省理工大学。我主修计算机科学，专业是数字媒体，辅修数学。多年来我一直在进行编码和设计，我对计算机图形学、计算机视觉和人机交互有相当的了解。',
  '请看下面我的全部背景资料。',
]

/** 简历下载（静态文件，来自老站 pages/resume/） */
export const resumes = {
  cn: '/resume/yudi-tao-resume-cn.pdf',
  en: '/resume/yudi-tao-resume-en.pdf',
}

export const workExperience: WorkExperience[] = [
  {
    company: '深圳市元道通信技术有限公司',
    title: '前端开发工程师',
    period: '2024 - 2026',
    projects: [
      {
        name: '通信行业大模型应用平台',
        period: '2025 - 2026',
        description: [
          '主导前端对话界面架构设计与开发，基于 Vue 3 + TypeScript 实现响应式对话系统',
          '对接大模型 API 实现 SSE 流式响应展示，支持多轮对话状态管理与会话持久化',
          '实现 Markdown 实时渲染、代码高亮、工具调用结果可视化等富文本交互功能',
        ],
        techStack: ['Vue 3', 'TypeScript', 'Vite', 'SSE', 'Markdown 渲染'],
      },
      {
        name: 'OA 系统及行政办公平台',
        period: '2024 - 2025',
        description: [
          '负责公司内部 OA 系统、行政办公等多个模块的前端架构设计与开发',
          '与后端团队协作完成 RESTful API 接口对接，处理异步请求与大数据量列表渲染优化',
          '对旧代码进行性能优化与重构，提取通用组件提升代码复用率 30%+',
          '负责统一信息平台的数据大屏开发，通过多种图表、数据下钻及实时地图进行可视化展示',
          '负责微信小程序开发，实现跨平台适配',
        ],
        techStack: ['Vue 2/3', 'JavaScript', 'Element UI', '微信小程序'],
      },
      {
        name: '智能商机挖掘系统',
        period: '2024 - 2026',
        description: [
          '设计数据可视化看板，通过 ECharts 实现招标数据的多维度图表展示与交互分析',
          '实现数据筛选、搜索、分页等复杂列表功能，优化大数据量下的渲染性能',
        ],
        techStack: ['Vue 3', 'TypeScript', 'ECharts', 'RESTful API'],
      },
    ],
  },
]

export const skills: SkillCategory[] = [
  { category: '编程语言', items: ['JavaScript', 'TypeScript', 'Python', 'C++', 'Java'] },
  { category: '前端框架', items: ['Vue 2/3', 'Vite', 'Webpack'] },
  { category: 'UI & 样式', items: ['HTML5', 'CSS3', 'Element UI', '响应式设计'] },
  { category: '状态管理', items: ['Vuex', 'Pinia'] },
  { category: 'Web 技术', items: ['RESTful API', 'WebSocket', 'SSE', 'Axios'] },
  { category: '可视化', items: ['ECharts', 'Canvas', 'SVG', 'WebGL', 'Three.js', 'GLSL', 'D3.js'] },
  { category: '计算机图形学', items: ['OpenGL', 'Shader'] },
  { category: '计算机视觉', items: ['OpenCV'] },
  { category: '机器学习', items: ['TensorFlow', 'Scikit-learn'] },
  { category: '游戏 & 3D', items: ['Unity', 'Blender'] },
  { category: '平面设计', items: ['Photoshop', 'Illustrator'] },
  { category: '小程序', items: ['微信小程序'] },
  { category: 'Node.js', items: ['Express', '中间件开发'] },
  { category: 'DevOps', items: ['Docker', 'Linux', 'Nginx', 'Git', 'Hallmark'] },
]

export const portfolioProjects: PortfolioProject[] = [
  {
    name: '个人作品集网站',
    description:
      '基于 Vue 3 + TypeScript + Three.js 构建的 3D 交互式个人网站。实现自定义 GLSL 着色器（Toon、Moebius、Waves 等多种风格），完成场景渲染与动态光照效果。',
    techStack: ['Vue 3', 'TypeScript', 'Three.js', 'GLSL', 'Vite'],
    github: 'https://github.com/Dooomino/Personal_Vue',
    variant: 'fade-up',
  },
  {
    name: 'MagicCircle',
    description: '一个魔法阵生成器，基于 Processing 和 JavaScript 构建，支持自定义样式与实时预览。',
    techStack: ['Processing', 'JavaScript', 'Canvas'],
    github: 'https://github.com/Dooomino/MagicCircle',
    demo: 'https://dooomino.github.io/MagicCircle/',
    images: ['/works/Mag circle.png'],
    variant: 'scale',
  },
  {
    name: '太阳系',
    description: '一个使用 Processing 和 P5.js 的太阳系演示。',
    techStack: ['Processing', 'P5.js'],
    github: 'https://github.com/Dooomino/Solar',
    images: ['/works/Solar.png'],
    video: '/works/Solar.mp4',
    variant: 'fade-left',
  },
  {
    name: 'OpenGL 太阳系演示',
    description: '一个 OpenGL 程序，显示由立方体组成的太阳系，大小和运动比例与现实中的太阳系相似。',
    techStack: ['OpenGL', 'C++'],
    github: 'https://github.com/Dooomino/OpenGL-Solar-System',
    images: ['/works/Solar_opengl.png'],
    variant: 'blur',
  },
  {
    name: '文字故障',
    description: '一个类似于终端的 Glitch 文本图像生成器，基于 HTML5 的 SVG 和 Canvas 构建。',
    techStack: ['HTML5', 'SVG', 'Canvas', 'JavaScript'],
    github: 'https://github.com/Dooomino/Text-Glitch',
    images: ['/works/Glitch.png'],
    variant: 'fade-up',
  },
  {
    name: '符文生成器',
    description: '一个生成伪随机符文的简单项目。',
    techStack: ['Processing'],
    github: 'https://github.com/Dooomino/rune_generator',
    video: '/works/Rune.mp4',
    variant: 'scale',
  },
  {
    name: 'Cellular Automata',
    description: '一个基于 Canvas 的生命游戏（Game of Life）演示，支持自定义规则与交互操作。',
    techStack: ['JavaScript', 'Canvas', 'HTML5'],
    github: 'https://github.com/Dooomino/Cellular-Automata',
    demo: 'https://dooomino.github.io/Cellular-Automata/',
    variant: 'fade-left',
  },
  {
    name: 'WebGL Cube',
    description: '一个 WebGL 基础示例，展示带光照效果的 3D 立方体渲染。',
    techStack: ['WebGL', 'JavaScript', 'GLSL'],
    github: 'https://github.com/Dooomino/WebGl-Example',
    demo: 'https://dooomino.github.io/WebGl-Example/',
    variant: 'blur',
  },
  {
    name: '立体视觉展示',
    description: '一个对立体视觉的两种算法的演示，基于 Jupyter Notebook 构建。',
    techStack: ['Python', 'Jupyter Notebook', 'Computer Vision'],
    github: 'https://github.com/Dooomino/Stereoscopic-Demo',
    images: ['/works/Disparity.png'],
    variant: 'fade-up',
  },
  {
    name: 'Flight Simulator',
    description: '一个使用 Unity 引擎开发的飞行模拟器游戏。',
    techStack: ['Unity', 'C#'],
    github: 'https://github.com/Dooomino/Flight-Simulation-Games',
    variant: 'scale',
  },
  {
    name: 'ObjViewer',
    description: '一个简单的 OpenGL 文件读取器，用于显示 .obj 格式的 3D 模型文件。',
    techStack: ['OpenGL', 'C++'],
    github: 'https://github.com/Dooomino/ObjViewer',
    variant: 'fade-left',
  },
  {
    name: 'Flocking Boids',
    description: '一个在 OpenGL 中实现的 Boids 群体行为模拟与动画演示。',
    techStack: ['OpenGL', 'C++'],
    github: 'https://github.com/Dooomino/Flocking_Boids',
    variant: 'blur',
  },
  {
    name: 'GPU-ASCII',
    description: '基于 wgpu 计算着色器的 GPU 加速图像转 ASCII 转换器与终端游戏引擎，支持实时渲染与跨语言 FFI。',
    techStack: ['Python', 'Rust', 'wgpu', 'Compute Shader'],
    github: 'https://github.com/Dooomino/gpu-ascii',
    variant: 'fade-up',
  },
  // 以下三个 Blender 作品混搭自 Personal_Web 老站项目页
  {
    name: '马克杯',
    description: '灵感来自于一个制作时失败的杯子。使用 Blender 2.8 制作。',
    techStack: ['Blender'],
    images: ['/works/The Mug.png'],
    variant: 'fade-up',
  },
  {
    name: '3D 场景',
    description: '这是一个用 Blender 2.8 制作的山洞场景，使用了体积光和雕刻工具。',
    techStack: ['Blender'],
    images: ['/works/3d Scene1.jpg', '/works/3d Scene2.jpg'],
    variant: 'fade-left',
  },
  {
    name: '水（牛奶）模拟',
    description: '一个用 Blender 2.8 制作的液体动画，有环境照明和液体物理模拟。',
    techStack: ['Blender'],
    video: '/works/Milk simulate.mp4',
    variant: 'scale',
  },
]

export const education: Education = {
  school: '安大略省理工大学（加拿大）',
  degree: '计算机科学 - 数字媒体方向 | 荣誉学士',
  period: '2016.09 - 2022.06',
  courses: ['计算机图形学', '计算机视觉', '机器学习', '人机交互', 'Web 开发', '数据结构与算法'],
}
