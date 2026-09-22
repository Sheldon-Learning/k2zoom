import { describe, expect, it } from 'vitest'
import {
  appendMediaToStory,
  buildVisualPresentation,
  demoGallery,
  galleryFromPresentation,
  visualStyles,
} from './visualStyles'
import { demoPresentation } from './demo'
import type { TextElement } from '../types/presentation'

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

  it.each([
    'orbit-eclipse',
    'orbit-amber',
    'orbit-azure',
    'orbit-pearl',
    'orbit-duo',
    'orbit-concentric',
    'orbit-plasma',
    'orbit-mint',
    'orbit-scarlet',
  ] as const)('builds eight editable slides for circle style %s', (style) => {
    const presentation = buildVisualPresentation(style, demoGallery)
    expect(presentation.frames).toHaveLength(8)
    expect(presentation.elements).toHaveLength(16)
    expect(presentation.style).toBe(style)
    expect(
      new Set(presentation.frames.map((frame) => `${frame.x},${frame.y}`)).size,
    ).toBe(8)
  })

  it.each(visualStyles.map((style) => style.id))(
    'creates a circular-frame version of %s',
    (style) => {
      const presentation = buildVisualPresentation(
        style,
        demoGallery.slice(0, 4),
        'Cercles',
        undefined,
        'circle',
      )
      expect(presentation.frameShape).toBe('circle')
      expect(
        presentation.frames.every(
          (frame) => frame.width === 400 && frame.height === 400,
        ),
      ).toBe(true)
      expect(
        presentation.elements.filter((element) => element.type === 'image'),
      ).toHaveLength(4)
    },
  )

  it.each([
    'chevrons',
    'medallions',
    'steps',
    'ribbons',
    'milestones',
    'spectrum',
  ] as const)('builds a distinct eight-step %s infographic', (style) => {
    const presentation = buildVisualPresentation(style, demoGallery)
    expect(presentation.frames).toHaveLength(8)
    expect(presentation.path).toEqual(
      presentation.frames.map((frame) => frame.id),
    )
    expect(
      new Set(presentation.frames.map((frame) => `${frame.x},${frame.y}`)).size,
    ).toBe(8)
    expect(
      galleryFromPresentation(presentation).map((item) => item.caption),
    ).toEqual(demoGallery.map((item) => item.caption))
  })

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

  it('keeps edited captions and added text when the gallery layout changes', () => {
    const original = buildVisualPresentation(
      'timeline',
      demoGallery.slice(0, 2),
    )
    const custom: TextElement = {
      id: 'my-note',
      type: 'text',
      frameId: original.frames[0].id,
      variant: 'body',
      text: 'Une note personnelle',
      color: '#123456',
      fontFamily: 'Georgia',
      fontSize: 32,
      x: original.frames[0].x + 1800,
      y: original.frames[0].y + 80,
      width: 300,
      height: 90,
      rotation: 0,
    }
    const edited = {
      ...original,
      elements: [
        ...original.elements.map((element) =>
          element.id === 'visual-1-caption' && element.type === 'text'
            ? { ...element, text: 'Titre modifié', fontSize: 38 }
            : element,
        ),
        custom,
      ],
    }
    const next = buildVisualPresentation(
      'grid',
      galleryFromPresentation(edited),
      edited.title,
      edited,
    )
    expect(
      next.elements.find((element) => element.id === 'visual-1-caption'),
    ).toMatchObject({
      text: 'Titre modifié',
      fontSize: 38,
    })
    expect(
      next.elements.find((element) => element.id === 'my-note'),
    ).toMatchObject({
      text: custom.text,
      fontFamily: 'Georgia',
      fontSize: 32,
      x: custom.x + next.frames[0].x - original.frames[0].x,
    })
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
