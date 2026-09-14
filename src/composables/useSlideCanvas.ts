import { ref, watch, nextTick, type Ref } from 'vue'
import gsap from 'gsap'

/**
 * 通用 slide canvas 渐变动画。
 * 在 animated 变为 true 时，绘制白色线性渐变并淡入。
 * animated 变回 false 时清除 canvas，允许下次重新触发。
 * 防抖：动画进行中忽略新的触发，避免重复初始化。
 *
 * 用法：
 *   const { canvasRef, animationDone } = useSlideCanvas(() => props.animated, canvasRef)
 *   watch(() => props.animated, (v) => {
 *     if (v) animationDone.then(() => { ... })
 *   })
 */
export function useSlideCanvas(
  animated: () => boolean | undefined,
  canvasRef: Ref<HTMLCanvasElement | null>
) {
  let resolveAnimation: (() => void) | null = null
  let animationDone: Promise<void> = Promise.resolve()
  let pendingTimer = 0
  let busy = false

  function clearCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return
    gsap.killTweensOf(canvas)
    gsap.set(canvas, { opacity: 0 })
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    busy = false
  }

  function drawAndFadeIn() {
    if (!animated() || !canvasRef.value || busy) return
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    busy = true

    const width = (canvas.width = canvas.offsetWidth)
    const height = (canvas.height = canvas.offsetHeight)

    ctx.clearRect(0, 0, width, height)
    gsap.fromTo(canvas,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        onComplete() {
          busy = false
          resolveAnimation!()
        }
      }
    )
  }

  watch(animated, (v) => {
    clearTimeout(pendingTimer)
    if (v) {
      if (busy) return
      animationDone = new Promise<void>((resolve) => {
        resolveAnimation = resolve
      })
      pendingTimer = setTimeout(() => nextTick(drawAndFadeIn), 1000)
    } else {
      clearCanvas()
    }
  })

  return { canvasRef, get animationDone() { console.log("animationDone",canvasRef.value); return animationDone } }
}
