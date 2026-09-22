import { Crop, ImagePlus, Move, Unlink, X } from 'lucide-react'
import type { ImageElement } from '../../types/presentation'

interface Props {
  image: ImageElement
  onChange: (changes: Partial<ImageElement>) => void
  onReplace: () => void
  onClose: () => void
}

export function ImageEditor({ image, onChange, onReplace, onClose }: Props) {
  const fitted = !!image.frameId && !!image.fit
  return (
    <aside className="image-editor" aria-label={`Modifier ${image.alt}`}>
      <div className="image-editor-heading">
        <div>
          <span>IMAGE</span>
          <strong>Recadrage direct</strong>
        </div>
        <button type="button" aria-label="Fermer" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="image-editor-preview">
        <img
          src={image.src}
          alt=""
          style={{
            objectFit: image.fit ?? 'cover',
            objectPosition: `${image.objectPositionX ?? 50}% ${image.objectPositionY ?? 50}%`,
            transform: `scale(${image.cropZoom ?? 1})`,
          }}
        />
        <span>
          <Crop size={14} /> Aperçu
        </span>
      </div>

      <div className="image-editor-modes">
        <button
          type="button"
          className={(image.fit ?? 'cover') === 'cover' ? 'active' : ''}
          onClick={() => onChange({ fit: 'cover' })}
        >
          Remplir
        </button>
        <button
          type="button"
          className={image.fit === 'contain' ? 'active' : ''}
          onClick={() => onChange({ fit: 'contain', cropZoom: 1 })}
        >
          Adapter
        </button>
      </div>

      <label>
        <span>
          <Move size={13} /> Position horizontale
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={image.objectPositionX ?? 50}
          onChange={(event) =>
            onChange({ objectPositionX: Number(event.target.value) })
          }
        />
      </label>
      <label>
        <span>
          <Move size={13} /> Position verticale
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={image.objectPositionY ?? 50}
          onChange={(event) =>
            onChange({ objectPositionY: Number(event.target.value) })
          }
        />
      </label>
      <label>
        <span>
          <Crop size={13} /> Zoom du cadrage
        </span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={image.cropZoom ?? 1}
          onChange={(event) =>
            onChange({ cropZoom: Number(event.target.value), fit: 'cover' })
          }
        />
      </label>

      <p>
        Vous pouvez aussi glisser directement l’image pour déplacer son cadrage.
      </p>
      <button
        type="button"
        className="image-editor-replace"
        onClick={onReplace}
      >
        <ImagePlus size={15} /> Remplacer l’image
      </button>
      {fitted && (
        <button
          type="button"
          className="image-editor-unlink"
          onClick={() => onChange({ frameId: undefined, fit: undefined })}
        >
          <Unlink size={14} /> Détacher du cadre
        </button>
      )}
    </aside>
  )
}
