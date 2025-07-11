import React, { useRef, useEffect } from 'react'

import { useSelector } from '~/src/store/hooks'
import { TILE_SIZE } from './constants'
import './TestSlope.css'

import type { Segment } from '@streetmix/types'

interface Props {
  slice: Segment
}

const CANVAS_HEIGHT = 500
const CANVAS_GROUND = 35

function TestSlope ({ slice }: Props): React.ReactNode | null {
  const street = useSelector((state) => state.street)
  const dpi = useSelector((state) => state.system.devicePixelRatio)
  const canvasEl = useRef<HTMLCanvasElement>(null)

  // Get elevation of neighboring items
  const sliceIndex = street.segments.findIndex((s) => s.id === slice.id)
  const leftElevation = street.segments[sliceIndex - 1]?.elevation ?? 0
  const rightElevation = street.segments[sliceIndex + 1]?.elevation ?? 0

  useEffect(() => {
    if (!canvasEl.current) return
    drawSegment(canvasEl.current)

    // Only redraw on certain specific prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    slice.variantString,
    slice.width,
    slice.elevation,
    slice.slope,
    leftElevation,
    rightElevation
  ])

  function estimateCoord (elev: number, scale: number): number {
    // TODO: Define magic numbers 80 and 7
    return (80 - CANVAS_GROUND + elev * 7) * scale
  }

  // const groundLevelOffset = slice.elevation * 18
  // This is estimating the calculation for ground level which I still don't understand yet.
  // const groundLevel = estimateCoord(slice.elevation)
  const groundLevel = estimateCoord(
    Math.min(leftElevation, rightElevation),
    dpi
  )

  function drawSegment (canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // These rectangles are telling us that we're drawing at the right places.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    // Start at the bottom left corner and use a negative number to draw upwards
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    ctx.fillRect(0, canvas.height, canvas.width, groundLevel * -1)
    ctx.strokeRect(0, canvas.height, canvas.width, groundLevel * -1)

    // Draw a slope
    ctx.beginPath()
    ctx.moveTo(0, canvas.height - estimateCoord(leftElevation, dpi))
    ctx.lineTo(0, canvas.height - groundLevel)
    ctx.lineTo(canvas.width, canvas.height - estimateCoord(rightElevation, dpi))
    ctx.fill()
    ctx.stroke()
  }

  if (slice.slope !== true) return null

  // Determine dimensions to draw DOM element
  const elementWidth = slice.width * TILE_SIZE
  const elementHeight = CANVAS_HEIGHT

  // Determine size of canvas
  const canvasWidth = Math.round(elementWidth * dpi)
  const canvasHeight = elementHeight * dpi
  const canvasStyle = {
    width: Math.round(elementWidth),
    height: elementHeight
  }

  // Get slope
  const leftpx = estimateCoord(leftElevation, dpi)
  const rightpx = estimateCoord(rightElevation, dpi)
  const rise = Math.abs(leftpx - rightpx)
  const slope = Math.floor((rise / elementWidth) * 100)

  return (
    <div className="test-slope-container">
      <div className="slope-debug">{slope} %</div>
      <canvas
        ref={canvasEl}
        width={canvasWidth}
        height={canvasHeight}
        style={canvasStyle}
      />
    </div>
  )
}

export default TestSlope
