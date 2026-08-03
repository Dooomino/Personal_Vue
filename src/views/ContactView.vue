<template>
  <div class="page">
    <div class="center">
      <div class="card">
        <h1 class="card-title">联系我</h1>
        <p class="card-subtitle">期待与你的交流</p>
        <div class="list">
          <a :href="`mailto:${contact.email}`" class="item">
            <span class="item-icon">✉️</span>
            <div>
              <div class="item-label">邮箱</div>
              <div class="item-value">{{ contact.email }}</div>
            </div>
          </a>
          <a :href="contact.github" target="_blank" class="item">
            <span class="item-icon">🐙</span>
            <div>
              <div class="item-label">GitHub</div>
              <div class="item-value">Dooomino</div>
            </div>
          </a>
          <div class="item">
            <span class="item-icon">📍</span>
            <div>
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
.center {
  width: 100%;
  max-width: 420px;
  padding: 24px;
}
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}
.card-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}
.card-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 32px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  transition: border-color 0.3s;
}
.item:hover {
  border-color: rgba(255, 255, 255, 0.2);
}
.item-icon {
  font-size: 20px;
}
.item-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
.item-value {
  font-size: 14px;
  color: #fff;
}
</style>
