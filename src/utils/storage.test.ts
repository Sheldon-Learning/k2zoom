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
})
