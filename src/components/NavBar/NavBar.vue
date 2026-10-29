<template>
  <div class="navbar">
    <div class="nav-left">
      <router-link to="/" class="nav-brand">陶雨迪</router-link>
      <nav class="nav-links">
        <router-link to="/" style="--order: 1">主页</router-link>
        <router-link to="/experience" style="--order: 2">经历</router-link>
        <router-link to="/portfolio" style="--order: 3">项目</router-link>
        <router-link to="/about" style="--order: 4">关于</router-link>
        <router-link to="/contact" style="--order: 5">联系</router-link>
      </nav>
    </div>
    <div class="nav-right">
      <n-switch :rail-style="railStyle" v-model:value="checked" @update:value="onUpdateChecked">
        <template #checked-icon><n-icon :component="Moon" /></template>
        <template #unchecked-icon><n-icon :component="Sun" /></template>
      </n-switch>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Moon, Sun } from '@vicons/carbon'
import type { CSSProperties } from 'vue'
import { NIcon, NSwitch } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'
import { ref, watch } from 'vue'

const themeStore = useThemeStore()
const checked = ref(themeStore.isDarkMode)

watch(() => themeStore.isDarkMode, (v) => { checked.value = v })

function railStyle({ focused, checked }: { focused: boolean; checked: boolean }) {
  const s: CSSProperties = {}
  s.background = checked ? '#7c7c7c' : '#e6e6e6'
  if (focused) s.boxShadow = `0 0 0 2px ${checked ? '#7c7c7c40' : '#e6e6e640'}`
  return s
}

function onUpdateChecked(v: boolean) { themeStore.toggleDarkMode(v) }
</script>

<style scoped>
.navbar {
  width: 100%;
  height: 56px;
  padding: 0 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--navbar-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  z-index: 50;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 28px;
}
.nav-brand {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.nav-links { display: flex; gap: 6px; }
.nav-links a {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
  /* 老站导航逐项入场动画（--order 阶梯延迟） */
  animation: navIn 0.5s ease-out both;
  animation-delay: calc(var(--order, 1) * 0.08s);
}
@keyframes navIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
.nav-links a:hover {
  color: var(--text-primary);
  background: var(--glass-bg);
}
.nav-links a.router-link-exact-active {
  /* 主题感知：浅色主题下硬编码浅蓝在白底上几乎看不见 */
  color: var(--primary-color);
  background: var(--tag-bg);
}
.nav-right { display: flex; align-items: center; }
</style>
