import { describe, expect, it } from 'vitest'
import { demoPresentation } from '../data/demo'
import { buildVisualPresentation, demoGallery } from '../data/visualStyles'
import { parsePresentation } from './storage'

describe('presentation JSON', () => {
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
              fontFamily: 'Georgia',
              fontSize: 72,
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
  })
})
