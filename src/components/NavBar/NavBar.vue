<template>
  <div class="navbar by-theme text-gray-800 dark:text-white w-screen h-16 px-4 fixed top-0 left-0 z-5000 flex items-center bg-light-bg dark:bg-dark-bg">
    <div class="nav-bar pl-20 w-full flex items-center gap-10" style="padding-left: 2rem;">
      <router-link to="/" class="text-lg font-bold">
        <img src="/src/assets/favicon-32x32.png" alt="logo" class="w-8 h-8 inline-block mr-2">
      </router-link>
      <router-link to="/" class="text-lg font-bold">
        <span class="no-bc">Home</span>
      </router-link>
      <router-link to="/about" class="text-lg font-bold">
        <span class="no-bc">About</span>
      </router-link>
      <router-link to="/blog" class="text-lg font-bold">
        <span class="no-bc">Blog</span>
      </router-link>
    </div>
    <div class="absolute right-0 top-0 !mx-4 h-full flex items-center">
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
