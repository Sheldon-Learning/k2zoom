import { useState } from 'react'
import { ArrowRight, Images, X } from 'lucide-react'
import {
  circleStyleThemes,
  isCircleStyle,
  visualStyles,
  type CirclePresentationStyle,
} from '../../data/visualStyles'
import type { PresentationStyle } from '../../types/presentation'

interface Props {
  selected: PresentationStyle
  selectedShape: 'rectangle' | 'circle'
  onSelect: (
    style: PresentationStyle,
    frameShape: 'rectangle' | 'circle',
  ) => void
  onUpload: () => void
  onClose: () => void
}

type SpatialStyle =
  'story' | 'timeline' | 'orbit' | 'grid' | 'spiral' | 'zigzag'

const spatialPreviews: Record<
  SpatialStyle,
  { route: string; slides: [number, number][] }
> = {
  story: {
    route: 'M 30 73 L 118 27 L 207 72',
    slides: [
      [30, 73],
      [118, 27],
      [207, 72],
    ],
  },
  timeline: {
    route: 'M 28 52 H 213',
    slides: [
      [28, 52],
      [90, 52],
      [151, 52],
      [213, 52],
    ],
  },
  orbit: {
    route:
      'M 120 20 C 173 20 208 32 208 52 C 208 78 163 89 120 89 C 75 89 32 78 32 52 C 32 32 73 20 120 20 Z',
    slides: [
      [120, 20],
      [208, 52],
      [120, 89],
      [32, 52],
    ],
  },
  grid: {
    route: 'M 25 31 H 216 V 75 H 25',
    slides: [
      [25, 31],
      [88, 31],
      [152, 31],
      [216, 31],
      [216, 75],
      [152, 75],
      [88, 75],
      [25, 75],
    ],
  },
  spiral: {
    route:
      'M 117 46 C 109 28 133 19 151 31 C 177 48 162 79 125 82 C 83 86 54 67 66 41 C 73 27 86 24 95 25',
    slides: [
      [117, 46],
      [151, 31],
      [162, 72],
      [96, 80],
      [66, 41],
    ],
  },
  zigzag: {
    route: 'M 35 25 H 202 L 35 52 H 202 L 35 79 H 202',
    slides: [
      [35, 25],
      [202, 25],
      [35, 52],
      [202, 52],
      [35, 79],
      [202, 79],
    ],
  },
}

const previewColors = ['#123b82', '#f20b68', '#2cc5df', '#ffbf18', '#13b7a3']

function SpatialStyleArt({
  style,
  frameShape,
}: {
  style: SpatialStyle
  frameShape: 'rectangle' | 'circle'
}) {
  const preview = spatialPreviews[style]
  return (
    <span className={`style-art style-art-spatial style-art-${style}`}>
      <svg viewBox="0 0 240 104" aria-hidden="true">
        <path
          d={preview.route}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 5"
          opacity=".52"
        />
        {preview.slides.map(([x, y], index) => {
          const color = previewColors[index % previewColors.length]
          return (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              {frameShape === 'circle' ? (
                <>
                  <circle
                    r="16"
                    fill="white"
                    stroke={color}
                    strokeWidth="1.4"
                  />
                  <circle r="12" fill={color} opacity=".9" />
                </>
              ) : (
                <>
                  <rect
                    x="-20"
                    y="-15"
                    width="40"
                    height="30"
                    rx="5"
                    fill="white"
                    stroke={color}
                    strokeWidth="1.4"
                  />
                  <rect
                    x="-16"
                    y="-11"
                    width="32"
                    height="20"
                    rx="2.5"
                    fill={color}
                    opacity=".9"
                  />
                </>
              )}
              <circle cx="6" cy="-6" r="3" fill="#ffffffc9" />
              <path
                d="M -16 5 Q -8 -3 0 4 T 16 2 V 9 H -16 Z"
                fill="#ffffffa8"
              />
              <rect
                x="-15"
                y="11"
                width="13"
                height="1.5"
                rx=".75"
                fill={color}
                opacity=".65"
              />
            </g>
          )
        })}
      </svg>
    </span>
  )
}

