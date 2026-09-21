import { ArrowRight, Images, X } from 'lucide-react'
import { visualStyles } from '../../data/visualStyles'
import type { PresentationStyle } from '../../types/presentation'

interface Props {
  selected: PresentationStyle
  onSelect: (style: PresentationStyle) => void
  onUpload: () => void
  onClose: () => void
}

const paths: Partial<Record<PresentationStyle, string>> = {
  story: 'M 18 60 L 75 26 L 132 66',
  timeline: 'M 12 48 L 140 48',
  orbit: 'M 75 10 A 54 38 0 1 1 74 10',
  grid: 'M 17 25 L 49 25 L 82 25 L 115 25 L 115 65 L 82 65 L 49 65 L 17 65',
  spiral: 'M 75 46 C 60 30 100 17 115 44 C 137 82 38 86 24 53',
  zigzag: 'M 25 18 L 124 42 L 25 67 L 124 83',
}

const previewColors = ['#123b82', '#f20b68', '#2cc5df', '#ffbf18', '#13b7a3']

function StyleArt({ style }: { style: PresentationStyle }) {
  const infographic = [
    'chevrons',
    'medallions',
    'steps',
    'ribbons',
    'milestones',
    'spectrum',
  ].includes(style)
  return (
    <span className={`style-art style-art-${style}`}>
      <svg viewBox="0 0 150 100" aria-hidden="true">
        {!infographic && (
          <>
            <path
              d={paths[style]}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={style === 'grid' ? '5 4' : undefined}
            />
            {style === 'grid'
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
                    cy={style === 'timeline' ? 48 : index % 2 ? 30 : 66}
                    r="7"
                    fill="currentColor"
                  />
                ))}
          </>
        )}
        {style === 'chevrons' &&
          previewColors.map((color, index) => (
            <g key={color}>
              <path
                d={`M ${index * 30} 39 H ${index * 30 + 24} L ${index * 30 + 30} 50 L ${index * 30 + 24} 61 H ${index * 30} L ${index * 30 + 6} 50 Z`}
                fill={color}
              />
              <line
                x1={index * 30 + 15}
                x2={index * 30 + 15}
                y1={index % 2 ? 62 : 20}
                y2={index % 2 ? 80 : 38}
                stroke={color}
                strokeWidth="2"
              />
              <circle
                cx={index * 30 + 15}
                cy={index % 2 ? 82 : 18}
                r="5"
                fill={color}
              />
            </g>
          ))}
        {style === 'medallions' && (
          <>
            <path d="M 8 50 H 142" stroke="#abc3cf" strokeWidth="3" />
            {previewColors.map((color, index) => (
              <g key={color}>
                <circle
                  cx={18 + index * 28}
                  cy="50"
                  r="11"
                  fill={color}
                  opacity=".25"
                />
                <circle cx={18 + index * 28} cy="50" r="8" fill={color} />
                <circle cx={18 + index * 28} cy="50" r="3" fill="white" />
                <line
                  x1={18 + index * 28}
                  x2={18 + index * 28}
                  y1={index % 2 ? 60 : 29}
                  y2={index % 2 ? 73 : 40}
                  stroke={color}
                  strokeWidth="2"
                />
              </g>
            ))}
          </>
        )}
        {style === 'steps' && (
          <>
            <path d="M 75 5 V 95" stroke="#b2c8d0" strokeWidth="4" />
            {previewColors.slice(0, 4).map((color, index) => (
              <g key={color}>
                <rect
                  x={index % 2 ? 78 : 14}
                  y={13 + index * 22}
                  width="58"
                  height="13"
                  rx="6"
                  fill={color}
                  opacity=".8"
                />
                <circle
                  cx="75"
                  cy={19 + index * 22}
                  r="6"
                  fill="white"
                  stroke={color}
                  strokeWidth="3"
                />
              </g>
            ))}
          </>
        )}
        {style === 'ribbons' &&
          previewColors.map((color, index) => (
            <g key={color}>
              <path
                d={`M ${index * 29} ${index % 2 ? 39 : 30} H ${index * 29 + 23} L ${index * 29 + 30} ${index % 2 ? 49 : 40} L ${index * 29 + 23} ${index % 2 ? 59 : 50} H ${index * 29} Z`}
                fill={color}
              />
              <line
                x1={index * 29 + 14}
                x2={index * 29 + 14}
                y1={index % 2 ? 60 : 51}
                y2="78"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            </g>
          ))}
        {style === 'milestones' && (
          <>
            <path d="M 5 52 H 135 L 145 52 L 135 60 H 5 Z" fill="#c8d4d8" />
            {previewColors.slice(0, 4).map((color, index) => (
              <g key={color}>
                <rect
                  x={12 + index * 34}
                  y="14"
                  width="25"
                  height="16"
                  rx="3"
                  fill={color}
                />
                <circle
                  cx={24 + index * 34}
                  cy="55"
                  r="12"
                  fill="white"
                  stroke={color}
                  strokeWidth="4"
                />
                <circle cx={24 + index * 34} cy="55" r="3" fill={color} />
              </g>
            ))}
          </>
        )}
        {style === 'spectrum' &&
          previewColors.map((color, index) => (
            <g key={color}>
              <rect x={index * 29} y="46" width="30" height="8" fill={color} />
              <circle
                cx={15 + index * 29}
                cy="50"
                r="10"
                fill="white"
                stroke={color}
                strokeWidth="5"
              />
              <circle cx={15 + index * 29} cy="50" r="3" fill={color} />
            </g>
          ))}
      </svg>
    </span>
  )
}

export function StylePicker({ selected, onSelect, onUpload, onClose }: Props) {
  const groups: {
    title: string
    styles: { id: PresentationStyle; name: string; description: string }[]
  }[] = [
    {
      title: 'Parcours spatiaux',
      styles: [
        {
          id: 'story',
          name: 'Classique',
          description: 'Retrouver la démonstration originale.',
        },
        ...visualStyles.slice(0, 5),
      ],
    },
    { title: 'Frises & infographies', styles: visualStyles.slice(5) },
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
            Les mêmes médias racontent une histoire différente selon le chemin
            suivi par la caméra.
          </p>
        </div>
        {groups.map((group) => (
          <section className="style-group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="style-grid">
              {group.styles.map((style) => (
                <button
                  key={style.id}
                  className={`style-card ${selected === style.id ? 'active' : ''}`}
                  onClick={() => onSelect(style.id)}
                  aria-pressed={selected === style.id}
                >
                  <StyleArt style={style.id} />
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
          </section>
        ))}
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
