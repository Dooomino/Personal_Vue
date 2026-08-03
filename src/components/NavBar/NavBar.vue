<template>
  <div class="navbar by-theme">
    <!-- 左侧：可以放 Logo 和导航链接 -->
    <div class="nav-left">
      <!-- 预留位置给未来的导航项 -->
      <n-img src="#" alt="Logo" class="nav-logo" />
      <router-link to="/">Home</router-link>
      <router-link to="/about">About</router-link>
    </div>
    <!-- 右侧：主题切换开关 -->
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

// 监听主题状态变化，同步开关状态
watch(
  () => themeStore.isDarkMode,
  (newVal) => {
    checked.value = newVal
  }
)

function railStyle({
  focused,
  checked
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
  }
  else {
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
  padding-left: 1rem;
  padding-right: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-logo {
  height: 2rem;
}

.nav-right {
  display: flex;
  align-items: center;
}
</style>
