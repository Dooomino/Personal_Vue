<template>
  <footer class="footer">
    <p>© {{ year }} 陶雨迪 · <a href="https://github.com/Dooomino/Personal_Vue" target="_blank">源码</a></p>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  text-align: center;
  padding: 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}
.footer a {
  color: rgba(255, 255, 255, 0.25);
  text-decoration: none;
  transition: color 0.2s;
}
.footer a:hover { color: #60a5fa; }
</style>
