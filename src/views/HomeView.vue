<template>
  <!-- 根容器：占满父元素 -->
  <div class="u-h-full u-w-full home">
    <!-- 内容层：MainContainer -->
    <MainContainer />

    <!-- 首页文案层（混搭自 Personal_Web 老站首页）：浮于 3D 画布之上，
         面板本体不拦截指针，仅链接可点，画布交互不受影响 -->
    <div class="hero">
      <blockquote class="quote">“灵感如星辰闪烁，照亮我的方向，引领我的探索。”</blockquote>
      <hr class="rule" />
      <p class="who">
        陶雨迪
        <a class="mail" href="mailto:yudi.tao@outlook.com">yudi.tao@outlook.com</a>
      </p>
      <p class="specs-label">我的专业领域</p>
      <ul class="specs">
        <li v-for="s in specs" :key="s">{{ s }}</li>
      </ul>
      <router-link class="more" to="/about">更多我可以做的事情 ⟶</router-link>
    </div>
  </div>
</template>
<script setup lang="ts">
import MainContainer from '@/components/main/MainContainer.vue';

defineOptions({
  name: 'HomeView',
});

const specs = ['计算机图形学', '数字媒体', '网页设计', '平面设计'];
</script>

<style scoped>
.home {
  position: relative;
}
.hero {
  position: absolute;
  top: 50%;
  right: 4vw;
  transform: translateY(-50%);
  width: min(440px, 42vw);
  padding: 28px 30px;
  text-align: right;
  /* 不可预测的亮色3D画布之上必须用实面(白玻璃/黑玻璃),纯玻璃会白字压亮底 */
  background: var(--navbar-bg);
  backdrop-filter: blur(14px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  pointer-events: none;
  animation: heroIn 0.9s ease-out 0.2s both;
}
.hero a {
  pointer-events: auto;
}
.quote {
  margin: 0;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.65;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}
.rule {
  border: none;
  border-top: 1px solid var(--glass-border);
  margin: 18px 0;
}
.who {
  margin: 0 0 22px;
  font-size: 15px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mail {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 13.5px;
}
.mail:hover {
  text-decoration: underline;
}
.specs-label {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.specs {
  list-style: none;
  margin: 0 0 22px;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.specs li {
  font-size: 14px;
  color: var(--text-primary);
  padding: 7px 10px;
  background: var(--tag-bg);
  border: 1px solid var(--tag-border);
  border-radius: 999px;
}
.more {
  display: inline-block;
  font-size: 13.5px;
  color: var(--primary-color);
  text-decoration: none;
  padding: 9px 18px;
  border: 1px solid var(--glass-border-hover);
  border-radius: 999px;
  transition: background 0.25s ease;
}
.more:hover {
  background: var(--glass-bg-hover);
}
@keyframes heroIn {
  from {
    opacity: 0;
    transform: translateY(calc(-50% + 16px));
  }
  to {
    opacity: 1;
    transform: translateY(-50%);
  }
}
@media (max-width: 768px) {
  .hero {
    top: auto;
    bottom: 24px;
    right: 16px;
    left: 16px;
    width: auto;
    transform: none;
    text-align: center;
    padding: 20px 18px;
  }
  .quote {
    font-size: 17px;
  }
  .who {
    align-items: center;
  }
  @keyframes heroIn {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
