import {
  INFO_BUBBLE_TYPE_RIGHT_BUILDING,
  INFO_BUBBLE_TYPE_LEFT_BUILDING,
  infoBubble
} from '../info_bubble/info_bubble'
import { getStreet, saveStreetToServerIfNecessary } from '../streets/data_model'
import { getElAbsolutePos } from '../util/helpers'
import { RandomGenerator } from '../util/random'
import { svgCache } from '../app/load_resources'
import { resumeFadeoutControls } from './resizing'
import { TILE_SIZE, TILESET_POINT_PER_PIXEL, drawSegmentImage, drawSegmentImageSVG } from './view'
import store from '../store'

const MAX_CANVAS_HEIGHT = 2048

const BUILDING_DESTINATION_SCREEN = 1
export const BUILDING_DESTINATION_THUMBNAIL = 2

export const BUILDING_SPACE = 360

export const DEFAULT_BUILDING_HEIGHT_LEFT = 4
export const DEFAULT_BUILDING_HEIGHT_RIGHT = 3
export const DEFAULT_BUILDING_VARIANT_LEFT = 'narrow'
export const DEFAULT_BUILDING_VARIANT_RIGHT = 'wide'
export const DEFAULT_BUILDING_HEIGHT_EMPTY = 1
export const DEFAULT_BUILDING_VARIANT_EMPTY = 'grass'

export const BUILDING_VARIANTS = ['waterfront', 'grass', 'fence', 'parking-lot',
  'residential', 'narrow', 'wide']
export const BUILDING_VARIANT_NAMES = ['Waterfront', 'Grass', 'Empty lot', 'Parking lot',
  'Home', 'Building', 'Building']

export const MAX_BUILDING_HEIGHT = 20

export function getBuildingAttributes (street, left) {
  let width, floorRoofWidth, variantsCount, tileset, floorHeight, roofHeight
  let mainFloorHeight, height, tilePositionX, tilePositionY
  var buildingVariant = left ? street.leftBuildingVariant : street.rightBuildingVariant
  var flooredBuilding = isFlooredBuilding(buildingVariant)

  // Non-directional

  switch (buildingVariant) {
    // Define sprite heights based on svg intrinsic value
    case 'waterfront': {
      const svg = svgCache.get('buildings--waterfront-left') // same for right
      height = svg.height / TILESET_POINT_PER_PIXEL
      break
    }
    case 'parking-lot': {
      const svg = svgCache.get('buildings--parking-lot-left') // same for right
      height = svg.height / TILESET_POINT_PER_PIXEL
      break
    }
    case 'fence': {
      // TODO: use intrinsic height, but we need to figure out what the offsetY and offsetTop numbers are first
      // const svg = svgCache.get('buildings--fenced-lot-left') // same for right
      // height = svg.height / TILESET_POINT_PER_PIXEL
      height = 12 * TILE_SIZE
      break
    }
    case 'grass': {
      // TODO: use intrinsic height, but we need to figure out what the offsetY and offsetTop numbers are first
      // const svg = svgCache.get('buildings--grass')
      // height = svg.height / TILESET_POINT_PER_PIXEL
      height = 6 * TILE_SIZE
      break
    }
    case 'narrow':
      width = 216
      floorRoofWidth = 216
      variantsCount = 1
      tileset = 2

      floorHeight = 10
      roofHeight = 2
      mainFloorHeight = 14
      break
    case 'wide':
      width = 396
      floorRoofWidth = 396
      variantsCount = 1
      tileset = 3

      floorHeight = 10
      roofHeight = 2
      mainFloorHeight = 14
      break
    case 'residential':
      width = 396
      floorRoofWidth = 240
      variantsCount = 0

      floorHeight = 10
      roofHeight = 6
      mainFloorHeight = 24.5
      break
  }
  // Directional

  if (left) {
    switch (buildingVariant) {
      case 'narrow':
        tilePositionX = 1512 + 17
        tilePositionY = 576 - 1
        break
      case 'wide':
        tilePositionX = 1956
        tilePositionY = 576 - (24 * 2)
        break
      case 'residential':
        tileset = 3
        tilePositionX = 1956 + 382 + 204
        tilePositionY = 576 + (740 / 2) - 1 - 12 + 8
        break
    }
  } else {
    switch (buildingVariant) {
      case 'narrow':
        tilePositionX = 1728 + 13
        tilePositionY = 576 - 1
        break
      case 'wide':
        tilePositionX = 2351
        tilePositionY = 576 - (24 * 2) - 1
        break
      case 'residential':
        tileset = 2
        tilePositionX = 1956 + 382 + 204 + 25 - 1008 - 12 - 1 + 48
        tilePositionY = 576 + (740 / 2) - 1 - 12 + 237 + 6
        break
    }
  }

  if (flooredBuilding) {
    var floorCount = left ? street.leftBuildingHeight : street.rightBuildingHeight
    height = ((roofHeight + (floorHeight * (floorCount - 1)) + mainFloorHeight) * TILE_SIZE) + 45
    var realHeight = height - 45 - 6
  }

  return {
    tilePositionX: tilePositionX,
    tilePositionY: tilePositionY,
    width: width,
    variantsCount: variantsCount,
    tileset: tileset,
    mainFloorHeight: mainFloorHeight,
    floorHeight: floorHeight,
    flooredBuilding: flooredBuilding,
    floorRoofWidth: floorRoofWidth,
    floorCount: floorCount,
    realHeight: realHeight,
    roofHeight: roofHeight,
    height: height,
    buildingVariant: buildingVariant
  }
}

