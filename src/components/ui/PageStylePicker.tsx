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
  creating: boolean
  onSelect: (style: PageStyle) => void
  onClose: () => void
}

export function PageStylePicker({
  selected,
  creating,
  onSelect,
  onClose,
}: Props) {
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
        <span className="page-style-eyebrow">SOUS-PRÉSENTATION</span>
        <h2 id="page-style-title">
          {creating
            ? 'Choisissez votre style.'
            : 'Un style pour tout le parcours.'}
        </h2>
        <p>
          {creating
            ? 'Le choix du style précède la création de votre sous-présentation.'
            : 'Ce style s’applique à toutes les slides de cette sous-présentation.'}
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
