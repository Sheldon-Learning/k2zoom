import { describe, expect, it } from 'vitest'
import {
  buildVisualPresentation,
  demoGallery,
  galleryFromPresentation,
} from './visualStyles'

describe('visual presentation layouts', () => {
  it('places a nine-image gallery in four columns over three rows', () => {
    const gallery = [...demoGallery, { ...demoGallery[0], id: 'ninth' }]
    const presentation = buildVisualPresentation('grid', gallery)
    expect(presentation.path).toHaveLength(9)
    expect(
      new Set(presentation.frames.slice(0, 4).map((frame) => frame.x)).size,
    ).toBe(4)
    expect(new Set(presentation.frames.map((frame) => frame.y)).size).toBe(3)
    expect(presentation.frames[4].x).toBeGreaterThan(presentation.frames[5].x)
    expect(
      galleryFromPresentation(presentation).map((image) => image.caption),
    ).toEqual(gallery.map((image) => image.caption))
  })

  it.each(['timeline', 'orbit', 'spiral', 'zigzag'] as const)(
    'keeps every image in a distinct frame for %s',
    (style) => {
      const presentation = buildVisualPresentation(style, demoGallery)
      expect(presentation.frames).toHaveLength(demoGallery.length)
      expect(
        presentation.elements.filter((element) => element.type === 'image'),
      ).toHaveLength(demoGallery.length)
      expect(
        new Set(presentation.frames.map((frame) => `${frame.x},${frame.y}`))
          .size,
      ).toBe(demoGallery.length)
    },
  )
})
