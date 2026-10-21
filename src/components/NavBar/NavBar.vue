<template>
  <div class="navbar">
    <div class="nav-left">
      <router-link to="/" class="nav-brand">陶雨迪</router-link>
      <nav class="nav-links">
        <router-link to="/">主页</router-link>
        <router-link to="/experience">经历</router-link>
        <router-link to="/portfolio">项目</router-link>
        <router-link to="/about">关于</router-link>
        <router-link to="/contact">联系</router-link>
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
}
.nav-links a:hover {
  color: var(--text-primary);
  background: var(--glass-bg);
}
.nav-links a.router-link-exact-active {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}
.nav-right { display: flex; align-items: center; }
</style>
