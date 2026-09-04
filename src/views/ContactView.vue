<template>
  <div class="page">
    <div class="center fade-in">
      <div class="card">
        <h1 class="card-title">联系我</h1>
        <p class="card-subtitle">期待与你的交流</p>
        <div class="list">
          <a :href="`mailto:${contact.email}`" class="item">
            <span class="item-icon">@</span>
            <div class="item-body">
              <div class="item-label">邮箱</div>
              <div class="item-value">{{ contact.email }}</div>
            </div>
          </a>
          <a :href="contact.github" target="_blank" class="item">
            <svg class="item-icon gh" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            <div class="item-body">
              <div class="item-label">GitHub</div>
              <div class="item-value">Dooomino</div>
            </div>
          </a>
          <div class="item">
            <span class="item-icon">○</span>
            <div class="item-body">
              <div class="item-label">位置</div>
              <div class="item-value">{{ contact.location }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { contact } from '@/data/resume'
</script>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}
.center { width: 100%; max-width: 400px; padding: 24px; }
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
}
.card-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}
.card-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 36px;
}
.list { display: flex; flex-direction: column; gap: 12px; }
.item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  text-decoration: none;
  transition: all 0.25s ease;
}
.item:hover {
  border-color: var(--glass-border-hover);
  background: var(--glass-bg-hover);
  transform: translateX(4px);
}
.item-icon {
  font-size: 18px;
  color: var(--text-secondary);
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}
.gh { width: 20px; height: 20px; }
.item-body { text-align: left; }
.item-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.item-value { font-size: 14px; color: var(--text-primary); margin-top: 2px; }
.fade-in { animation: fadeIn 0.6s ease both; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
