import * as d3 from 'd3'
import {
  complex
} from './expansion'

const maxDim = 4
const eta = 50
const height = 600
const width = 600
const numPoints = 120
const pointWidth = 3
const duration = 5000;
const pointColor = '#a9553a'
const edgeColor = '#444444'
const ease = d3.easeCubic;
const colorScale = d3.interpolateMagma;
let timer;
const points = createPoints(numPoints, pointWidth, width, height)

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
  points.forEach((p) => {
    const {
      x,
      y,
    } = p;
    ctx.fillStyle = pointColor;
    ctx.beginPath()
    ctx.arc(x, y, pointWidth, 0, 2 * Math.PI, true)
    ctx.fill()
    ctx.closePath()
  })

  ctx.restore();
}

function drawEdges(ctx, edges) {
  ctx.strokeStyle = edgeColor

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

function drawK(ctx, simplices = [], k) {
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

// animate the points to a given layout
function animate(points) {
  // store the source position
  points.forEach(point => {
    point.sx = point.x;
    point.sy = point.y;
  });

  // get destination x and y position on each point
  points = randomLayout(points);

  const ctx = canvas.node().getContext('2d');
  ctx.save();

  timer = d3.timer((elapsed) => {
    // compute how far through the animation we are (0 to 1)
    const t = Math.min(1, ease(elapsed / duration));

    // update point positions (interpolate between source and target)
    points.forEach(point => {
      point.x = point.sx * (1 - t) + point.tx * t;
      point.y = point.sy * (1 - t) + point.ty * t;
    });

    const vrComplex = complex(points, maxDim, eta)

    ctx.clearRect(0, 0, width, height);

    d3.range(maxDim).forEach((dim) => {
      drawK(ctx, vrComplex[`${dim}-simplices`], dim)
    })

    // if this animation is over
    if (t === 1) {
      // stop this timer for this layout and start a new one
      timer.stop();

      // start animation for next layout
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
