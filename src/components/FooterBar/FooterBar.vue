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
  padding: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}
.footer a {
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
}
.footer a:hover {
  color: #60a5fa;
}
</style>
