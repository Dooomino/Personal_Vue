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
        <template #checked-icon>
          <n-icon :component="Moon" />
        </template>
        <template #unchecked-icon>
          <n-icon :component="Sun" />
        </template>
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

watch(
  () => themeStore.isDarkMode,
  (newVal) => {
    checked.value = newVal
  }
)

function railStyle({
  focused,
  checked,
}: {
  focused: boolean
  checked: boolean
}) {
  const style: CSSProperties = {}
  if (checked) {
    style.background = '#7c7c7c'
    if (focused) {
      style.boxShadow = '0 0 0 2px #7c7c7c40'
    }
  } else {
    style.background = '#e6e6e6'
    if (focused) {
      style.boxShadow = '0 0 0 2px #e6e6e640'
    }
  }
  return style
}

function onUpdateChecked(value: boolean) {
  themeStore.toggleDarkMode(value)
}
</script>

<style scoped>
.navbar {
  width: 100%;
  height: 4rem;
  padding: 0 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 50;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-brand {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
}
.nav-links {
  display: flex;
  gap: 16px;
}
.nav-links a {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: color 0.3s;
}
.nav-links a:hover,
.nav-links a.router-link-exact-active {
  color: #60a5fa;
}
.nav-right {
  display: flex;
  align-items: center;
}
</style>
