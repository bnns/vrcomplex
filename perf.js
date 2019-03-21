// perf.js from this post: https://stackoverflow.com/questions/8279729/calculate-fps-in-canvas-using-requestanimationframe
// by user "Mick": https://stackoverflow.com/users/5688490/mick

// Options
const outputEl         = document.getElementById('fps-output');
const decimalPlaces    = 0;
const updateEachSecond = 1;

// Cache values
const decimalPlacesRatio = Math.pow(10, decimalPlaces);
let timeMeasurements     = [];

// Final output
fps = 0;

const tick = function() {
  timeMeasurements.push(performance.now());

  const msPassed = timeMeasurements[timeMeasurements.length - 1] - timeMeasurements[0];

  if (msPassed >= updateEachSecond * 1000) {
    fps = Math.round(timeMeasurements.length / msPassed * 1000 * decimalPlacesRatio) / decimalPlacesRatio;
    timeMeasurements = [];
  }

  outputEl.innerText = fps;

  requestAnimationFrame(() => {
    tick();
  });
}

tick();
