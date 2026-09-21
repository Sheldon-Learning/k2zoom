import type { Camera } from '../types/presentation'

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function interpolateCamera(from: Camera, to: Camera, t: number): Camera {
  const eased = easeInOutCubic(Math.min(1, Math.max(0, t)))
  const mix = (a: number, b: number) => a + (b - a) * eased
  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    zoom: Math.exp(mix(Math.log(from.zoom), Math.log(to.zoom))),
    rotation: mix(from.rotation, to.rotation),
  }
}

export class TransitionEngine {
  private frameId: number | null = null

  cancel(): void {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId)
    this.frameId = null
  }

  animate(
    from: Camera,
    to: Camera,
    duration: number,
    update: (camera: Camera) => void,
  ): void {
    this.cancel()
    if (duration <= 0) {
      update(to)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      update(interpolateCamera(from, to, progress))
      this.frameId = progress < 1 ? requestAnimationFrame(tick) : null
    }
    this.frameId = requestAnimationFrame(tick)
  }
}
