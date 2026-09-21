import { describe, expect, it } from 'vitest'
import {
  cameraForFrame,
  panCamera,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from './camera'
import { interpolateCamera } from './transitions'

const viewport = { width: 1000, height: 700 }
const camera = { x: 100, y: -50, zoom: 1.7, rotation: 23 }

describe('camera geometry', () => {
  it('round trips coordinates with rotation', () => {
    const point = { x: -321, y: 267 }
    const actual = screenToWorld(
      worldToScreen(point, camera, viewport),
      camera,
      viewport,
    )
    expect(actual.x).toBeCloseTo(point.x)
    expect(actual.y).toBeCloseTo(point.y)
  })
  it('keeps the world point under the cursor when zooming', () => {
    const cursor = { x: 239, y: 471 }
    const before = screenToWorld(cursor, camera, viewport)
    const after = screenToWorld(
      cursor,
      zoomAt(camera, 1.8, cursor, viewport),
      viewport,
    )
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })
  it('pans in screen coordinates despite camera rotation', () => {
    const point = { x: 0, y: 0 }
    const before = worldToScreen(point, camera, viewport)
    const after = worldToScreen(
      point,
      panCamera(camera, { x: 40, y: -20 }),
      viewport,
    )
    expect(after.x - before.x).toBeCloseTo(40)
    expect(after.y - before.y).toBeCloseTo(-20)
  })
  it('centers a frame', () => {
    const frame = {
      id: 'a',
      name: 'A',
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      rotation: 3,
      cameraZoom: 1,
      duration: 500,
      accent: '#fff',
    }
    const position = cameraForFrame(frame, viewport)
    expect(worldToScreen({ x: 110, y: 70 }, position, viewport)).toEqual({
      x: 500,
      y: 350,
    })
  })
})

describe('transitions', () => {
  it('interpolates camera and zoom continuously', () => {
    const end = { x: 500, y: 300, zoom: 4, rotation: 10 }
    expect(interpolateCamera(camera, end, 0)).toEqual(camera)
    expect(interpolateCamera(camera, end, 1)).toEqual(end)
    expect(interpolateCamera(camera, end, 0.5).zoom).toBeCloseTo(
      Math.sqrt(camera.zoom * end.zoom),
    )
  })
})
