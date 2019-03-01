var Spectrum = function(svgDiv) {
  const SVG_DIV = svgDiv;
  const SVG = SVG_DIV.querySelector("svg");

  const NAMESPACE = "http://www.w3.org/2000/svg";

  let spectrumPath = document.createElementNS(NAMESPACE, "path");
  spectrumPath.setAttribute("class", "main-path");
  SVG.appendChild(spectrumPath);


  const THIS = this;
  let spectrumPathD = "";
  let lastSpectrumPathD = "";
  let lastLength = 0;
  let fourierSeries = {
    aCoefficients: [0, 0, 0],
    bCoefficients: [0, 1, 0]
  }


  THIS.new = function(fs) {
    if (fs !== undefined) fourierSeries = fs;
    lastSpectrumPathD = spectrumPathD;

    draw();

    if (!lastSpectrumPathD || fourierSeries.aCoefficients.length != lastLength) {
      lastSpectrumPathD = "";
      for (let i = 0, n = Math.min(fourierSeries.aCoefficients.length - 1,
        SVG_DIV.clientWidth / 10); i < n; i++) {
        lastSpectrumPathD += `M${i * 10 + 9},${SVG_DIV.clientHeight} `
        + `V${SVG_DIV.clientHeight} `;
      }
      lastLength = fourierSeries.aCoefficients.length;
    }

    let animation = document.createElementNS(NAMESPACE, "animate");
    let animationValues = lastSpectrumPathD + "; " + spectrumPathD;

    animation.setAttribute("begin", "indefinite");
    animation.setAttribute("dur", "0.25");
    animation.setAttribute("repeatCount", "1");
    animation.setAttribute("attributeName", "d");
    animation.setAttribute("values", animationValues);
    spectrumPath.appendChild(animation);
    animation.beginElement();
  }


  THIS.update = function(fs) {
    if (fs !== undefined) fourierSeries = fs;
    window.requestAnimationFrame(draw);
    spectrumPathD.innerHTML = "";
  }


  function draw() {
    let amplitudes = [];
    let minA;
    let maxA;
    spectrumPathD = "";

    for (let i = 1; i < fourierSeries.aCoefficients.length; i++) {
      let a = Math.sqrt(fourierSeries.aCoefficients[i] ** 2
        + fourierSeries.bCoefficients[i] ** 2);

      amplitudes.push(a);

      if (i === 1) minA = a, maxA = a;
      else if (a < minA) minA = a;
      else if (a > maxA) maxA = a;
    }

    if (!(minA == maxA)) {
      amplitudes = amplitudes.map(function(a) {
        a = (a - minA) / (maxA - minA) + 1;
        a = (Math.log2(a - 0.9683) + 4.98) / (2 * Math.PI) * SVG_DIV.clientHeight;
        return Math.max(a, 0);
      });
    }

    for (let i = 0, n = Math.min(amplitudes.length, SVG_DIV.clientWidth / 10);
      i < n; i++) {
      spectrumPathD += `M${i * 10 + 9},${SVG_DIV.clientHeight} `
      + `V${SVG_DIV.clientHeight - amplitudes[i]} `;
    }

    spectrumPath.setAttribute("d", spectrumPathD);
  }


  window.addEventListener("resize", function(event) {
    setTimeout(function () {window.requestAnimationFrame(draw);}, 100);
  }, false);
}
