import type { Frame, PresentationStyle } from '../../types/presentation'
import { circleStyleThemes, isCircleStyle } from '../../data/visualStyles'

interface Props {
  frames: Frame[]
  style: PresentationStyle
}

export function RouteOverlay({ frames, style }: Props) {
  if (!frames.length || style === 'story') return null
  if (
    [
      'chevrons',
      'medallions',
      'steps',
      'ribbons',
      'milestones',
      'spectrum',
    ].includes(style)
  )
    return <InfographicRoute frames={frames} style={style} />
  if (frames.length < 2) return null
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
  const circleTheme = isCircleStyle(style) ? circleStyleThemes[style] : null
  const orbitRadiusX = Math.max(...points.map((point) => Math.abs(point.x)))
  const orbitRadiusY = Math.max(...points.map((point) => Math.abs(point.y)))
  const innerRadiusX = Math.min(
    ...points.map((point) => Math.abs(point.x) || orbitRadiusX),
  )
  const innerRadiusY = Math.min(
    ...points.map((point) => Math.abs(point.y) || orbitRadiusY),
  )
  const gradientId = `route-gradient-${style}`
  const glowId = `route-glow-${style}`
  return (
    <svg
      className={`route-overlay route-${style}`}
      style={{ left, top, width: right - left, height: bottom - top }}
      viewBox={`0 0 ${right - left} ${bottom - top}`}
      aria-hidden="true"
    >
      <defs>
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
        {circleTheme && (
          <>
            <linearGradient id={gradientId} x1="0" x2="1">
              <stop stopColor={circleTheme.primary} />
              <stop offset="1" stopColor={circleTheme.secondary} />
            </linearGradient>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        )}
      </defs>
      {circleTheme ? (
        <>
          <ellipse
            cx={-left}
            cy={-top}
            rx={orbitRadiusX}
            ry={orbitRadiusY}
            fill={circleTheme.surface}
            fillOpacity=".1"
            stroke={circleTheme.glow}
            strokeWidth="38"
            strokeOpacity=".1"
            filter={`url(#${glowId})`}
          />
          <ellipse
            cx={-left}
            cy={-top}
            rx={orbitRadiusX}
            ry={orbitRadiusY}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="9"
            filter={`url(#${glowId})`}
          />
          {style === 'orbit-concentric' && (
            <ellipse
              cx={-left}
              cy={-top}
              rx={Math.max(innerRadiusX, orbitRadiusX * 0.58)}
              ry={Math.max(innerRadiusY, orbitRadiusY * 0.58)}
              fill="none"
              stroke={circleTheme.secondary}
              strokeWidth="7"
              strokeOpacity=".9"
              filter={`url(#${glowId})`}
            />
          )}
        </>
      ) : style === 'orbit' ? (
        <circle
          cx={-left}
          cy={-top}
          r={orbitRadiusX}
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

const infographicColors = [
  '#123b82',
  '#f20b68',
  '#2cc5df',
  '#ffbf18',
  '#102d68',
  '#13b7a3',
  '#fa7657',
  '#93bf4d',
]

function InfographicRoute({ frames, style }: Props) {
  const centers = frames.map((frame) => ({
    x: frame.x + frame.width / 2,
    y: frame.y + frame.height / 2,
  }))
  const left = Math.min(...frames.map((frame) => frame.x)) - 180
  const right = Math.max(...frames.map((frame) => frame.x + frame.width)) + 180
  const top = Math.min(-220, ...frames.map((frame) => frame.y - 160))
  const bottom = Math.max(
    220,
    ...frames.map((frame) => frame.y + frame.height + 160),
  )
  const width = right - left
  const height = bottom - top
  const first = centers[0]
  const last = centers.at(-1)!
  return (
    <svg
      className={`route-overlay route-infographic route-${style}`}
      style={{ left, top, width, height }}
      viewBox={`${left} ${top} ${width} ${height}`}
      aria-hidden="true"
    >
      {style === 'chevrons' &&
        centers.map(({ x }, index) => {
          const above = index % 2 === 0
          const color = infographicColors[index % infographicColors.length]
          return (
            <g key={index}>
              <path
                d={`M ${x - 262} -46 H ${x + 205} L ${x + 260} 0 L ${x + 205} 46 H ${x - 262} L ${x - 208} 0 Z`}
                fill={color}
                stroke="white"
                strokeWidth="8"
              />
              <line
                x1={x}
                y1={above ? -46 : 46}
                x2={x}
                y2={above ? -180 : 180}
                stroke={color}
                strokeWidth="5"
              />
              <circle cx={x} cy="0" r="19" fill="white" />
              <circle cx={x} cy="0" r="6" fill={color} />
              <text
                x={x}
                y={above ? -105 : 145}
                textAnchor="middle"
                fill={color}
                stroke="white"
                strokeWidth="5"
                paintOrder="stroke"
                fontSize="27"
                fontWeight="800"
              >
                {String(index + 1).padStart(2, '0')}
              </text>
            </g>
          )
        })}
      {style === 'medallions' && (
        <>
          <line
            x1={first.x - 210}
            x2={last.x + 210}
            y1="0"
            y2="0"
            stroke="#a9b9c4"
            strokeWidth="8"
          />
          {centers.map(({ x }, index) => {
            const above = index % 2 === 0
            const color = infographicColors[index % infographicColors.length]
            return (
              <g key={index}>
                <line
                  x1={x}
                  x2={x}
                  y1={above ? -52 : 52}
                  y2={above ? -180 : 180}
                  stroke={color}
                  strokeWidth="4"
                  strokeDasharray="10 10"
                />
                <circle cx={x} cy="0" r="60" fill={color} opacity=".18" />
                <circle cx={x} cy="0" r="49" fill={color} />
                <circle cx={x} cy="0" r="34" fill="#fff" />
                <text
                  x={x}
                  y="11"
                  textAnchor="middle"
                  fill={color}
                  fontSize="27"
                  fontWeight="800"
                >
                  {String(index + 1).padStart(2, '0')}
                </text>
              </g>
            )
          })}
        </>
      )}
      {style === 'steps' && (
        <>
          <line
            x1="0"
            x2="0"
            y1={first.y - 95}
            y2={last.y + 95}
            stroke="#b9c9d2"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {centers.map(({ y }, index) => {
            const leftSide = index % 2 === 0
            const color = infographicColors[index % infographicColors.length]
            return (
              <g key={index}>
                <path
                  d={`M 0 ${y} H ${leftSide ? -310 : 310}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <circle cx="0" cy={y} r="50" fill={color} opacity=".16" />
                <circle
                  cx="0"
                  cy={y}
                  r="34"
                  fill={color}
                  stroke="white"
                  strokeWidth="8"
                />
                <text
                  x="0"
                  y={y + 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize="23"
                  fontWeight="800"
                >
                  {index + 1}
                </text>
              </g>
            )
          })}
        </>
      )}
      {style === 'ribbons' &&
        centers.map(({ x }, index) => {
          const color = infographicColors[index % infographicColors.length]
          const offset = index % 2 ? 15 : -15
          return (
            <g key={index}>
              <path
                d={`M ${x - 255} ${-72 + offset} H ${x + 210} L ${x + 265} ${-28 + offset} L ${x + 210} ${16 + offset} H ${x - 255} L ${x - 210} ${-28 + offset} Z`}
                fill={color}
              />
              <line
                x1={x}
                x2={x}
                y1={16 + offset}
                y2="100"
                stroke={color}
                strokeWidth="4"
                strokeDasharray="9 9"
              />
              <text
                x={x}
                y={-18 + offset}
                textAnchor="middle"
                fill="white"
                fontSize="31"
                fontWeight="700"
              >
                {String(index + 1).padStart(2, '0')}
              </text>
            </g>
          )
        })}
      {style === 'milestones' && (
        <>
          <path
            d={`M ${first.x - 250} -14 H ${last.x + 225} V -34 L ${last.x + 275} 0 L ${last.x + 225} 34 V 14 H ${first.x - 250} Z`}
            fill="#c5d4dc"
            opacity=".75"
          />
          {centers.map(({ x }, index) => {
            const color = infographicColors[index % infographicColors.length]
            return (
              <g key={index}>
                <rect
                  x={x - 65}
                  y="-125"
                  width="130"
                  height="47"
                  rx="11"
                  fill={color}
                />
                <path
                  d={`M ${x - 10} -78 L ${x} -65 L ${x + 10} -78`}
                  fill={color}
                />
                <text
                  x={x}
                  y="-94"
                  textAnchor="middle"
                  fill="white"
                  fontSize="22"
                  fontWeight="800"
                >
                  {String(index + 1).padStart(2, '0')}
                </text>
                <circle
                  cx={x}
                  cy="0"
                  r="64"
                  fill="white"
                  stroke={color}
                  strokeWidth="13"
                />
                <circle cx={x} cy="0" r="25" fill={color} opacity=".2" />
                <circle cx={x} cy="0" r="9" fill={color} />
                <line
                  x1={x}
                  x2={x}
                  y1="64"
                  y2="100"
                  stroke={color}
                  strokeWidth="4"
                />
              </g>
            )
          })}
        </>
      )}
      {style === 'spectrum' && (
        <>
          {centers.map(({ x }, index) => {
            const color = infographicColors[index % infographicColors.length]
            const nextX = centers[index + 1]?.x ?? x + 250
            return (
              <g key={index}>
                <rect
                  x={index === 0 ? x - 250 : x}
                  y="-12"
                  width={nextX - (index === 0 ? x - 250 : x)}
                  height="24"
                  fill={color}
                />
                <circle
                  cx={x}
                  cy="0"
                  r="47"
                  fill="white"
                  stroke={color}
                  strokeWidth="15"
                />
                <circle cx={x} cy="0" r="18" fill={color} />
                <line
                  x1={x}
                  x2={x}
                  y1="47"
                  y2="100"
                  stroke={color}
                  strokeWidth="4"
                  strokeDasharray="8 8"
                />
                <text
                  x={x}
                  y="-75"
                  textAnchor="middle"
                  fill={color}
                  fontSize="26"
                  fontWeight="800"
                >
                  {String(index + 1).padStart(2, '0')}
                </text>
              </g>
            )
          })}
          <path
            d={`M ${last.x + 240} -30 L ${last.x + 295} 0 L ${last.x + 240} 30 Z`}
            fill={
              infographicColors[(frames.length - 1) % infographicColors.length]
            }
          />
        </>
      )}
    </svg>
  )
}
