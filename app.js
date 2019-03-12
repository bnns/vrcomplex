import * as d3 from 'd3'
import {
  complex
} from './expansion'

const debugMode = false
const maxDim = 2
const eta = 80
const height = 600
const width = 600
const numPoints = 72
const pointWidth = 3
const duration = 7000
const circleRadius = (Math.min(width, height) / 4) - (10 * pointWidth)
const ease = d3.easeCubic
const colorScale = d3.interpolateMagma
const points = createPoints(numPoints, pointWidth, width, height)

const coalesceEvery = 2
let animationSteps = 0

const style = {
  edge: {
    color: d3.color('#444444')
  },
  point: {
    color: d3.color('#444444')
  },
  text: {
    color: d3.color('black'),
    left: 50,
    padding: 50,
    bottom: 25
  }
}

function dimColor(dim) {
  return d3.lab(colorScale(dim / maxDim))
}

function dimOpacity(dim) {
  return 1 - (dim / maxDim)
}

function coalesce(points) {
  const shells = Math.round(d3.randomUniform(1, 9)())
  const pointsPerShell = Math.round(points.length / shells)
  const currentShell = d3.scaleLinear()
        .domain([0, points.length])
        .range([1, shells + 1])
  const thetaOffset = d3.scaleLinear()
        .domain([1, shells])
        .range([0, -90])
  const radius = (i) => Math.round(circleRadius * currentShell(i) / shells)
  const theta = (i) => thetaOffset(currentShell(i)) + (i % pointsPerShell) * (360 / pointsPerShell)
  return points.map((point, i) => {
    const {x, y} = polarCartesian(radius(i), theta(i))
    return Object.assign({}, point, {
      tx: x + width / 2,
      ty: y + height / 2,
      sx: point.x,
      sy: point.y
    })
  })
}

function randomLayout(points) {
  return points.map((point) => Object.assign({}, point, {
    tx: Math.random() * (width - pointWidth),
    ty: Math.random() * (height - pointWidth),
    sx: point.x,
    sy: point.y
  }))
}

function assignBoundary(points) {
  return animationSteps % coalesceEvery ?
    coalesce(points) :
    randomLayout(points)
}

function polarCartesian(r, theta) {
  return {x: r * Math.cos(theta), y: r * Math.sin(theta) }
}

function interpolate(points, t) {
  return points.map((point) => Object.assign({}, point, {
    x: point.sx * (1 - t) + point.tx * t,
    y: point.sy * (1 - t) + point.ty * t
  }))
}

function createPoints(numPoints, pointWidth, width, height) {
  return d3
    .range(numPoints)
    .map(id => ({
      id,
      x: Math.random() * (width - pointWidth),
      y: Math.random() * (height - pointWidth)
    }))
}

function drawPoints(ctx, points) {
  ctx.fillStyle = style.point.color

  points.forEach((p) => {
    const {
      x,
      y,
    } = p
    ctx.beginPath()
    ctx.arc(x, y, pointWidth, 0, 2 * Math.PI, true)
    ctx.fill()
    ctx.closePath()
  })
}

function drawEdges(ctx, edges) {
  ctx.strokeStyle = style.edge.color

  edges.forEach(([pa, pb]) => {
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
  })
}

function drawKFaces(ctx, faces, dim) {
  const color = dimColor(dim)
  color.opacity = dimOpacity(dim)
  ctx.fillStyle = color

  faces.forEach(([{
    x,
    y
  }, ...vertices]) => {
    ctx.beginPath()
    ctx.moveTo(x, y)
    vertices.forEach((v) => {
      ctx.lineTo(v.x, v.y)
    })
    ctx.fill()
  })
}

function drawSimplices(ctx, simplices = [], k) {
  switch (k) {
    case 0:
      drawPoints(ctx, simplices)
      break
    case 1:
      drawEdges(ctx, simplices)
      break
    default:
      drawKFaces(ctx, simplices, k)
  }

  ctx.restore()
}

function drawMetadata(ctx, numDims, etaValue) {
  const {
    left,
    bottom,
    padding
  } = style.text
  ctx.fillStyle = style.text.color
  ctx.font = '14px serif'
  ctx.fillText(`max k: ${numDims}`, left, height - 2 * bottom)
  ctx.fillText(`δ: ${etaValue}`, left, height - 3 * bottom)
  ctx.restore()
}

function drawText(ctx, simplices = [], k) {
  const {
    left,
    bottom,
    padding
  } = style.text
  ctx.fillStyle = style.text.color
  ctx.font = '14px serif'
  ctx.fillText(simplices.length, left + k * padding, height - bottom)
  ctx.restore()
}

function animate(points) {
  animationSteps++;
  const pointsWithBoundary = assignBoundary(points)

  const ctx = canvas.node().getContext('2d')
  ctx.save()

  const timer = d3.timer((elapsed) => {
    const t = Math.min(1, ease(elapsed / duration))
    const newPoints = interpolate(pointsWithBoundary, t)
    const vrComplex = complex(newPoints, maxDim, eta)

    ctx.clearRect(0, 0, width, height)

    d3.range(maxDim).forEach((dim) => {
      drawSimplices(ctx, vrComplex[`${dim}-simplices`], dim)
      debugMode && drawText(ctx, vrComplex[`${dim}-simplices`], dim)
    })

    debugMode && drawMetadata(ctx, maxDim, eta)

    if (t === 1) {
      timer.stop()
      animate(newPoints)
    }
  })
}

const screenScale = window.devicePixelRatio || 1
const canvas = d3.select('body').append('canvas')
  .attr('width', width * screenScale)
  .attr('height', height * screenScale)
  .style('width', `${width}px`)
  .style('height', `${height}px`)

const ctx = canvas.node().getContext('2d').scale(screenScale, screenScale)

animate(points)

if (module.hot) {
  module.hot.dispose(() => {
    window.location.reload()
  })
}
