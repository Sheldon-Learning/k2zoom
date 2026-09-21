import type { Frame, PresentationStyle } from '../../types/presentation'

interface Props {
  frames: Frame[]
  style: PresentationStyle
}

export function RouteOverlay({ frames, style }: Props) {
  if (frames.length < 2 || style === 'story') return null
  const points = frames.map((frame) => ({
    x: frame.x + frame.width / 2,
    y: frame.y + frame.height / 2,
  }))
  const left = Math.min(...points.map((point) => point.x)) - 160
  const top = Math.min(...points.map((point) => point.y)) - 160
  const right = Math.max(...points.map((point) => point.x)) + 160
  const bottom = Math.max(...points.map((point) => point.y)) + 160
  const local = points.map((point) => `${point.x - left},${point.y - top}`)
  const path = `M ${local.join(' L ')}`
  const orbitRadius =
    style === 'orbit' ? Math.hypot(points[0].x, points[0].y) : 0
  return (
    <svg
      className={`route-overlay route-${style}`}
      style={{ left, top, width: right - left, height: bottom - top }}
      viewBox={`0 0 ${right - left} ${bottom - top}`}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="route-pixels"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <rect x="1" y="1" width="3" height="3" rx=".5" fill="#7eaaa0" />
        </pattern>
        <marker
          id="route-arrow"
          markerWidth="13"
          markerHeight="13"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path
            d="M2 2 L10 6 L2 10"
            fill="none"
            stroke="#529a86"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      {style === 'grid' && (
        <rect
          width={right - left}
          height={bottom - top}
          fill="url(#route-pixels)"
          opacity=".35"
        />
      )}
      {style === 'orbit' ? (
        <circle
          cx={-left}
          cy={-top}
          r={orbitRadius}
          fill="none"
          stroke="#8aadc4"
          strokeWidth="6"
        />
      ) : (
        <path
          d={path}
          fill="none"
          stroke="#83b9a9"
          strokeWidth={style === 'timeline' ? 9 : 5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={style === 'grid' ? '12 14' : undefined}
          markerEnd="url(#route-arrow)"
        />
      )}
    </svg>
  )
}
