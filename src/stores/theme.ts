import { defineStore } from 'pinia'

// 主题常量定义
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'
const THEME_KEY = 'theme'
const DARKMODE_CLASS = 'darkmode'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: true
  }),
  actions: {
    /**
     * 初始化主题
     */
    initTheme() {
      // 检查 localStorage 中保存的主题设置
      const savedTheme = localStorage.getItem(THEME_KEY)

      // 如果有保存的设置，则使用保存的设置，否则默认使用暗黑模式
      if (savedTheme !== null) {
        this.isDarkMode = savedTheme === THEME_DARK
      }

      this.applyThemeClasses()
    },

    /**
     * 应用主题相关的 CSS 类和属性
     */
    applyThemeClasses() {
      if (this.isDarkMode) {
        document.documentElement.classList.add(DARKMODE_CLASS)
        document.documentElement.style.setProperty('color-scheme', THEME_DARK)
      } else {
        document.documentElement.classList.remove(DARKMODE_CLASS)
        document.documentElement.style.setProperty('color-scheme', THEME_LIGHT)
      }
    },

    /**
     * 切换暗黑模式
     * @param checked 是否启用暗黑模式
     */
    toggleDarkMode(checked: boolean) {
      this.isDarkMode = checked
      this.applyThemeClasses()

      try {
        localStorage.setItem(THEME_KEY, checked ? THEME_DARK : THEME_LIGHT)
      } catch (e) {
        console.warn('无法保存主题偏好设置到 localStorage:', e)
      }
    }
  }
})
