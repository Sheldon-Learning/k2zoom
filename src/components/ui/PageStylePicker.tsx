import { Check, X } from 'lucide-react'
import type { Frame } from '../../types/presentation'

type PageStyle = NonNullable<Frame['pageStyle']>

const styles: { id: PageStyle; name: string; description: string }[] = [
  { id: 'paper', name: 'Clair', description: 'Une page blanche et épurée.' },
  { id: 'aurora', name: 'Aurore', description: 'Un dégradé doux et lumineux.' },
  { id: 'midnight', name: 'Minuit', description: 'Un contraste profond.' },
  { id: 'sand', name: 'Sable', description: 'Une teinte chaude et calme.' },
]

interface Props {
  selected: PageStyle
  onSelect: (style: PageStyle) => void
  onClose: () => void
}

export function PageStylePicker({ selected, onSelect, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="page-style-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-style-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="page-style-close"
          aria-label="Fermer"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <span className="page-style-eyebrow">PERSONNALISER LA PAGE</span>
        <h2 id="page-style-title">Un espace à votre image.</h2>
        <p>
          Choisissez l’ambiance de cette sous-slide. Son contenu reste en place.
        </p>
        <div className="page-style-options">
          {styles.map((style) => (
            <button
              type="button"
              key={style.id}
              className={`page-style-option ${selected === style.id ? 'is-selected' : ''}`}
              onClick={() => onSelect(style.id)}
              aria-pressed={selected === style.id}
            >
              <span className={`page-style-preview page-style-${style.id}`}>
                <span className="page-style-preview-title" />
                <span className="page-style-preview-line" />
                <span className="page-style-preview-line short" />
              </span>
              <span className="page-style-option-copy">
                <strong>{style.name}</strong>
                <small>{style.description}</small>
              </span>
              {selected === style.id && (
                <Check className="page-style-check" size={17} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
