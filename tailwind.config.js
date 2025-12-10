/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],

  // 使用标准的 darkMode 配置
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        // 简化颜色配置，移除嵌套的 DEFAULT
        'light-bg': '#ffffff',
        'light-bg-card': '#f8fafc',
        'light-bg-hover': '#f1f5f9',
        'light-bg-input': '#ffffff',
        'light-text': '#0f172a',
        'light-text-secondary': '#475569',
        'light-text-muted': '#64748b',
        'light-border': '#e2e8f0',

        'dark-bg': '#0f172a',
        'dark-bg-card': '#1e293b',
        'dark-bg-hover': '#334155',
        'dark-bg-input': '#1e293b',
        'dark-text': '#f1f5f9',
        'dark-text-secondary': '#cbd5e1',
        'dark-text-muted': '#94a3b8',
        'dark-border': '#334155',
      },

      // 扩展背景图片
      backgroundImage: {
        'dark-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'light-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      },
    },
  },

  plugins: [],
}