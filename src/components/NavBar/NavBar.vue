<template>
  <div class="navbar text-gray-800 dark:text-white w-screen h-8 px-4 fixed top-0 left-0 z-5000 flex items-center bg-white dark:bg-black">
    <div class="absolute right-0 top-0 !mx-4 h-full flex items-center">
      <n-switch :rail-style="railStyle" v-model:value="checked" @update:checked="onUpdateChecked">
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
import { ref } from 'vue'

const checked = ref(true)
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
const themeStore = useThemeStore()
function onUpdateChecked() {
  themeStore.toggleDarkMode(!themeStore.isDarkMode)
}
</script>