function CircleStyleArt({
  style,
  frameShape,
}: {
  style: CirclePresentationStyle
  frameShape: 'rectangle' | 'circle'
}) {
  const theme = circleStyleThemes[style]
  const gradientId = `circle-gradient-${style}`
  const glowId = `circle-glow-${style}`
  const points = Array.from({ length: 7 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 7
    const radius = style === 'orbit-concentric' ? (index % 2 ? 25 : 39) : 39
    return {
      x: 120 + Math.cos(angle) * radius,
      y: 52 + Math.sin(angle) * radius,
    }
  })
  return (
    <span className={`style-art style-art-circle style-art-${style}`}>
      <svg viewBox="0 0 240 104" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1">
            <stop stopColor={theme.primary} />
            <stop offset="1" stopColor={theme.secondary} />
          </linearGradient>
          <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="240" height="104" rx="14" fill={theme.surface} />
        <circle
          cx="120"
          cy="52"
          r="39"
          fill="none"
          stroke={theme.glow}
          strokeWidth="8"
          opacity=".16"
        />
        <circle
          cx="120"
          cy="52"
          r="39"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.4"
          filter={`url(#${glowId})`}
        />
        {style === 'orbit-concentric' && (
          <circle
            cx="120"
            cy="52"
            r="25"
            fill="none"
            stroke={theme.secondary}
            strokeWidth="2"
            opacity=".9"
          />
        )}
        {points.map(({ x, y }, index) => (
          <g key={index} transform={`translate(${x} ${y})`}>
            {frameShape === 'circle' ? (
              <circle
                r="10"
                fill="#ffffffef"
                stroke={index % 2 ? theme.secondary : theme.primary}
                strokeWidth="1"
              />
            ) : (
              <rect
                x="-11"
                y="-8"
                width="22"
                height="16"
                rx="4"
                fill="#ffffffef"
                stroke={index % 2 ? theme.secondary : theme.primary}
                strokeWidth="1"
              />
            )}
            <rect
              x="-7"
              y="-4"
              width="14"
              height="5"
              rx="2"
              fill={index % 2 ? theme.secondary : theme.primary}
              opacity=".82"
            />
            <rect
              x="-7"
              y="3"
              width="9"
              height="1.5"
              rx="1"
              fill="#8b93a1"
              opacity=".6"
            />
          </g>
        ))}
        <circle cx="120" cy="52" r="12" fill="#ffffff10" stroke="#ffffff35" />
        <circle cx="120" cy="52" r="2.5" fill={theme.secondary} />
      </svg>
    </span>
  )
}

function StyleArt({
  style,
  frameShape,
}: {
  style: PresentationStyle
  frameShape: 'rectangle' | 'circle'
}) {
  if (isCircleStyle(style))
    return <CircleStyleArt style={style} frameShape={frameShape} />
  if (style in spatialPreviews)
    return (
      <SpatialStyleArt style={style as SpatialStyle} frameShape={frameShape} />
    )
  return (
    <span className={`style-art style-art-${style}`}>
      <svg viewBox="0 0 150 100" aria-hidden="true">
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

export function StylePicker({
  selected,
  selectedShape,
  onSelect,
  onUpload,
  onClose,
}: Props) {
  const [frameShape, setFrameShape] = useState(selectedShape)
  const stylesById = (ids: PresentationStyle[]) =>
    visualStyles.filter((style) => ids.includes(style.id))
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
        ...stylesById(['timeline', 'grid', 'spiral', 'zigzag']),
      ],
    },
    {
      title: 'Cercle',
      styles: visualStyles.filter((style) => isCircleStyle(style.id)),
    },
    {
      title: 'Frises & infographies',
      styles: stylesById([
        'chevrons',
        'medallions',
        'steps',
        'ribbons',
        'milestones',
        'spectrum',
      ]),
    },
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
        <div className="frame-shape-picker" aria-label="Forme des cadres">
          <span>FORME DES CADRES</span>
          <div>
            <button
              type="button"
              className={frameShape === 'rectangle' ? 'active' : ''}
              aria-pressed={frameShape === 'rectangle'}
              onClick={() => setFrameShape('rectangle')}
            >
              <i className="frame-shape-icon shape-rectangle" /> Rectangles
            </button>
            <button
              type="button"
              className={frameShape === 'circle' ? 'active' : ''}
              aria-pressed={frameShape === 'circle'}
              onClick={() => setFrameShape('circle')}
            >
              <i className="frame-shape-icon shape-circle" /> Cercles
            </button>
          </div>
        </div>
        {groups.map((group) => (
          <section className="style-group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="style-grid">
              {group.styles.map((style) => (
                <button
                  key={style.id}
                  className={`style-card ${selected === style.id && (style.id === 'story' || selectedShape === frameShape) ? 'active' : ''}`}
                  onClick={() =>
                    onSelect(
                      style.id,
                      style.id === 'story' ? 'rectangle' : frameShape,
                    )
                  }
                  aria-pressed={
                    selected === style.id &&
                    (style.id === 'story' || selectedShape === frameShape)
                  }
                >
                  <StyleArt style={style.id} frameShape={frameShape} />
                  <span className="style-card-name">
                    {style.name}
                    {selected === style.id &&
                      (style.id === 'story' ||
                        selectedShape === frameShape) && (
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
