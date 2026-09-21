import { ArrowRight, Images, X } from 'lucide-react'
import { visualStyles } from '../../data/visualStyles'
import type { PresentationStyle } from '../../types/presentation'

interface Props {
  selected: PresentationStyle
  onSelect: (style: PresentationStyle) => void
  onUpload: () => void
  onClose: () => void
}

const paths: Record<PresentationStyle, string> = {
  story: 'M 18 60 L 75 26 L 132 66',
  timeline: 'M 12 48 L 140 48',
  orbit: 'M 75 10 A 54 38 0 1 1 74 10',
  grid: 'M 17 25 L 49 25 L 82 25 L 115 25 L 115 65 L 82 65 L 49 65 L 17 65',
  spiral: 'M 75 46 C 60 30 100 17 115 44 C 137 82 38 86 24 53',
  zigzag: 'M 25 18 L 124 42 L 25 67 L 124 83',
}

export function StylePicker({ selected, onSelect, onUpload, onClose }: Props) {
  const styles: { id: PresentationStyle; name: string; description: string }[] =
    [
      {
        id: 'story',
        name: 'Classique',
        description: 'Retrouver la démonstration originale.',
      },
      ...visualStyles,
    ]
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="styles-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="styles-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" aria-label="Fermer" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="styles-heading">
          <span>STUDIO / PARCOURS</span>
          <h2 id="styles-title">Choisissez votre mouvement.</h2>
          <p>
            Les mêmes images racontent une histoire différente selon le chemin
            suivi par la caméra.
          </p>
        </div>
        <div className="style-grid">
          {styles.map((style) => (
            <button
              key={style.id}
              className={`style-card ${selected === style.id ? 'active' : ''}`}
              onClick={() => onSelect(style.id)}
              aria-pressed={selected === style.id}
            >
              <span className={`style-art style-art-${style.id}`}>
                <svg viewBox="0 0 150 100" aria-hidden="true">
                  <path
                    d={paths[style.id]}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={style.id === 'grid' ? '5 4' : undefined}
                  />
                  {style.id === 'grid'
                    ? Array.from({ length: 8 }, (_, index) => (
                        <rect
                          key={index}
                          x={11 + (index % 4) * 33}
                          y={17 + Math.floor(index / 4) * 40}
                          width="13"
                          height="15"
                          rx="3"
                          fill="currentColor"
                        />
                      ))
                    : [0, 1, 2].map((index) => (
                        <circle
                          key={index}
                          cx={25 + index * 49}
                          cy={
                            style.id === 'timeline' ? 48 : index % 2 ? 30 : 66
                          }
                          r="7"
                          fill="currentColor"
                        />
                      ))}
                </svg>
              </span>
              <span className="style-card-name">
                {style.name}
                {selected === style.id && (
                  <span className="style-selected">Actuel</span>
                )}
              </span>
              <span className="style-card-description">
                {style.description}
              </span>
            </button>
          ))}
        </div>
        <div className="styles-footer">
          <span>Vos images restent dans ce navigateur.</span>
          <button className="button button-primary" onClick={onUpload}>
            <Images size={16} /> Ajouter mes images <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
