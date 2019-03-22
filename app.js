import * as d3 from 'd3'
import {
  complex
} from './expansion'
import './perf'

const debugMode = false
const maxDim = 3
const height = 500
const width = 500
const numPoints = 53
const pointWidth = 3
const duration = 10000
const minShells = 3
const maxShells = 9
const circleRadius = (Math.min(width, height) / 4) - (10 * pointWidth)
const eta = Math.round(.33 * circleRadius)
const ease = d3.easeCubic
const colorScale = d3.interpolateMagma
const points = createPoints(numPoints, pointWidth, width, height)

const rotateEvery = 2
const randomEvery = 10
let animationSteps = 0

const style = {
  background: {
    color: d3.color('#444444')
  },
  edge: {
    color: d3.color('white')
  },
  point: {
    color: d3.color('white')
  },
  text: {
    color: d3.color('white'),
    left: 50,
    padding: 50,
    bottom: 25
  }
}

function log(arg) {
  console.log(arg)
  return arg
}

function dimColor(dim) {
  return d3.lab(colorScale(dim / maxDim))
}

function dimOpacity(dim) {
  return 1 - (dim / maxDim)
}

const thetaDelta = (r) => {
  return d3.scaleLinear()
    .domain([0, width / 2])
    .range([-10, 10])(r)
}

function rotate(points) {
  return points.map((point, i) => {
    return Object.assign({}, point, {
      sr: point.r,
      st: point.t,
      tr: point.r,
      tt: point.t + thetaDelta(point.r),
      mode: 'polar'
    })
  })
}

function coalesce(points) {
  const thetaDelta = Math.round(d3.randomUniform(30, 90)())
  const shells = Math.round(d3.randomUniform(minShells, maxShells)())
  const pointsPerShell = Math.round(points.length / shells)
  const currentShell = d3.scaleLinear()
    .domain([0, points.length])
    .range([minShells, shells + 1])
  const thetaOffset = d3.scaleLinear()
    .domain([minShells, shells])
    .range([0, thetaDelta])
  const radius = (i) => d3.scaleLinear()
        .domain([minShells, shells + 1])
        .range([eta, circleRadius])(currentShell(i))
  const theta = (i) => thetaOffset(currentShell(i)) + (i % pointsPerShell) * (360 / pointsPerShell)
  return points.map((point, i) => {
    const r = radius(i)
    const t = theta(i)
    const {
      x,
      y
    } = polarCartesian(r, t)
    return Object.assign({}, point, {
      tx: x + width / 2,
      ty: y + height / 2,
      sx: point.x,
      sy: point.y,
      r,
      t,
      mode: 'cartesian'
    })
  })
}

function randomLayout(points) {
  return points.map((point) => Object.assign({}, point, {
    tx: Math.random() * (width - pointWidth),
    ty: Math.random() * (height - pointWidth),
    sx: point.x,
    sy: point.y,
    mode: 'cartesian'
  }))
}

function assignBoundary(points) {
  if (animationSteps % randomEvery === 0) {
    return randomLayout(points)
  } else if (animationSteps % rotateEvery === 0) {
    return rotate(points)
  }

  return coalesce(points)
}

function polarCartesian(r, theta) {
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta)
  }
}

const interpCartesian = (point, t) =>
  Object.assign({}, point, {
    x: d3.interpolate(point.sx, point.tx)(t),
    y: d3.interpolate(point.sy, point.ty)(t)
  })

const interpPolar = (point, t) => {
  const {
    x,
    y
  } = polarCartesian(point.tr, d3.interpolate(point.st, point.tt)(t))
  return Object.assign({}, point, {
    x: x + width / 2,
    y: y + height / 2
  })
}

function interpolate(points, t) {
  return points.map(({
    mode,
    ...point
  }) => mode === 'polar' ? interpPolar(point, t) : interpCartesian(point, t))
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

function writeParams() {
  document.getElementById('eta').innerText = eta
  document.getElementById('max-k').innerText = maxDim - 1
  document.getElementById('simplices').innerText = [...Array(maxDim).keys()].map(x => 0).join(', ')
}

function updateWrittenParams(complex) {
  const [v, e, f] = Object.keys(complex).map(key => complex[key].length || 0)
  isNaN(v - e + f) && console.log(v, e, f)
  document.getElementById('simplices').innerText = [v, e, f].join(', ')
  document.getElementById('euler').innerText = v - e + f
}

function animate(points) {
  animationSteps++;
  const pointsWithBoundary = assignBoundary(points)

  const ctx = canvas.node().getContext('2d')
  ctx.save()

  const timer = d3.timer((elapsed) => {
    const t = Math.min(1, ease(elapsed / duration))
    const newPoints = interpolate(pointsWithBoundary, t)
    const vrComplex = complex(newPoints, maxDim, eta, false)

    ctx.clearRect(0, 0, width, height)

    d3.range(maxDim).forEach((dim) => {
      drawSimplices(ctx, vrComplex[`${dim}-simplices`], dim)
      debugMode && drawText(ctx, vrComplex[`${dim}-simplices`], dim)
    })

    updateWrittenParams(vrComplex)

    debugMode && drawMetadata(ctx, maxDim, eta)

    if (t === 1) {
      timer.stop()
      animate(newPoints)
    }
  })
}

const screenScale = window.devicePixelRatio || 1
const canvas = d3.select('#frame')
  .append('canvas')
  .attr('width', width * screenScale)
  .attr('height', height * screenScale)
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .style('background-color', style.background.color)

const ctx = canvas.node().getContext('2d').scale(screenScale, screenScale)

animate(points)
writeParams()

if (module.hot) {
  module.hot.dispose(() => {
    window.location.reload()
  })
}
