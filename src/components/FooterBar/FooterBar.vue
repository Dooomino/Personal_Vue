<template>
  <footer class="footer">
    <p>
      © {{ year }} 陶雨迪 ·
      <a href="https://github.com/Dooomino/Personal_Vue" target="_blank">源码</a> ·
      <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="license"
        >CC BY-SA 4.0</a
      >
    </p>
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
  color: var(--text-muted);
  border-top: 1px solid var(--glass-border);
  background-color: var(--background-color);
  flex-shrink: 0;
  z-index: 1000;
}
.footer a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}
.footer a:hover { color: var(--text-primary); text-decoration: underline; }
</style>

