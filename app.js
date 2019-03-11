import * as d3 from 'd3'
import {
  complex
} from './expansion'

const maxDim = 6
const eta = 50
const height = 600
const width = 600
const numPoints = 120
const pointWidth = 3
const duration = 5000;
const ease = d3.easeCubic;
const colorScale = d3.interpolateGreys;
const points = createPoints(numPoints, pointWidth, width, height)
const style = {
  edge: {
    color: '#444444'
  },
  point: {
    color: '#a9553a'
  },
  text: {
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

function randomLayout(points) {
  return points.map((point) => Object.assign({}, point, {
    tx: Math.random() * (width - pointWidth),
    ty: Math.random() * (height - pointWidth),
  }));
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
  ctx.fillStyle = style.point.color;

  points.forEach((p) => {
    const {
      x,
      y,
    } = p;
    ctx.beginPath()
    ctx.arc(x, y, pointWidth, 0, 2 * Math.PI, true)
    ctx.fill()
    ctx.closePath()
  })

  ctx.restore();
}

function drawEdges(ctx, edges) {
  ctx.strokeStyle = style.edge.color

  edges.forEach(([pa, pb]) => {
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
  })

  ctx.restore();
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
    ctx.moveTo(x, y);
    vertices.forEach((v) => {
      ctx.lineTo(v.x, v.y);
    })
    ctx.fill();
  })

  ctx.restore();
}

function drawSimplices(ctx, simplices = [], k) {
  switch (k) {
    case 0:
      drawPoints(ctx, simplices)
      break;
    case 1:
      drawEdges(ctx, simplices)
      break;
    default:
      drawKFaces(ctx, simplices, k)
  }
}

function drawText(ctx, simplices = [], k) {
  const {
    left,
    bottom,
    padding
  } = style.text
  ctx.fillStyle = d3.color('black')
  ctx.font = '14px serif';
  ctx.fillText(simplices.length, left + k * padding, height - bottom);
}

function animate(points) {
  points.forEach(point => {
    point.sx = point.x;
    point.sy = point.y;
  });

  points = randomLayout(points);

  const ctx = canvas.node().getContext('2d');
  ctx.save();

  const timer = d3.timer((elapsed) => {
    const t = Math.min(1, ease(elapsed / duration));

    points.forEach(point => {
      point.x = point.sx * (1 - t) + point.tx * t;
      point.y = point.sy * (1 - t) + point.ty * t;
    });

    const vrComplex = complex(points, maxDim, eta)

    ctx.clearRect(0, 0, width, height);

    d3.range(maxDim).forEach((dim) => {
      drawSimplices(ctx, vrComplex[`${dim}-simplices`], dim)
      drawText(ctx, vrComplex[`${dim}-simplices`], dim)
    })

    if (t === 1) {
      timer.stop();
      animate(points);
    }
  });
}

const screenScale = window.devicePixelRatio || 1;
const canvas = d3.select('body').append('canvas')
  .attr('width', width * screenScale)
  .attr('height', height * screenScale)
  .style('width', `${width}px`)
  .style('height', `${height}px`)

canvas.node().getContext('2d').scale(screenScale, screenScale);
animate(points)

if (module.hot) {
  module.hot.dispose(() => {
    window.location.reload();
  })
}
