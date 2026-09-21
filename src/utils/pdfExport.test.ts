import { describe, expect, it } from 'vitest'
import { demoPresentation } from '../data/demo'
import type { Presentation } from '../types/presentation'
import { elementsForPdfFrame } from './pdfExport'

describe('PDF frame content', () => {
  it('keeps existing content with its presentation step', () => {
    const intro = demoPresentation.frames[0]
    const solution = demoPresentation.frames[1]

    expect(
      elementsForPdfFrame(demoPresentation, intro).map((element) => element.id),
    ).toContain('intro-heading')
    expect(
      elementsForPdfFrame(demoPresentation, intro).map((element) => element.id),
    ).not.toContain('solution-heading')
    expect(
      elementsForPdfFrame(demoPresentation, solution).map(
        (element) => element.id,
      ),
    ).toContain('solution-heading')
  })

  it('exports moved custom text with its assigned step', () => {
    const presentation: Presentation = {
      ...demoPresentation,
      elements: [
        ...demoPresentation.elements,
        {
          id: 'custom-title',
          type: 'text',
          frameId: 'intro',
          text: 'Titre déplacé',
          variant: 'heading',
          x: 4000,
          y: 4000,
          width: 300,
          height: 80,
          rotation: 30,
          color: '#ff0088',
        },
      ],
    }

    expect(
      elementsForPdfFrame(presentation, presentation.frames[0]).map(
        (element) => element.id,
      ),
    ).toContain('custom-title')
    expect(
      elementsForPdfFrame(presentation, presentation.frames[1]).map(
        (element) => element.id,
      ),
    ).not.toContain('custom-title')
  })
})
