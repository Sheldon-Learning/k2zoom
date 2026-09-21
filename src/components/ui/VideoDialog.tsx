import { useState, type FormEvent } from 'react'
import { Play, X } from 'lucide-react'
import { extractYouTubeId } from '../../utils/youtube'

interface Props {
  onAdd: (videoId: string, caption: string) => void
  onClose: () => void
}

export function VideoDialog({ onAdd, onClose }: Props) {
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      setError('Collez un lien valide vers une vidéo YouTube.')
      return
    }
    onAdd(videoId, caption.trim() || 'Vidéo YouTube')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="video-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-dialog-title"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          aria-label="Fermer"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <span className="video-dialog-icon">
          <Play size={21} fill="currentColor" />
        </span>
        <h2 id="video-dialog-title">Ajouter une vidéo YouTube</h2>
        <p>
          La vidéo rejoint votre parcours. Elle se lit directement sur le canvas
          quand vous appuyez sur Lire.
        </p>
        <label htmlFor="youtube-link">Lien YouTube</label>
        <input
          id="youtube-link"
          type="url"
          autoFocus
          required
          placeholder="https://www.youtube.com/watch?v=…"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value)
            setError('')
          }}
        />
        <label htmlFor="youtube-caption">Titre de l’étape</label>
        <input
          id="youtube-caption"
          type="text"
          maxLength={90}
          placeholder="Ma vidéo"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        {error && (
          <div className="video-dialog-error" role="alert">
            {error}
          </div>
        )}
        <div className="video-dialog-footer">
          <span>Le lecteur se charge uniquement au clic.</span>
          <button className="button button-primary" type="submit">
            Ajouter la vidéo
          </button>
        </div>
      </form>
    </div>
  )
}
