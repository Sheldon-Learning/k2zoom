export interface Camera {
  x: number
  y: number
  zoom: number
  rotation: number
}

export interface Frame {
  id: string
  name: string
  parentId?: string
  children?: string[]
  hiddenFromMainPath?: boolean
  numberVisible?: boolean
  numberPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  numberScale?: number
  numberColor?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  cameraZoom: number
  duration: number
  accent: string
  pageStyle?: 'paper' | 'aurora' | 'midnight' | 'sand'
  subPresentationStyle?: 'paper' | 'aurora' | 'midnight' | 'sand'
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
  frameId?: string
  text: string
  variant: 'eyebrow' | 'heading' | 'body' | 'stat'
  color: string
  fontFamily?:
    | 'Manrope'
    | 'DM Sans'
    | 'Georgia'
    | 'Arial'
    | 'Courier New'
    | 'Impact'
    | 'Arial Black'
  fontSize?: number
  effect?: 'plain' | 'video' | 'shadow'
  customColor?: boolean
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: 'circle' | 'rect'
  fill: string
}

export interface ImageElement extends BaseElement {
  type: 'image'
  frameId?: string
  src: string
  alt: string
  fit?: 'cover' | 'contain'
  objectPositionX?: number
  objectPositionY?: number
  cropZoom?: number
}

export interface VideoElement extends BaseElement {
  type: 'video'
  frameId?: string
  videoId: string
  title: string
}

export type CanvasElement =
  TextElement | ShapeElement | ImageElement | VideoElement

export type PresentationStyle =
  | 'story'
  | 'timeline'
  | 'orbit'
  | 'orbit-eclipse'
  | 'orbit-amber'
  | 'orbit-azure'
  | 'orbit-pearl'
  | 'orbit-duo'
  | 'orbit-concentric'
  | 'orbit-plasma'
  | 'orbit-mint'
  | 'orbit-scarlet'
  | 'grid'
  | 'spiral'
  | 'zigzag'
  | 'chevrons'
  | 'medallions'
  | 'steps'
  | 'ribbons'
  | 'milestones'
  | 'spectrum'

export interface Presentation {
  version: 1
  title: string
  elements: CanvasElement[]
  frames: Frame[]
  path: string[]
  style?: PresentationStyle
  frameShape?: 'rectangle' | 'circle'
}
