var FunctionGraph = function(svgDiv) {
  const SVG_DIV = svgDiv;
  const SVG = SVG_DIV.querySelector("svg");
  const RESET_BUTTON = SVG_DIV.querySelector("#reset-button");
  const ZOOM_IN_BUTTON = SVG_DIV.querySelector("#zoom-in-button");
  const ZOOM_OUT_BUTTON = SVG_DIV.querySelector("#zoom-out-button");

  const NAMESPACE = "http://www.w3.org/2000/svg";

  let xGridFine = document.createElementNS(NAMESPACE, "path");
  xGridFine.setAttribute("class", "grid-fine");
  SVG.appendChild(xGridFine);
  let yGridFine = document.createElementNS(NAMESPACE, "path");
  yGridFine.setAttribute("class", "grid-fine");
  SVG.appendChild(yGridFine);

  let xGridCoarse = document.createElementNS(NAMESPACE, "path");
  xGridCoarse.setAttribute("class", "grid-coarse");
  SVG.appendChild(xGridCoarse);
  let yGridCoarse = document.createElementNS(NAMESPACE, "path");
  yGridCoarse.setAttribute("class", "grid-coarse");
  SVG.appendChild(yGridCoarse);

  let xAxis = document.createElementNS(NAMESPACE, "path");
  xAxis.setAttribute("class", "axis");
  SVG.appendChild(xAxis);
  let yAxis = document.createElementNS(NAMESPACE, "path");
  yAxis.setAttribute("class", "axis");
  SVG.appendChild(yAxis);

  let xGridLabels = document.createElementNS(NAMESPACE, "text");
  xGridLabels.setAttribute("class", "grid-labels");
  SVG.appendChild(xGridLabels);
  let yGridLabels = document.createElementNS(NAMESPACE, "text");
  yGridLabels.setAttribute("class", "grid-labels");
  SVG.appendChild(yGridLabels);

  let functionPath = document.createElementNS(NAMESPACE, "path");
  functionPath.setAttribute("class", "main-path");
  SVG.appendChild(functionPath);

  let delimiter0 = document.createElementNS(NAMESPACE, "path");
  delimiter0.setAttribute("class", "delimiter");
  SVG.appendChild(delimiter0);
  let dlm0Mask = document.createElementNS(NAMESPACE, "path");
  dlm0Mask.setAttribute("class", "delimiter-mask");
  SVG.appendChild(dlm0Mask);
  let dlm0Label = document.createElementNS(NAMESPACE, "text");
  dlm0Label.setAttribute("class", "delimiter-label");
  SVG.appendChild(dlm0Label);
  let dlm0LabelName = document.createElementNS(NAMESPACE, "tspan");
  dlm0LabelName.textContent = "Start";
  dlm0Label.appendChild(dlm0LabelName);
  let dlm0LabelValue = document.createElementNS(NAMESPACE, "tspan");
  dlm0Label.appendChild(dlm0LabelValue);

  let delimiter1 = document.createElementNS(NAMESPACE, "path");
  delimiter1.setAttribute("class", "delimiter");
  SVG.appendChild(delimiter1);
  let dlm1Mask = document.createElementNS(NAMESPACE, "path");
  dlm1Mask.setAttribute("class", "delimiter-mask");
  SVG.appendChild(dlm1Mask);
  let dlm1Label = document.createElementNS(NAMESPACE, "text");
  dlm1Label.setAttribute("class", "delimiter-label");
  SVG.appendChild(dlm1Label);
  let dlm1LabelName = document.createElementNS(NAMESPACE, "tspan");
  dlm1LabelName.textContent = "End";
  dlm1Label.appendChild(dlm1LabelName);
  let dlm1LabelValue = document.createElementNS(NAMESPACE, "tspan");
  dlm1Label.appendChild(dlm1LabelValue);


  const THIS = this;
  let x0 = SVG_DIV.clientWidth / 4;
  let initialX0;
  let xUnitScale = (SVG_DIV.clientWidth / 3) / (2 * Math.PI);
  let initialXUnitScale;
  let minXUnitScale = 1e-299;
  let maxXUnitScale = 1e13;
  let y0;
  let minY;
  let maxY;
  let xDivisions = 1;
  let yDivisions = 1;
  let functionPathD;
  let lastFunctionPathD;
  let lowerLimit = 0;
  let upperLimit = 2 * Math.PI;
  let initialLowerLimit;
  let initialUpperLimit;
  let lastLowerLimit;
  let lastUpperLimit;
  let dlm0LabelY;
  let initialPageX0;
  let initialPageX1;


  THIS.getLowerLimit = function() {return lowerLimit;}
  THIS.getUpperLimit = function() {return upperLimit;}


  THIS.f = function(x) {
    return Math.sin(x);
  }


  THIS.new = function(f) {
    if (f !== undefined) THIS.f = f;

    lastFunctionPathD = functionPathD;

    plotFunction();
    drawXGrid();
    drawYGrid();
    drawDelimiters();

    if (!lastFunctionPathD) {
      lastFunctionPathD = `M0,${y0}`;
      for (let i = 1; i < SVG_DIV.clientWidth; i++) {
        lastFunctionPathD += ` L${i},${y0}`;
      }
    }

    let animation = document.createElementNS(NAMESPACE, "animate");
    let animationValues = lastFunctionPathD + "; " + functionPathD;

    animation.setAttribute("begin", "indefinite");
    animation.setAttribute("dur", "0.25");
    animation.setAttribute("repeatCount", "1");
    animation.setAttribute("attributeName", "d");
    animation.setAttribute("values", animationValues);
    functionPath.appendChild(animation);
    animation.beginElement();
  }


  function update() {
    plotFunction();
    drawXGrid();
    drawYGrid();
    drawDelimiters();
    functionPath.innerHTML = "";
  }


  function plotFunction() {
    let functionYValues = [];
    minY = undefined;
    maxY = undefined;

    for (let i = 1; i < SVG_DIV.clientWidth + 1; i++) {
      let y;
      try {
        y = THIS.f(x = (i - x0) / xUnitScale);
        if (y === undefined || Math.abs(y) > 1e300) y = 0;
      }
      catch (error) {
        y = 0;
      }

      if (i === 1) minY = y, maxY = y;
      else if (y < minY) minY = y;
      else if (y > maxY) maxY = y;

      functionYValues.push(y);
    }

    if (minY === maxY) {
      if (minY < 0) minY += minY, maxY -= maxY;
      else if (minY > 0) minY -= minY, maxY += maxY;
      else minY = -1, maxY = 1;
    }

    y0 = scaleY(0);
    functionYValues = functionYValues.map(scaleY);

    functionPathD = `M0,${functionYValues[0]}`;
    for (let i = 1; i < SVG_DIV.clientWidth; i++) {
      functionPathD += ` L${i},${functionYValues[i]}`;
    }

    functionPath.setAttribute("d", functionPathD);
  }


  function drawXGrid() {
    let lineDistance = xUnitScale;
    let minLineDistance = 20;
    let maxLineDistance = 50;
    let labelValueMultiplier = 5;

    if (xDivisions > 0) {
      for (let i = 0; i < xDivisions; i++) {
        if (i % 3 === 0) {
          lineDistance /= 2.5;
          labelValueMultiplier /= 2.5;
        }
        else {
          lineDistance /= 2;
          labelValueMultiplier /= 2;
        }
      }
    }

    else if (xDivisions < 0) {
      for (let i = 0; i > xDivisions; i--) {
        if ((i + 2) % 3 === 0) {
          lineDistance *= 2.5;
          labelValueMultiplier *= 2.5;
        }
        else {
          lineDistance *= 2;
          labelValueMultiplier *= 2;
        }
      }
    }

    if (lineDistance > maxLineDistance) {
      while (lineDistance / 2.5 > minLineDistance) {
        xDivisions++;
        if ((xDivisions + 2) % 3 === 0) {
          lineDistance /= 2.5;
          labelValueMultiplier /= 2.5;
        }
        else {
          lineDistance /= 2;
          labelValueMultiplier /= 2;
        }
      }
    }

    else if (lineDistance < minLineDistance) {
      while (lineDistance * 2.5 < maxLineDistance) {
        xDivisions--;
        if (xDivisions % 3 === 0) {
          lineDistance *= 2.5;
          labelValueMultiplier *= 2.5;
        }
        else {
          lineDistance *= 2;
          labelValueMultiplier *= 2;
        }
      }
    }

    let gridFineD = "";
    let gridCoarseD = "";
    xGridLabels.innerHTML = "";

    let gridLinesFine = Math.ceil(SVG_DIV.clientWidth / lineDistance);
    let gridLinesCoarse = Math.ceil(SVG_DIV.clientWidth / (lineDistance * 5));

    let multiplierFine = Math.floor(x0 / lineDistance);
    let multiplierCoarse = Math.floor(x0 / (lineDistance * 5));

    for (let i = 0; i < gridLinesFine; i++) {
      let x = x0 - lineDistance * (multiplierFine - i);
      gridFineD += `M${x},0 V${SVG_DIV.clientHeight} `;
    }

    for (let i = -1; i < gridLinesCoarse; i++) {
      let x = x0 - lineDistance * 5 * (multiplierCoarse - i);
      gridCoarseD += `M${x},0 V${SVG_DIV.clientHeight} `;

      let label = document.createElementNS(NAMESPACE, "tspan");
      label.setAttribute("x", `${x + 3}`);
      label.setAttribute("y", `${SVG_DIV.clientHeight - 9}`);

      let labelValue = -labelValueMultiplier * (multiplierCoarse - i);
      label.textContent = formatLabelValue(labelValue, labelValueMultiplier);
      xGridLabels.appendChild(label);
    }

    xGridFine.setAttribute("d", gridFineD);
    xGridCoarse.setAttribute("d", gridCoarseD);
    xAxis.setAttribute("d", `M0,${y0} H${SVG_DIV.clientWidth}`);
  }


  function drawYGrid() {
    let digits = Math.log10(maxY - minY) + 1 | 0;
    let units = Math.pow(10, digits);
    let lineDistance = y0 - scaleY(units);
    let minLineDistance = 10;
    let maxLineDistance = 25;
    let labelValueMultiplier = units * 5;

    if (yDivisions > 0) {
      for (let i = 0; i < yDivisions; i++) {
        if (i % 3 === 0) {
          lineDistance /= 2.5;
          labelValueMultiplier /= 2.5;
        }
        else {
          lineDistance /= 2;
          labelValueMultiplier /= 2;
        }
      }
    }

    else if (yDivisions < 0) {
      for (let i = 0; i > yDivisions; i--) {
        if ((i + 2) % 3 === 0) {
          lineDistance *= 2.5;
          labelValueMultiplier *= 2.5;
        }
        else {
          lineDistance *= 2;
          labelValueMultiplier *= 2;
        }
      }
    }

    if (lineDistance > maxLineDistance) {
      while (lineDistance / 2.5 > minLineDistance) {
        yDivisions++;
        if ((yDivisions + 2) % 3 === 0) {
          lineDistance /= 2.5;
          labelValueMultiplier /= 2.5;
        }
        else {
          lineDistance /= 2;
          labelValueMultiplier /= 2;
        }
      }
    }

    else if (lineDistance < minLineDistance) {
      while (lineDistance * 2.5 < maxLineDistance) {
        yDivisions--;
        if (yDivisions % 3 === 0) {
          lineDistance *= 2.5;
          labelValueMultiplier *= 2.5;
        }
        else {
          lineDistance *= 2;
          labelValueMultiplier *= 2;
        }
      }
    }

    let gridFineD = "";
    let gridCoarseD = "";
    yGridLabels.innerHTML = "";

    let reference = Math.floor((minY / labelValueMultiplier)) * labelValueMultiplier;
    let yReference = scaleY(reference);

    let gridLinesFine = Math.ceil(SVG_DIV.clientHeight / lineDistance);
    let gridLinesFineMargin = Math.ceil(gridLinesFine * 0.1);
    gridLinesFine += gridLinesFineMargin;

    let gridLinesCoarse = Math.ceil(SVG_DIV.clientHeight / (lineDistance * 5));
    let gridLinesCoarseMargin = Math.ceil(gridLinesCoarse * 0.1);
    gridLinesCoarse += gridLinesCoarseMargin

    for (let i = -gridLinesFineMargin; i < gridLinesFine; i++) {
      let y = yReference - lineDistance * i;
      gridFineD += `M0,${y} H${SVG_DIV.clientWidth} `;
    }

    for (let i = -gridLinesCoarseMargin; i < gridLinesCoarse; i++) {
      let y = yReference - lineDistance * 5 * i;
      gridCoarseD += `M0,${y} H${SVG_DIV.clientWidth} `;

      let label = document.createElementNS(NAMESPACE, "tspan");
      label.setAttribute("x", "3");
      label.setAttribute("y", `${y - 3}`);

      let labelValue = reference + labelValueMultiplier * i;
      label.textContent = formatLabelValue(labelValue, labelValueMultiplier);
      xGridLabels.appendChild(label);
    }

    yGridFine.setAttribute("d", gridFineD);
    yGridCoarse.setAttribute("d", gridCoarseD);
    yAxis.setAttribute("d", `M${x0},0 V${SVG_DIV.clientHeight}`);
  }


  function formatLabelValue(labelValue, labelValueMultiplier) {
    let absLabelValue = Math.abs(labelValue);

    if (absLabelValue > 1e3) {
      let match0 = labelValue.toExponential().match(/(e)(\+\d+)/);
      let match1 = labelValueMultiplier.toExponential().match(/(e)([+-]\d+)/);
      let index = Math.max(0, parseInt(match0[2]) - parseInt(match1[2]));
      return labelValue.toExponential(index);
    }

    else if (absLabelValue < 1e-3 && absLabelValue !== 0) {
      let match = labelValueMultiplier.toExponential().match(/(e-)(\d+)/);
      let index = parseInt(match[2]);
      return labelValue.toExponential(index);
    }

    else if (absLabelValue !== 0) {
      let match = labelValueMultiplier.toExponential().match(/(e-)(\d+)/);
      let index = 0;
      if (match) index = parseInt(match[2]);
      return labelValue.toFixed(index);
    }

    else if (absLabelValue === 0) {
      return labelValue.toFixed(0)
    }
  }


  function scaleY(y) {
    let height = SVG_DIV.clientHeight;
    return (height * 0.8 * (minY - y) / (maxY - minY)) + height * 0.9;
  }


  function drawDelimiters() {
    drawDelimiter0();
    drawDelimiter1();
    dispatchLimitEvent();
  }


  function drawDelimiter0() {
    let xDelimiter0 = lowerLimit * xUnitScale + x0;

    if (xDelimiter0 < 10) {
      xDelimiter0 = 10;
      lowerLimit = (xDelimiter0 - x0) / xUnitScale;
    }
    else if (xDelimiter0 > SVG_DIV.clientWidth - 10) {
      xDelimiter0 = SVG_DIV.clientWidth - 10;
      lowerLimit = (xDelimiter0 - x0) / xUnitScale;
    }

    delimiter0.setAttribute("d", `M${xDelimiter0},${0} V${SVG_DIV.clientHeight}`);
    dlm0Mask.setAttribute("d", `M${xDelimiter0},${0} V${SVG_DIV.clientHeight}`);

    if (Math.abs(lowerLimit) < 1e3) {
      dlm0LabelValue.textContent = `${lowerLimit.toFixed(3)}`;
    }
    else {
      dlm0LabelValue.textContent = `${lowerLimit.toExponential(3)}`;
    }

    let dlm0LabelWidth = dlm0Label.getBoundingClientRect().width + 10;

    if (lowerLimit <= upperLimit && xDelimiter0 < SVG_DIV.clientWidth - dlm0LabelWidth
      || xDelimiter0 < dlm0LabelWidth) {
      dlm0LabelName.setAttribute("x", `${xDelimiter0 + 3}`);
      dlm0LabelValue.setAttribute("x", `${xDelimiter0 + 3}`);
      dlm0LabelValue.setAttribute("text-anchor", "start");
      dlm0LabelName.setAttribute("text-anchor", "start");
    }
    else {
      dlm0LabelName.setAttribute("x", `${xDelimiter0 - 6}`);
      dlm0LabelValue.setAttribute("x", `${xDelimiter0 - 6}`);
      dlm0LabelValue.setAttribute("text-anchor", "end");
      dlm0LabelName.setAttribute("text-anchor", "end");
    }

    if (lowerLimit > upperLimit && xDelimiter0 < 75 + dlm0LabelWidth
      || xDelimiter0 < 75) {
      dlm0LabelY = [60, 75];
      dlm0LabelName.setAttribute("y", `${dlm0LabelY[0]}`);
      dlm0LabelValue.setAttribute("y", `${dlm0LabelY[1]}`);
    }
    else {
      dlm0LabelY = [15, 30];
      dlm0LabelName.setAttribute("y", `${dlm0LabelY[0]}`);
      dlm0LabelValue.setAttribute("y", `${dlm0LabelY[1]}`);
    }
  }


  function drawDelimiter1(dispatchNewLimitEvent = false) {
    let xDelimiter1 = upperLimit * xUnitScale + x0;

    if (xDelimiter1 < 10) {
      xDelimiter1 = 10;
      upperLimit = (xDelimiter1 - x0) / xUnitScale;
    }
    else if (xDelimiter1 > SVG_DIV.clientWidth - 10) {
      xDelimiter1 = SVG_DIV.clientWidth - 10;
      upperLimit = (xDelimiter1 - x0) / xUnitScale;
    }

    delimiter1.setAttribute("d", `M${xDelimiter1},${0} V${SVG_DIV.clientHeight}`);
    dlm1Mask.setAttribute("d", `M${xDelimiter1},${0} V${SVG_DIV.clientHeight}`);

    if (Math.abs(upperLimit) < 1e3) {
      dlm1LabelValue.textContent = `${upperLimit.toFixed(3)}`;
    }
    else {
      dlm1LabelValue.textContent = `${upperLimit.toExponential(3)}`;
    }

    let dlm0LabelWidth = dlm0Label.getBoundingClientRect().width + 10;
    let dlm1LabelWidth = dlm1Label.getBoundingClientRect().width + 10;

    if (upperLimit > lowerLimit && xDelimiter1 > dlm1LabelWidth
      || xDelimiter1 > SVG_DIV.clientWidth - dlm1LabelWidth) {
      dlm1LabelName.setAttribute("x", `${xDelimiter1 - 6}`);
      dlm1LabelValue.setAttribute("x", `${xDelimiter1 - 6}`);
      dlm1LabelValue.setAttribute("text-anchor", "end");
      dlm1LabelName.setAttribute("text-anchor", "end");
    }
    else {
      dlm1LabelName.setAttribute("x", `${xDelimiter1 + 3}`);
      dlm1LabelValue.setAttribute("x", `${xDelimiter1 + 3}`);
      dlm1LabelValue.setAttribute("text-anchor", "start");
      dlm1LabelName.setAttribute("text-anchor", "start");
    }

    if (Math.abs(upperLimit - lowerLimit) * xUnitScale < dlm0LabelWidth + dlm1LabelWidth) {
      dlm1LabelName.setAttribute("y", `${dlm0LabelY[0] + 45}`);
      dlm1LabelValue.setAttribute("y", `${dlm0LabelY[1] + 45}`);
    }
    else {
      if (lowerLimit < upperLimit && xDelimiter1 < 75 + dlm1LabelWidth
        || xDelimiter1 < 75) {
        dlm1LabelName.setAttribute("y", "60");
        dlm1LabelValue.setAttribute("y", "75");
      }
      else {
        dlm1LabelName.setAttribute("y", "15");
        dlm1LabelValue.setAttribute("y", "30");
      }
    }
  }


  function dispatchLimitEvent() {
    if (lowerLimit != lastLowerLimit || upperLimit != lastUpperLimit) {
      let limitEvent = new Event("limitUpdate");
      document.dispatchEvent(limitEvent);
      lastLowerLimit = lowerLimit;
      lastUpperLimit = upperLimit;
    }
  }


  SVG.addEventListener("mousedown", function(event) {
    event.preventDefault();
    initialX0 = x0;
    initialLowerLimit = lowerLimit;
    initialUpperLimit = upperLimit;
    initialPageX0 = event.pageX;
    document.addEventListener("mousemove", mouseMove, false);
    document.addEventListener("mouseup", function(event) {
      event.preventDefault();
      document.removeEventListener("mousemove", mouseMove, false);
    }, {once: true}, false);
  }, false);


  function mouseMove(event) {
    event.preventDefault();
    let pageX0 = event.pageX;

    x0 = initialX0 + pageX0 - initialPageX0;
    lowerLimit = initialLowerLimit;
    upperLimit = initialUpperLimit;
    window.requestAnimationFrame(update);
  }


  SVG.addEventListener("touchstart", function handleTouchEvent(event) {
    event.preventDefault();
    initialX0 = x0;
    initialXUnitScale = xUnitScale;
    initialLowerLimit = lowerLimit;
    initialUpperLimit = upperLimit;
    initialPageX0 = event.touches[0].pageX;
    if (event.touches.length > 1) {
      initialPageX1 = event.touches[1].pageX;
    }
    document.addEventListener("touchmove", touchMove, false);
    document.addEventListener("touchend", function(event) {
      event.preventDefault();
      if (event.touches.length > 0) handleTouchEvent(event);
      else document.removeEventListener("touchmove", touchMove, false);
    }, {once: true}, false);
  }, false);


  function touchMove(event) {
    if (event.touches.length === 1) {
      let pageX0 = event.touches[0].pageX;
      x0 = initialX0 + pageX0 - initialPageX0;
    }

    else if (event.touches.length > 1) {
      let pageX0 = event.touches[0].pageX;
      let pageX1 = event.touches[1].pageX;

      let initialDistance = initialPageX1 - initialPageX0;
      if (Math.abs(initialDistance) < 10) {
        if (initialDistance < 0) initialDistance = -10;
        else if (initialDistance >= 0) initialDistance = 10;
      }

      let distance = pageX1 - pageX0;
      if (initialDistance < 0 && distance > -10) distance = -10;
      else if (initialDistance > 0 && distance < 10) distance = 10;

      let newXUnitScale = initialXUnitScale * (distance / initialDistance);

      if (newXUnitScale > maxXUnitScale && newXUnitScale > xUnitScale
        || newXUnitScale < minXUnitScale && newXUnitScale < xUnitScale) {
        initialX0 = x0;
        initialXUnitScale = xUnitScale;
        initialPageX0 = pageX0;
        initialPageX1 = pageX1
        return;
      }

      xUnitScale = newXUnitScale;
      x0 = pageX0 - SVG_DIV.getBoundingClientRect().left + (initialX0 - initialPageX0
        + SVG_DIV.getBoundingClientRect().left) * (distance / initialDistance);
    }

    lowerLimit = initialLowerLimit;
    upperLimit = initialUpperLimit;

    window.requestAnimationFrame(update);
  }


  SVG.addEventListener("wheel", wheelZoom, false);


  function wheelZoom(event) {
    event.preventDefault();
    let distFromX0 = x0 - event.pageX + SVG_DIV.getBoundingClientRect().left;

    if (event.deltaY < 0) {
      let newXUnitScale = xUnitScale * (1 + 0.05);
      if (newXUnitScale > maxXUnitScale) {
        return;
      }
      xUnitScale = newXUnitScale;
      x0 += distFromX0 / (1 / 0.05);
      window.requestAnimationFrame(update);
    }
    else if (event.deltaY > 0) {
      let newXUnitScale = xUnitScale / (1 + 0.05);
      if (newXUnitScale < minXUnitScale) {
        return;
      }
      xUnitScale = newXUnitScale;
      x0 -= distFromX0 / (1 + 1 / 0.05);
      window.requestAnimationFrame(update);
    }
  }


  SVG.addEventListener("dblclick", function(event) {
    const X_UNIT_SCALE = xUnitScale * 4;
    const X_0 = x0 + (x0 - event.pageX + SVG_DIV.getBoundingClientRect().left) * 3;
    clickZoom(X_UNIT_SCALE, X_0);
  }, false);


  ZOOM_IN_BUTTON.addEventListener("click", function(event) {
    const X_UNIT_SCALE = xUnitScale * 2;
    const X_0 = SVG_DIV.clientWidth / 2 + (x0 - SVG_DIV.clientWidth / 2) * 2;
    ZOOM_IN_BUTTON.style.transform = "scale(1.2)";
    clickZoom(X_UNIT_SCALE, X_0);
    setTimeout(function () {
      ZOOM_IN_BUTTON.style.transform = "";
    }, parseFloat(window.getComputedStyle(ZOOM_IN_BUTTON).transitionDuration) * 1000);
  }, false);


  ZOOM_OUT_BUTTON.addEventListener("click", function(event) {
    const X_UNIT_SCALE = xUnitScale / 2;
    const X_0 = SVG_DIV.clientWidth / 2 + (x0 - SVG_DIV.clientWidth / 2) / 2;
    ZOOM_OUT_BUTTON.style.transform = "scale(0.8)";
    clickZoom(X_UNIT_SCALE, X_0);
    setTimeout(function () {
      ZOOM_OUT_BUTTON.style.transform = "";
    }, parseFloat(window.getComputedStyle(ZOOM_OUT_BUTTON).transitionDuration) * 1000);
  }, false);


  function clickZoom(X_UNIT_SCALE, X_0) {
    if (X_UNIT_SCALE > maxXUnitScale && X_UNIT_SCALE > xUnitScale) {
      let factor = (maxXUnitScale - xUnitScale) / (X_UNIT_SCALE - xUnitScale);
      X_UNIT_SCALE -= (X_UNIT_SCALE - xUnitScale) * (1 - factor);
      X_0 -= (X_0 - x0) * (1 - factor);
    }
    else if (X_UNIT_SCALE < minXUnitScale && X_UNIT_SCALE < xUnitScale) {
      let factor = (xUnitScale - minXUnitScale) / (xUnitScale - X_UNIT_SCALE);
      X_UNIT_SCALE += (xUnitScale - X_UNIT_SCALE) * (1 - factor);
      X_0 += (x0 - X_0) * (1 - factor);
    }

    let startTime = null;
    let duration = 250;

    function animationStep(timestamp) {
      if (!startTime) startTime = timestamp;
      let progress = timestamp - startTime;

      if (xUnitScale < X_UNIT_SCALE) {
        xUnitScale += (X_UNIT_SCALE - xUnitScale) * progress / duration;
      }
      else if (xUnitScale > X_UNIT_SCALE) {
        xUnitScale -= (xUnitScale - X_UNIT_SCALE) * progress / duration;
      }

      if (x0 < X_0) {
        x0 += (X_0 - x0) * progress / duration;
      }
      else if (x0 > X_0) {
        x0 -= (x0 - X_0) * progress / duration;
      }

      update();

      if (progress < duration) {
        window.requestAnimationFrame(animationStep);
      }
    }

    window.requestAnimationFrame(animationStep);
  }


  dlm0Mask.addEventListener("mousedown", function(event){
    event.preventDefault();
    event.stopPropagation();
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", moveDelimiter0, false);
    document.addEventListener("mouseup", function(event){
      event.preventDefault();
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", moveDelimiter0, false);
    }, {once: true}, false);
  }, false);


  dlm0Mask.addEventListener("touchstart", function(event){
    event.preventDefault();
    event.stopPropagation();
    document.addEventListener("touchmove", moveDelimiter0, false);
    document.addEventListener("touchend", function(event){
      event.preventDefault();
      document.removeEventListener("touchmove", moveDelimiter0, false);
    }, {once: true}, false);
  }, false);


  function moveDelimiter0(event) {
    let pageX;

    if (event.type === "mousemove") {
      event.preventDefault();
      pageX = event.pageX;
    }
    else if (event.type === "touchmove") {
      if (event.touches.length > 1) {
        return
      }
      pageX = event.touches[0].pageX;
    }

    lowerLimit = (pageX - SVG_DIV.getBoundingClientRect().left - x0) / xUnitScale;
    window.requestAnimationFrame(drawDelimiters);
  }


  dlm1Mask.addEventListener("mousedown", function(event){
    event.preventDefault();
    event.stopPropagation();
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", moveDelimiter1, false);
    document.addEventListener("mouseup", function(event){
      event.preventDefault();
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", moveDelimiter1, false);
    }, {once: true}, false);
  }, false);


  dlm1Mask.addEventListener("touchstart", function(event){
    event.preventDefault();
    event.stopPropagation();
    document.addEventListener("touchmove", moveDelimiter1, false);
    document.addEventListener("touchend", function(event){
      event.preventDefault();
      document.removeEventListener("touchmove", moveDelimiter1, false);
    }, {once: true}, false);
  }, false);


  function moveDelimiter1(event) {
    let pageX;

    if (event.type === "mousemove") {
      event.preventDefault();
      pageX = event.pageX;
    }
    else if (event.type === "touchmove") {
      if (event.touches.length > 1) {
        return
      }
      pageX = event.touches[0].pageX;
    }

    upperLimit = (pageX - SVG_DIV.getBoundingClientRect().left - x0) / xUnitScale;
    window.requestAnimationFrame(drawDelimiters);
  }


  RESET_BUTTON.addEventListener("click", function(event) {
    let resetIcon = RESET_BUTTON.querySelector(".reset-icon");
    resetIcon.style.transitionDuration = "0s";
    resetIcon.style.transform = "";
    setTimeout(function() {
      resetIcon.style.transitionDuration = "";
      resetIcon.style.transform = "rotate(-360deg)";
      reset();
    }, 25);
  }, false);


  function reset() {
    const X_0 = SVG_DIV.clientWidth / 4;
    const X_UNIT_SCALE = (SVG_DIV.clientWidth / 3) / (2 * Math.PI);
    const LOWER_LIMIT = 0;
    const UPPER_LIMIT = 2 * Math.PI;

    let startTime = null;
    let duration = 500;

    function animationStep(timestamp) {
      if (!startTime) startTime = timestamp;
      let progress = timestamp - startTime;

      if (x0 < X_0) {
        x0 += (X_0 - x0) * progress / duration;
      }
      else if (x0 > X_0) {
        x0 -= (x0 - X_0) * progress / duration;
      }

      if (xUnitScale < X_UNIT_SCALE) {
        xUnitScale += (X_UNIT_SCALE - xUnitScale) * progress / duration;
      }
      else if (xUnitScale > X_UNIT_SCALE) {
        xUnitScale -= (xUnitScale - X_UNIT_SCALE) * progress / duration;
      }

      if (lowerLimit < LOWER_LIMIT) {
        lowerLimit += (LOWER_LIMIT - lowerLimit) * progress / duration;
      }
      else if (lowerLimit > LOWER_LIMIT) {
        lowerLimit -= (lowerLimit - LOWER_LIMIT) * progress / duration;
      }

      if (upperLimit < UPPER_LIMIT) {
        upperLimit += (UPPER_LIMIT - upperLimit) * progress / duration;
      }
      else if (upperLimit > UPPER_LIMIT) {
        upperLimit -= (upperLimit - UPPER_LIMIT) * progress / duration;
      }

      update();

      if (progress < duration) {
        window.requestAnimationFrame(animationStep);
      }
    }

    if (x0 != X_0 || xUnitScale != X_UNIT_SCALE || lowerLimit != LOWER_LIMIT
        || upperLimit != UPPER_LIMIT) {
      window.requestAnimationFrame(animationStep);
    }
  }


  window.addEventListener("resize", function(event) {
    setTimeout(function () {window.requestAnimationFrame(update);}, 100);
  }, false);
}
