import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoPresentation } from '../data/demo'
import { buildVisualPresentation, demoGallery } from '../data/visualStyles'
import { loadPresentation, parsePresentation } from './storage'

afterEach(() => vi.unstubAllGlobals())

describe('presentation JSON', () => {
  it('loads an existing Zoomet document and migrates it to Kzoom', () => {
    const entries = new Map([
      ['zoomet.presentation.v1', JSON.stringify(demoPresentation)],
    ])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    })
    expect(loadPresentation()).toEqual(demoPresentation)
    expect(entries.get('kzoom.presentation.v1')).toBe(
      JSON.stringify(demoPresentation),
    )
  })
  it('round trips the presentation and its path', () => {
    expect(parsePresentation(JSON.stringify(demoPresentation))).toEqual(
      demoPresentation,
    )
    expect(demoPresentation.path).toEqual(
      demoPresentation.frames.map((frame) => frame.id),
    )
  })
  it('rejects unsupported files', () => {
    expect(() => parsePresentation('{"version":2}')).toThrow()
    expect(() =>
      parsePresentation(
        JSON.stringify({ ...demoPresentation, frames: [{ id: 'broken' }] }),
      ),
    ).toThrow()
  })
  it('accepts a visual gallery with embedded image data', () => {
    const gallery = buildVisualPresentation('orbit', demoGallery)
    expect(parsePresentation(JSON.stringify(gallery))).toEqual(gallery)
  })
  it.each([
    'chevrons',
    'medallions',
    'steps',
    'ribbons',
    'milestones',
    'spectrum',
  ] as const)('round trips the %s infographic style', (style) => {
    const presentation = buildVisualPresentation(style, demoGallery.slice(0, 3))
    expect(parsePresentation(JSON.stringify(presentation))).toEqual(
      presentation,
    )
  })
  it('accepts video elements with a validated YouTube ID', () => {
    const presentation = buildVisualPresentation('timeline', [
      {
        id: 'film',
        kind: 'video',
        videoId: 'M7lc1UVf-VE',
        alt: 'Film',
        caption: 'Film',
      },
    ])
    expect(parsePresentation(JSON.stringify(presentation))).toEqual(
      presentation,
    )
    const bad = {
      ...presentation,
      elements: presentation.elements.map((element) =>
        element.type === 'video' ? { ...element, videoId: 'bad' } : element,
      ),
    }
    expect(() => parsePresentation(JSON.stringify(bad))).toThrow()
  })
  it('keeps text font settings in exported presentations', () => {
    const edited = {
      ...demoPresentation,
      elements: demoPresentation.elements.map((element) =>
        element.id === 'intro-heading' && element.type === 'text'
          ? {
              ...element,
              text: 'Mon titre',
              fontFamily: 'Impact',
              fontSize: 160,
              effect: 'video',
              customColor: true,
              color: '#ffbf18',
              rotation: 35,
            }
          : element,
      ),
    }
    expect(parsePresentation(JSON.stringify(edited))).toEqual(edited)
    const invalid = {
      ...edited,
      elements: edited.elements.map((element) =>
        element.id === 'intro-heading'
          ? { ...element, fontSize: 500 }
          : element,
      ),
    }
    expect(() => parsePresentation(JSON.stringify(invalid))).toThrow()
    const invalidEffect = {
      ...edited,
      elements: edited.elements.map((element) =>
        element.id === 'intro-heading'
          ? { ...element, effect: 'unknown' }
          : element,
      ),
    }
    expect(() => parsePresentation(JSON.stringify(invalidEffect))).toThrow()
  })
})
