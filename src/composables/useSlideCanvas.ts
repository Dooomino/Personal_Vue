import { ref, watch, nextTick } from 'vue'
import gsap from 'gsap'

/**
 * 通用 slide canvas 渐变动画。
 * 在 animated 变为 true 时，绘制白色线性渐变并淡入。
 * animated 变回 false 时清除 canvas，允许下次重新触发。
 */
export function useSlideCanvas(animated: () => boolean | undefined) {
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  let resolveAnimation: () => void
  let animationDone = createPromise()
  let pendingTimer = 0

  function createPromise() {
    return new Promise<void>((resolve) => {
      resolveAnimation = resolve
    })
  }

  function clearCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return
    gsap.killTweensOf(canvas)
    gsap.set(canvas, { opacity: 0 })
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function drawAndFadeIn() {
    if (!animated()) return
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = canvas.offsetWidth)
    const height = (canvas.height = canvas.offsetHeight)

    ctx.clearRect(0, 0, width, height)

    const gradient = ctx.createLinearGradient(width, 0, width, height)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    gsap.fromTo(canvas,
      { opacity: 0 },
      { opacity: 1, duration: 1, onComplete: resolveAnimation }
    )
  }

  watch(animated, (v) => {
    clearTimeout(pendingTimer)
    if (v) {
      animationDone = createPromise()
      pendingTimer = setTimeout(() => nextTick(drawAndFadeIn), 1000)
    } else {
      clearCanvas()
    }
  })

  return { canvasRef, get animationDone() { return animationDone } }
}
