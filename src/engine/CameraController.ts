import type { Camera, Frame } from '../types/presentation'
import {
  cameraForFrame,
  fitCamera,
  panCamera,
  zoomAt,
  type Point,
  type Size,
} from './camera'
import { TransitionEngine } from './transitions'

export class CameraController {
  private transitions = new TransitionEngine()

  constructor(
    private getCamera: () => Camera,
    private setCamera: (camera: Camera) => void,
    private getViewport: () => Size,
  ) {}

  moveTo(x: number, y: number, duration = 0): void {
    this.animate({ ...this.getCamera(), x, y }, duration)
  }
  zoomTo(zoom: number, anchor?: Point): void {
    const current = this.getCamera()
    this.transitions.cancel()
    this.setCamera(
      zoomAt(
        current,
        zoom / current.zoom,
        anchor ?? {
          x: this.getViewport().width / 2,
          y: this.getViewport().height / 2,
        },
        this.getViewport(),
      ),
    )
  }
  rotateTo(rotation: number, duration = 0): void {
    this.animate({ ...this.getCamera(), rotation }, duration)
  }
  panBy(delta: Point): void {
    this.transitions.cancel()
    this.setCamera(panCamera(this.getCamera(), delta))
  }
  focusOn(frame: Frame, duration = 850): void {
    this.animate(cameraForFrame(frame, this.getViewport()), duration)
  }
  fitToScreen(frames: Frame[], duration = 600): void {
    this.animate(fitCamera(frames, this.getViewport()), duration)
  }
  resetCamera(duration = 500): void {
    this.animate({ x: 0, y: 0, zoom: 1, rotation: 0 }, duration)
  }
  stop(): void {
    this.transitions.cancel()
  }

  private animate(target: Camera, duration: number): void {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    this.transitions.animate(
      this.getCamera(),
      reduced ? { ...target, rotation: 0 } : target,
      reduced ? 0 : duration,
      this.setCamera,
    )
  }
}
