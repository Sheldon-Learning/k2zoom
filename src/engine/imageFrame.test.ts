import { describe, expect, it } from 'vitest'
import { fitImageToFrame, frameAtPoint, imageCropAfterDrag } from './imageFrame'

const frame = {
  id: 'slide',
  name: 'Slide',
  x: 100,
  y: 200,
  width: 400,
  height: 300,
  rotation: 0,
  cameraZoom: 1,
  duration: 500,
  accent: '#fff',
}

describe('images fitted to frames', () => {
  it('finds the frame below a point, including a rotated frame', () => {
    expect(frameAtPoint([frame], { x: 300, y: 350 })?.id).toBe('slide')
    expect(
      frameAtPoint([{ ...frame, rotation: 45 }], { x: 300, y: 350 })?.id,
    ).toBe('slide')
    expect(frameAtPoint([frame], { x: 20, y: 20 })).toBeUndefined()
    expect(frameAtPoint([frame], { x: 110, y: 210 }, 'circle')).toBeUndefined()
  })

  it('fits an image exactly to its destination frame', () => {
    expect(
      fitImageToFrame(
        {
          id: 'image',
          type: 'image',
          src: '/image.png',
          alt: 'Image',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
        },
        frame,
      ),
    ).toMatchObject({
      frameId: 'slide',
      x: 100,
      y: 200,
      width: 400,
      height: 300,
      fit: 'cover',
      objectPositionX: 50,
      objectPositionY: 50,
    })
  })

  it('moves and clamps the crop inside the frame', () => {
    expect(
      imageCropAfterDrag(
        { objectPositionX: 50, objectPositionY: 50 },
        { x: 100, y: -150 },
        frame,
        1,
      ),
    ).toEqual({ objectPositionX: 75, objectPositionY: 0 })
  })
})
