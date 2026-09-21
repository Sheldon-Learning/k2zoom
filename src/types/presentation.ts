export interface Camera {
  x: number
  y: number
  zoom: number
  rotation: number
}

export interface Frame {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  cameraZoom: number
  duration: number
  accent: string
}

interface BaseElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  variant: 'eyebrow' | 'heading' | 'body' | 'stat'
  color: string
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: 'circle' | 'rect'
  fill: string
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  alt: string
}

export type CanvasElement = TextElement | ShapeElement | ImageElement

export type PresentationStyle =
  'story' | 'timeline' | 'orbit' | 'grid' | 'spiral' | 'zigzag'

export interface Presentation {
  version: 1
  title: string
  elements: CanvasElement[]
  frames: Frame[]
  path: string[]
  style?: PresentationStyle
}
