import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SlideNumber } from './SlideNumber'

describe('slide number actions', () => {
  it('allows opening the editor menu before a slide has children', () => {
    const html = renderToStaticMarkup(
      <SlideNumber
        number="02"
        title="Produit"
        childCount={0}
        onExplore={() => undefined}
        actionLabel="Gérer les sous-slides de Produit"
        showAddIndicator
      />,
    )
    expect(html).toContain('Gérer les sous-slides de Produit')
    expect(html).not.toContain('disabled=""')
    expect(html).toContain('slide-number-indicator')
  })

  it('disables presentation entry when there are no children', () => {
    const html = renderToStaticMarkup(
      <SlideNumber number="02" title="Produit" childCount={0} />,
    )
    expect(html).toContain('disabled=""')
  })
})
