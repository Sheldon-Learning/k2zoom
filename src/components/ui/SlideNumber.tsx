import type { CSSProperties } from 'react'

interface Props {
  number: string
  title: string
  childCount: number
  onExplore?: () => void
  onDoubleClick?: () => void
  actionLabel?: string
  showAddIndicator?: boolean
  className?: string
  style?: CSSProperties
}

export function SlideNumber({
  number,
  title,
  childCount,
  onExplore,
  onDoubleClick,
  actionLabel,
  showAddIndicator,
  className,
  style,
}: Props) {
  return (
    <button
      type="button"
      className={`slide-number ${className ?? ''}`}
      style={style}
      disabled={!onExplore}
      onClick={(event) => {
        event.stopPropagation()
        onExplore?.()
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onDoubleClick?.()
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
      }}
      aria-label={
        actionLabel ??
        `Slide ${number}, ${title}${childCount ? `, contient ${childCount} sous-slides. Explorer cette section` : ''}`
      }
      title={
        actionLabel ??
        (childCount
          ? `${childCount} slide${childCount > 1 ? 's' : ''} supplémentaire${childCount > 1 ? 's' : ''}`
          : undefined)
      }
    >
      {number}
      {(childCount > 0 || showAddIndicator) && (
        <span aria-hidden="true" className="slide-number-indicator">
          +
        </span>
      )}
    </button>
  )
}
