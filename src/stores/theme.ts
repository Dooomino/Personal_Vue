import { defineStore } from 'pinia'

// 主题常量定义
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'
const THEME_KEY = 'theme'
const DARK_CLASS = 'dark'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: true,
    /** 用户是否手动选择过主题（false = 跟随系统） */
    userExplicit: false,
    /** 系统 prefers-color-scheme 的当前值 */
    systemDark: true
  }),
  actions: {
    /**
     * 初始化主题
     */
    initTheme() {
      const savedTheme = localStorage.getItem(THEME_KEY)

      if (savedTheme !== null) {
        // 有保存的用户选择 → 使用它
        this.isDarkMode = savedTheme === THEME_DARK
        this.userExplicit = true
      } else {
        // 无保存 → 读取系统偏好
        this.systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        this.isDarkMode = this.systemDark
        this.userExplicit = false
      }

      this.applyThemeClasses()
      this._listenSystemTheme()
    },

    /** 监听系统 prefers-color-scheme 变化，仅在用户未手动选择时跟随 */
    _listenSystemTheme() {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        this.systemDark = e.matches
        if (!this.userExplicit) {
          this.isDarkMode = e.matches
          this.applyThemeClasses()
        }
      }
      mq.addEventListener('change', handler)
    },

    /**
     * 应用主题相关的 CSS 类和属性
     */
    applyThemeClasses() {
      const htmlElement = document.documentElement

      if (this.isDarkMode) {
        htmlElement.classList.add(DARK_CLASS)
      } else {
        htmlElement.classList.remove(DARK_CLASS)
      }
    },

    /**
     * 切换暗黑模式
     * @param checked 是否启用暗黑模式
     */
    toggleDarkMode(checked: boolean) {
      this.isDarkMode = checked
      this.userExplicit = true
      this.applyThemeClasses()

      try {
        localStorage.setItem(THEME_KEY, checked ? THEME_DARK : THEME_LIGHT)
      } catch (e) {
        console.warn('无法保存主题偏好设置到 localStorage:', e)
      }
    },

    /**
     * 重置为跟随系统偏好
     */
    resetToSystem() {
      this.isDarkMode = this.systemDark
      this.userExplicit = false
      this.applyThemeClasses()

      try {
        localStorage.removeItem(THEME_KEY)
      } catch (e) {
        // ignore
      }
    }
  }
})
