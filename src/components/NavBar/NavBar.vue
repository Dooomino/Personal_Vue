<template>
  <div class="navbar by-theme text-gray-800 dark:text-white w-full h-16 px-4 flex-shrink-0 flex items-center justify-between bg-light-bg dark:bg-dark-bg z-50">
    <!-- 左侧：可以放 Logo 和导航链接 -->
    <div class="flex items-center gap-4">
      <!-- 预留位置给未来的导航项 -->
      <n-img src="#" alt="Logo" class="h-8" />
      <router-link to="/">Home</router-link>
      <router-link to="/about">About</router-link>
    </div>
    <!-- 右侧：主题切换开关 -->
    <div class="flex items-center">
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
.nav-bar span{
  cursor: pointer;
  border-bottom: 4px solid transparent;
  border-bottom-width: 0;
  padding:0.3rem 0;
  transition: all 0.3s ease-in-out;
}

.nav-bar span:hover{
  border-bottom: 4px solid #3b82f6;
  border-bottom-width: 4px ;
}
</style>