/**
 * Returns true if the building type editable number of floors
 *
 * @param {string} buildingVariant
 * @param {Boolean}
 */
// TODO change to array
export function isFlooredBuilding (buildingVariant) {
  if ((buildingVariant === 'narrow') || (buildingVariant === 'wide') ||
    (buildingVariant === 'residential')) {
    return true
  } else {
    return false
  }
}

export function drawBuilding (ctx, destination, street, left, totalWidth,
  totalHeight, bottomAligned, offsetLeft, offsetTop,
  multiplier) {
  const attr = getBuildingAttributes(street, left)

  if (bottomAligned) {
    offsetTop += totalHeight - (attr.height * multiplier)
  }

  if (!attr.flooredBuilding) {
    drawSingleFloorBuilding(attr.buildingVariant, ctx, left, totalWidth, offsetLeft, offsetTop, multiplier)
  } else {
    // Floored buildings
    const leftPos = (left) ? totalWidth - attr.width - 2 : 0

    offsetTop -= 45

    // bottom floor
    drawSegmentImage(attr.tileset, ctx,
      attr.tilePositionX,
      attr.tilePositionY - 240 + (120 * attr.variantsCount),
      attr.width,
      (attr.mainFloorHeight * TILE_SIZE) + TILE_SIZE,
      offsetLeft + (leftPos * multiplier),
      offsetTop + ((attr.height - (attr.mainFloorHeight * TILE_SIZE)) * multiplier),
      attr.width * multiplier,
      ((attr.mainFloorHeight * TILE_SIZE) + TILE_SIZE) * multiplier)

    // middle floors
    const floorCorrection = left ? 0 : (attr.width - attr.floorRoofWidth)

    const randomGenerator = new RandomGenerator()
    randomGenerator.seed = 0

    for (let i = 1; i < attr.floorCount; i++) {
      const variant = (attr.variantsCount === 0) ? 0 : Math.floor(randomGenerator.rand() * attr.variantsCount) + 1

      drawSegmentImage(attr.tileset, ctx,
        attr.tilePositionX + floorCorrection,
        attr.tilePositionY - 240 + (120 * attr.variantsCount) - (attr.floorHeight * TILE_SIZE * variant),
        attr.floorRoofWidth,
        attr.floorHeight * TILE_SIZE,
        offsetLeft + ((leftPos + floorCorrection) * multiplier),
        offsetTop + (attr.height * multiplier) - ((attr.mainFloorHeight + (attr.floorHeight * i)) * TILE_SIZE * multiplier),
        attr.floorRoofWidth * multiplier,
        attr.floorHeight * TILE_SIZE * multiplier)
    }

    // roof
    drawSegmentImage(attr.tileset, ctx,
      attr.tilePositionX + floorCorrection,
      attr.tilePositionY - 240 + (120 * attr.variantsCount) - ((attr.floorHeight * TILE_SIZE * attr.variantsCount) + (attr.roofHeight * TILE_SIZE)),
      attr.floorRoofWidth,
      attr.roofHeight * TILE_SIZE,
      offsetLeft + ((leftPos + floorCorrection) * multiplier),
      offsetTop + (attr.height * multiplier) - ((attr.mainFloorHeight + (attr.floorHeight * (attr.floorCount - 1)) + attr.roofHeight) * TILE_SIZE * multiplier),
      attr.floorRoofWidth * multiplier,
      attr.roofHeight * TILE_SIZE * multiplier)
  }

  // If street width is exceeded, fade buildings
  if ((street.remainingWidth < 0) && (destination === BUILDING_DESTINATION_SCREEN)) {
    shadeInContext(ctx)
  }
}

