import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

export function useSnapInView(
  el: Ref<HTMLElement | null>,
  container: Ref<HTMLElement | null>,
) {
  const isInView = ref(false)
  const hasBeenInView = ref(false)
  let observer: IntersectionObserver | null = null
  let settleTimer = 0

  function onIntersect(entries: IntersectionObserverEntry[]) {
    const entry = entries[0]
    if (!entry) return

    if (entry.isIntersecting) {
      // Slide is in viewport — wait for scroll to settle
      clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (!hasBeenInView.value) {
          isInView.value = true
          hasBeenInView.value = true
        }
      }, 150)
    } else {
      isInView.value = false
    }
  }

  function createObserver(root: HTMLElement) {
    observer?.disconnect()
    observer = new IntersectionObserver(onIntersect, {
      root,
      threshold: 0.5,
    })
    if (el.value) {
      const node = el.value.$el ?? el.value
      if (node) observer.observe(node)
    }
  }

  onMounted(() => {
    if (container.value) createObserver(container.value)
    // Fallback: check after delay in case observer doesn't fire
    setTimeout(() => {
      if (!hasBeenInView.value && container.value && el.value) {
        const node = (el.value.$el ?? el.value) as HTMLElement
        const rect = node.getBoundingClientRect()
        const cRect = container.value.getBoundingClientRect()
        if (rect.top >= cRect.top - 10 && rect.top <= cRect.bottom) {
          hasBeenInView.value = true
        }
      }
    }, 300)
  })

  watch(container, (newEl) => {
    if (newEl) createObserver(newEl)
  })

  onUnmounted(() => {
    clearTimeout(settleTimer)
    observer?.disconnect()
  })

  return { isInView, hasBeenInView }
}
