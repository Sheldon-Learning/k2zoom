import { describe, expect, it } from 'vitest'
import { textPositionAfterDrag, textRotationAfterDrag } from './textGeometry'

describe('text manipulation on the canvas', () => {
  it('moves text in world coordinates at a nondefault zoom', () => {
    expect(
      textPositionAfterDrag(
        { x: 100, y: 200 },
        { x: 40, y: -20 },
        { x: 0, y: 0, zoom: 0.5, rotation: 0 },
      ),
    ).toEqual({ x: 180, y: 160 })
  })

  it('accounts for camera rotation while dragging', () => {
    expect(
      textPositionAfterDrag(
        { x: 100, y: 200 },
        { x: 0, y: 50 },
        { x: 0, y: 0, zoom: 1, rotation: 90 },
      ),
    ).toEqual({ x: 150, y: 200 })
  })

  it('wraps rotation into the editor’s angle range', () => {
    expect(textRotationAfterDrag(170, 0, Math.PI / 2)).toBe(-100)
  })
})
