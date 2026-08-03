<template>
  <div class="page">
    <div class="center fade-in">
      <div class="card">
        <h1 class="card-title">联系我</h1>
        <p class="card-subtitle">期待与你的交流</p>
        <div class="list">
          <a :href="`mailto:${contact.email}`" class="item">
            <span class="item-icon">✉️</span>
            <div class="item-body">
              <div class="item-label">邮箱</div>
              <div class="item-value">{{ contact.email }}</div>
            </div>
          </a>
          <a :href="contact.github" target="_blank" class="item">
            <span class="item-icon">🐙</span>
            <div class="item-body">
              <div class="item-label">GitHub</div>
              <div class="item-value">Dooomino</div>
            </div>
          </a>
          <div class="item">
            <span class="item-icon">📍</span>
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
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
}
.card-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}
.card-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 36px;
}
.list { display: flex; flex-direction: column; gap: 12px; }
.item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-decoration: none;
  transition: all 0.25s ease;
}
.item:hover {
  border-color: rgba(96, 165, 250, 0.25);
  background: rgba(96, 165, 250, 0.06);
  transform: translateX(4px);
}
.item-icon { font-size: 20px; flex-shrink: 0; }
.item-body { text-align: left; }
.item-label { font-size: 11px; color: rgba(255, 255, 255, 0.35); text-transform: uppercase; letter-spacing: 0.05em; }
.item-value { font-size: 14px; color: #e5e7eb; margin-top: 2px; }
.fade-in { animation: fadeIn 0.6s ease both; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
