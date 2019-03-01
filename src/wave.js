var WaveForm = function(svgDiv) {
  const SVG_DIV = svgDiv;
  const SVG = SVG_DIV.querySelector("svg");

  const NAMESPACE = "http://www.w3.org/2000/svg";

  let waveformPath = document.createElementNS(NAMESPACE, "path");
  waveformPath.setAttribute("class", "main-path");
  SVG.appendChild(waveformPath);


  const THIS = this;
  const CYCLES = 5;
  let lowerLimit = 0;
  let upperLimit = 2 * Math.PI;
  let waveformPathD;
  let lastWaveformPathD;


  THIS.f = function(x) {
    return Math.sin(x);
  }


  THIS.new = function(f) {
    if (f !== undefined) THIS.f = f;

    lastWaveformPathD = waveformPathD;

    draw();

    if (!lastWaveformPathD) {
      lastWaveformPathD = `M0,${SVG_DIV.clientHeight / 2}`;
      for (let i = 1; i < SVG_DIV.clientWidth; i++) {
        lastWaveformPathD += ` L${i},${SVG_DIV.clientHeight / 2}`;
      }
    }

    let animation = document.createElementNS(NAMESPACE, "animate");
    let animationValues = lastWaveformPathD + "; " + waveformPathD;

    animation.setAttribute("begin", "indefinite");
    animation.setAttribute("dur", "0.25");
    animation.setAttribute("repeatCount", "1");
    animation.setAttribute("attributeName", "d");
    animation.setAttribute("values", animationValues);
    waveformPath.appendChild(animation);
    animation.beginElement();
  }


  THIS.update = function(ll, ul) {
    if (ll !== undefined) lowerLimit = ll;
    if (ul !== undefined) upperLimit = ul;

    window.requestAnimationFrame(draw);
    waveformPath.innerHTML = "";
  }


  function draw() {
    let samplesPerCycle = Math.ceil(SVG_DIV.clientWidth / CYCLES);
    let range = upperLimit - lowerLimit;
    let waveformValues = [];
    let minY;
    let maxY;

    for (let i = 0; i < samplesPerCycle; i++) {
      let y;
      try {
        y = THIS.f(lowerLimit + i * range / samplesPerCycle);
        if (y === undefined || Math.abs(y) > 1e300) y = 0;
      }
      catch (error) {
        y = 0;
      }

      if (i === 0) minY = y, maxY = y;
      else if (y < minY) minY = y;
      else if (y > maxY) maxY = y;

      waveformValues.push(y);
    }

    if (minY === maxY) waveformValues.fill(SVG_DIV.clientHeight * 0.5);
    else waveformValues = waveformValues.map(function(y) {
      let height = SVG_DIV.clientHeight;
      return (height * 0.8 * (minY - y) / (maxY - minY)) + height * 0.9;
    });

    for (let i = 1; i < CYCLES; i++) {
      waveformValues.push(...waveformValues.slice());
    }

    waveformPathD = `M0,${waveformValues[0]}`;
    for (let i = 1; i < SVG_DIV.clientWidth; i++) {
      waveformPathD += ` L${i},${waveformValues[i]}`;
    }

    waveformPath.setAttribute("d", waveformPathD);
  }


  window.addEventListener("resize", function(event) {
    setTimeout(function () {window.requestAnimationFrame(draw);}, 100);
  }, false);
}