/**
 * Fills the building rendered area with a color
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function shadeInContext (ctx) {
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  // TODO const
  ctx.fillStyle = 'rgba(204, 163, 173, .9)'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

function drawSingleFloorBuilding (buildingVariant, ctx, left, totalWidth, offsetLeft, offsetTop, multiplier) {
  // posShift = a building sprite can overlap the sidewalk by a certain amount. a posShift
  // value of 25 is NO overlap. a posShift value of 0 is 25 pixels of overlap.
  let x, posShift, width, offsetY, lastX, firstX, currentX, spriteId

  switch (buildingVariant) {
    case 'fence': {
      spriteId = (left) ? 'buildings--fenced-lot-left' : 'buildings--fenced-lot-right'

      const svg = svgCache.get(spriteId)
      width = svg.width / TILESET_POINT_PER_PIXEL

      offsetY = 23 + 24 + 2 // todo: document magic number
      offsetTop -= 45 // todo: document magic number

      if (left) {
        posShift = (totalWidth % width) - (width + width + 25)
      } else {
        posShift = 25
      }
      break
    }
    case 'grass': {
      spriteId = 'buildings--grass'

      const svg = svgCache.get(spriteId)
      width = svg.width / TILESET_POINT_PER_PIXEL

      offsetY = 23 + 24 + 2 // todo: document magic number
      offsetTop -= 45 // todo: document magic number

      if (left) {
        posShift = (totalWidth % width) - (width + width + 25)
      } else {
        posShift = 25
      }
      break
    }
    case 'parking-lot': {
      offsetY = 0
      offsetTop -= 45 // todo: document magic number

      spriteId = (left) ? 'buildings--parking-lot-left' : 'buildings--parking-lot-right'

      const svg = svgCache.get(spriteId)
      width = svg.width / TILESET_POINT_PER_PIXEL / 2 // 2 = halfway point is where repeat starts.

      if (left) {
        posShift = (totalWidth % width) - (width + width + 25) // do not overhang right edge

        x = 0 // repeat the left half of this sprite
        lastX = svg.width / 2 // anchor the right half of this sprite
      } else {
        posShift = 25 // do not overhang left edge

        x = svg.width / 2 // repeat the right half of this sprite
        firstX = 0 // anchor the left half of this sprite
      }
      break
    }
    case 'waterfront': {
      offsetY = 0
      offsetTop -= 0

      spriteId = (left) ? 'buildings--waterfront-left' : 'buildings--waterfront-right'

      const svg = svgCache.get(spriteId)
      width = svg.width / TILESET_POINT_PER_PIXEL / 2 // 2 = halfway point is where repeat starts.

      if (left) {
        posShift = (totalWidth % width) - (width + width + 25) // do not overhang right edge

        x = 0 // repeat the left half of this sprite
        lastX = svg.width / 2 // anchor the right half of this sprite
      } else {
        posShift = 25 // do not overhang left edge

        x = svg.width / 2 // repeat the right half of this sprite
        firstX = 0 // anchor the left half of this sprite
      }
      break
    }
  }

  const count = Math.floor(totalWidth / width) + 2

  for (let i = 0; i < count; i++) {
    if ((i === 0) && (typeof firstX !== 'undefined')) {
      currentX = firstX
    } else if ((i === count - 1) && (typeof lastX !== 'undefined')) {
      currentX = lastX
    } else {
      currentX = x
    }

    drawSegmentImageSVG(spriteId, ctx,
      currentX, null,
      width, null,
      offsetLeft + ((posShift + (i * width)) * multiplier),
      offsetTop + (offsetY * multiplier),
      width, null, multiplier)
  }
}

function createBuilding (el, left) {
  var street = getStreet()
  var totalWidth = el.offsetWidth
  var attr = getBuildingAttributes(street, left)
  var height = Math.min(MAX_CANVAS_HEIGHT, attr.height)
  var canvasEl = document.createElement('canvas')
  var oldCanvasEl = el.querySelector('canvas')
  const dpi = store.getState().system.hiDpi

  canvasEl.width = totalWidth * dpi
  canvasEl.height = height * dpi
  canvasEl.style.width = totalWidth + 'px'
  canvasEl.style.height = height + 'px'

  // Replace previous canvas if present, otherwise append a new one
  if (oldCanvasEl) {
    el.replaceChild(canvasEl, oldCanvasEl)
  } else {
    el.appendChild(canvasEl)
  }

  var ctx = canvasEl.getContext('2d')
  drawBuilding(ctx, BUILDING_DESTINATION_SCREEN, street, left,
    totalWidth, height, true, 0, 0, 1.0)
}

export function buildingHeightUpdated () {
  saveStreetToServerIfNecessary()
  createBuildings()
}

// transition: when state changes, update legacy street object.
// todo: remove when no longer needed
export function initBuildingReduxTransitionSubscriber () {
  let oldLeftBuildingHeight
  let oldRightBuildingHeight
  store.subscribe(() => {
    const state = store.getState().street
    const street = getStreet()
    let changed = false
    if (state.leftBuildingHeight !== oldLeftBuildingHeight) {
      street.leftBuildingHeight = state.leftBuildingHeight
      oldLeftBuildingHeight = state.leftBuildingHeight
      changed = true
    }
    if (state.rightBuildingHeight !== oldRightBuildingHeight) {
      street.rightBuildingHeight = state.rightBuildingHeight
      oldRightBuildingHeight = state.rightBuildingHeight
      changed = true
    }
    if (changed) {
      buildingHeightUpdated()
    }
  })
}

export function createBuildings () {
  var leftEl = document.querySelector('#street-section-left-building')
  var rightEl = document.querySelector('#street-section-right-building')

  createBuilding(leftEl, true)
  createBuilding(rightEl, false)
}

export function onBuildingMouseEnter (event) {
  let type
  if (this.id === 'street-section-left-building') {
    type = INFO_BUBBLE_TYPE_LEFT_BUILDING
  } else {
    type = INFO_BUBBLE_TYPE_RIGHT_BUILDING
  }

  infoBubble.considerShowing(event, this, type)
  resumeFadeoutControls()
}

export function onBuildingMouseLeave (event) {
  if (event.pointerType !== 'mouse') return

  infoBubble.dontConsiderShowing()
}

export function updateBuildingPosition () {
  var el = document.querySelector('#street-section-editable')
  var pos = getElAbsolutePos(el)

  var width = pos[0] + 25

  if (width < 0) {
    width = 0
  }

  document.querySelector('#street-section-left-building').style.width = width + 'px'
  document.querySelector('#street-section-right-building').style.width = width + 'px'

  document.querySelector('#street-section-left-building').style.left = (-width + 25) + 'px'
  document.querySelector('#street-section-right-building').style.right = (-width + 25) + 'px'

  document.querySelector('#street-section-dirt').style.marginLeft = -width + 'px'
  document.querySelector('#street-section-dirt').style.marginRight = -width + 'px'
}
