import { describe, expect, it } from 'vitest'
import {
  appendMediaToStory,
  buildVisualPresentation,
  demoGallery,
  galleryFromPresentation,
} from './visualStyles'
import { demoPresentation } from './demo'

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

  it('keeps video and image order when changing layout', () => {
    const media = [
      demoGallery[0],
      {
        id: 'film',
        kind: 'video' as const,
        videoId: 'M7lc1UVf-VE',
        alt: 'Présentation vidéo',
        caption: 'Présentation vidéo',
      },
      demoGallery[1],
    ]
    const presentation = buildVisualPresentation('orbit', media)
    expect(
      presentation.elements.filter((element) => element.type === 'video'),
    ).toHaveLength(1)
    expect(
      galleryFromPresentation(presentation).map((item) => item.kind),
    ).toEqual(['image', 'video', 'image'])
  })

  it('adds media after the classic story without removing its content', () => {
    const video = {
      id: 'clip',
      kind: 'video' as const,
      videoId: 'M7lc1UVf-VE',
      alt: 'Clip',
      caption: 'Clip',
    }
    const next = appendMediaToStory(demoPresentation, [demoGallery[0], video])
    expect(next.elements.slice(0, demoPresentation.elements.length)).toEqual(
      demoPresentation.elements,
    )
    expect(next.path.slice(0, demoPresentation.path.length)).toEqual(
      demoPresentation.path,
    )
    expect(galleryFromPresentation(next).map((item) => item.kind)).toEqual([
      'image',
      'video',
    ])
  })
})
