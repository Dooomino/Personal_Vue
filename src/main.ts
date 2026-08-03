import '@/styles/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 注意：这里不再在main.ts中初始化主题，而是在App.vue中处理
// 以确保在Vue实例挂载后正确应用主题类

app.mount('#app')
