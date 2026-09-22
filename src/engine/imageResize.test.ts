import { describe, expect, it } from 'vitest'
import { imageSizeAfterDrag, resizeImageByFactor } from './imageResize'

const image = { x: 100, y: 200, width: 400, height: 200, rotation: 0 }

describe('image resizing', () => {
  it('grows and shrinks proportionally through a zoomed camera', () => {
    expect(
      imageSizeAfterDrag(image, { x: 50, y: 0 }, { zoom: 0.5, rotation: 0 }),
    ).toEqual({ x: 100, y: 200, width: 500, height: 250 })
    expect(
      imageSizeAfterDrag(image, { x: -50, y: 0 }, { zoom: 0.5, rotation: 0 }),
    ).toEqual({ x: 100, y: 200, width: 300, height: 150 })
  })

  it('uses the image axis after camera and image rotation', () => {
    expect(
      imageSizeAfterDrag(
        { ...image, rotation: 90 },
        { x: 0, y: 40 },
        { zoom: 1, rotation: 0 },
      ).width,
    ).toBe(440)
    expect(
      imageSizeAfterDrag(image, { x: 0, y: 40 }, { zoom: 1, rotation: 90 })
        .width,
    ).toBe(440)
  })

  it('keeps sizes positive and bounded', () => {
    expect(resizeImageByFactor(image, 0).width).toBe(96)
    expect(resizeImageByFactor(image, 100).width).toBe(4096)
  })
})
