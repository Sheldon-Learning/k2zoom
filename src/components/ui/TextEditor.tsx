import { Plus, RotateCw, Trash2, X } from 'lucide-react'
import type { Frame, TextElement } from '../../types/presentation'

interface Props {
  frame: Frame | undefined
  visualStyle: boolean
  texts: TextElement[]
  selected: TextElement | undefined
  onSelect: (id: string) => void
  onTitleChange: (title: string) => void
  onChange: (changes: Partial<TextElement>) => void
  onAdd: () => void
  onAddTitle: () => void
  onDelete: () => void
  onClose: () => void
}

const fonts: NonNullable<TextElement['fontFamily']>[] = [
  'Manrope',
  'DM Sans',
  'Georgia',
  'Arial',
  'Courier New',
  'Impact',
  'Arial Black',
]

const colors = [
  '#ffffff',
  '#172736',
  '#2cc5df',
  '#f20b68',
  '#ffbf18',
  '#93bf4d',
]

function defaultSize(text: TextElement, visualStyle: boolean): number {
  if (text.variant === 'heading') return text.effect === 'video' ? 100 : 57
  if (text.variant === 'eyebrow') return 15
  return visualStyle && text.id.endsWith('-caption') ? 27 : 21
}

export function TextEditor({
  frame,
  visualStyle,
  texts,
  selected,
  onSelect,
  onTitleChange,
  onChange,
  onAdd,
  onAddTitle,
  onDelete,
  onClose,
}: Props) {
  return (
    <aside className="text-editor" aria-label="Éditeur de texte">
      <div className="text-editor-heading">
        <div>
          <span className="text-editor-eyebrow">ÉDITION</span>
          <h2>Texte</h2>
        </div>
        <button
          type="button"
          aria-label="Fermer l’éditeur de texte"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <label className="text-editor-field">
        <span>Titre de l’étape</span>
        <input
          value={
            frame
              ? frame.name.includes('·')
                ? frame.name
                    .slice(frame.name.indexOf('·') + 1)
                    .replace(/^ /, '')
                : frame.name
              : ''
          }
          onChange={(event) => onTitleChange(event.target.value)}
          disabled={!frame}
          maxLength={100}
        />
      </label>
      <div className="text-editor-section">
        <span>Blocs de texte</span>
        <div className="text-editor-add-actions">
          <button type="button" onClick={onAdd} disabled={!frame}>
            <Plus size={15} /> Texte
          </button>
          <button type="button" onClick={onAddTitle} disabled={!frame}>
            <Plus size={15} /> Titre XXL
          </button>
        </div>
      </div>
      <p className="text-editor-tip">
        Cliquez sur un texte ou un titre pour le modifier. Glissez-le pour le
        déplacer ; utilisez les poignées pour le tourner ou le supprimer. La
        touche Suppr fonctionne aussi hors des champs de saisie.
      </p>
      <div className="text-editor-list">
        {texts.map((text) => (
          <button
            type="button"
            key={text.id}
            className={selected?.id === text.id ? 'active' : ''}
            onClick={() => onSelect(text.id)}
          >
            {text.text || 'Nouveau texte'}
          </button>
        ))}
      </div>
      {selected && (
        <div className="text-editor-controls">
          <label className="text-editor-field">
            <span>Contenu</span>
            <textarea
              value={selected.text}
              onChange={(event) => onChange({ text: event.target.value })}
              rows={4}
              maxLength={2000}
              autoFocus
            />
          </label>
          <div className="text-editor-row">
            <label className="text-editor-field">
              <span>Police</span>
              <select
                value={
                  selected.fontFamily ??
                  (selected.variant === 'body' &&
                  !(visualStyle && selected.id.endsWith('-caption'))
                    ? 'DM Sans'
                    : 'Manrope')
                }
                onChange={(event) =>
                  onChange({
                    fontFamily: event.target.value as TextElement['fontFamily'],
                  })
                }
              >
                {fonts.map((font) => (
                  <option key={font}>{font}</option>
                ))}
              </select>
            </label>
            <label className="text-editor-field text-editor-size">
              <span>Taille (px)</span>
              <input
                type="number"
                min={10}
                max={240}
                value={selected.fontSize ?? defaultSize(selected, visualStyle)}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (value >= 10 && value <= 240) onChange({ fontSize: value })
                }}
              />
            </label>
          </div>
          <label className="text-editor-field">
            <span>Style</span>
            <select
              value={selected.effect ?? 'plain'}
              onChange={(event) =>
                onChange({
                  effect: event.target.value as TextElement['effect'],
                })
              }
            >
              <option value="plain">Simple</option>
              <option value="video">Titre vidéo avec contour</option>
              <option value="shadow">Ombre portée</option>
            </select>
          </label>
          <div className="text-editor-color-heading">Couleur du texte</div>
          <div className="text-editor-colors">
            <input
              aria-label="Choisir une couleur personnalisée"
              type="color"
              value={
                /^#[0-9a-f]{6}$/i.test(selected.color)
                  ? selected.color
                  : '#ffffff'
              }
              onChange={(event) =>
                onChange({ color: event.target.value, customColor: true })
              }
            />
            {colors.map((color) => (
              <button
                type="button"
                key={color}
                className={
                  selected.customColor && selected.color.toLowerCase() === color
                    ? 'active'
                    : ''
                }
                style={{ background: color }}
                aria-label={`Couleur ${color}`}
                onClick={() => onChange({ color, customColor: true })}
              />
            ))}
          </div>
          <label className="text-editor-field">
            <span>
              <RotateCw size={13} /> Rotation ({Math.round(selected.rotation)}°)
            </span>
            <input
              type="range"
              min={-180}
              max={180}
              value={selected.rotation}
              onChange={(event) =>
                onChange({ rotation: Number(event.target.value) })
              }
            />
          </label>
          <div className="text-editor-row">
            <label className="text-editor-field">
              <span>X dans l’étape</span>
              <input
                type="number"
                value={frame ? Math.round(selected.x - frame.x) : selected.x}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value))
                    onChange({ x: value + (frame?.x ?? 0) })
                }}
              />
            </label>
            <label className="text-editor-field">
              <span>Y dans l’étape</span>
              <input
                type="number"
                value={frame ? Math.round(selected.y - frame.y) : selected.y}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value))
                    onChange({ y: value + (frame?.y ?? 0) })
                }}
              />
            </label>
          </div>
          <label className="text-editor-field">
            <span>Largeur (px)</span>
            <input
              type="number"
              min={80}
              max={1200}
              value={selected.width}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (value >= 80 && value <= 1200) onChange({ width: value })
              }}
            />
          </label>
          <button
            type="button"
            className="text-editor-delete"
            onClick={onDelete}
          >
            <Trash2 size={15} /> Supprimer ce texte
          </button>
        </div>
      )}
    </aside>
  )
}
