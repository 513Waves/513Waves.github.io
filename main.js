const INPUT = document.getElementById("input");
const RESULT = document.getElementById("result");
const SVG_1_DIV = document.getElementById("svg-1-div");
const SVG_2_DIV = document.getElementById("svg-2-div");
const SVG_3_DIV = document.getElementById("svg-3-div");

var mathParser0 = new MathParser();
var mathParser1 = new MathParser();
var graph = new FunctionGraph(SVG_1_DIV);
var waveform = new WaveForm(SVG_2_DIV);
var fourier = new FourierTransform();
var spectrum = new Spectrum(SVG_3_DIV);
var synth;

var lastKeyPressed;
var lastDeleted;


graph.new();
waveform.new();
fourier.new();
spectrum.new();


INPUT.addEventListener("keydown", getLastKeyPressed, false);
INPUT.addEventListener("input", handleInput, false);
document.addEventListener("limitUpdate", handleLimitUpdate, false);


function getLastKeyPressed(event) {
  lastKeyPressed = event.key;
  lastDeleted = undefined;

  if (lastKeyPressed === "Backspace") {
    if (INPUT.selectionStart === INPUT.selectionEnd) {
      lastDeleted = INPUT.value[INPUT.selectionStart - 1];
    }
    else {
      lastDeleted = INPUT.value.slice(INPUT.selectionStart, INPUT.selectionEnd);
    }
  }
}


function handleInput(event) {
  let parserString;

  formatInputString();
  lastKeyPressed = undefined;
  lastDeleted = undefined;
  parserString = getParserString();

  try {
    mathParser0.tokenize(parserString);
    mathParser0.evaluate();
    INPUT.parentElement.style.backgroundColor = "";
    if (!parserString.match(/x/i) && parserString.match(/[^\d\.]/)) {
      RESULT.style.transform = "scaleX(1)";
      RESULT.innerHTML = `= ${mathParser0.evaluate()}`;
    }
    else {
      RESULT.style.transform = "";
      RESULT.innerHTML = "";
    }
  }
  catch (error) {
    INPUT.parentElement.style.backgroundColor = "#ff8080bf";
    RESULT.style.transform = "";
    RESULT.innerHTML = "";
    return;
  }

  mathParser1.tokenize(parserString);
  graph.new(mathParser1.evaluate);
  waveform.new(mathParser1.evaluate);
  fourier.new(mathParser1.evaluate);
  spectrum.new(fourier.series);
  if (synth) synth.setPeriodicWave(fourier.series);
}


function formatInputString() {
  if (INPUT.selectionStart !== INPUT.selectionEnd) {
    return;
  }

  let cursorPosition = INPUT.selectionStart;
  let cursorShift = 0;
  let string = INPUT.value;

  if (lastDeleted === "(" && string[cursorPosition] === ")"
    || lastDeleted === "{" && string[cursorPosition] === "}") {
    let first = string.slice(0, cursorPosition);
    let second = string.slice(cursorPosition + 1);
    INPUT.value = first + second;
    INPUT.selectionStart = INPUT.selectionEnd = cursorPosition + cursorShift;
    return;
  }

  else if (lastKeyPressed === "Backspace" || lastKeyPressed === "Delete") {
    return;
  }

  else if ((lastKeyPressed === "(" || lastKeyPressed === "{")
    && (/[^\w\.πτφ]/.test(string[cursorPosition])
    || string.length === cursorPosition)) {
    let first = string.slice(0, cursorPosition);
    let second = string.slice(cursorPosition);
    if (lastKeyPressed === "(") string = first + ")" + second;
    else string = first + "}" + second;
  }

  else if (/\w/.test(lastKeyPressed)) {
    let regex = RegExp("(abs|round|trunc|floor|ceil|sqrt|cbrt|" +
                       "log(\\d*\\.\\d+|[1-9]\\d*)|log|ln|" +
                       "sinh|asinh|cosh|acosh|tanh|atanh|" +
                       "sin|asin|cos|acos|tan|atan)\$", "i");
    if (string.slice(0, cursorPosition).match(regex)) {
      if (cursorPosition === string.length) {
        string = string + "()";
        cursorShift += 1;
      }
      else if (string[cursorPosition] === ")"
        || string[cursorPosition] === "}") {
        let first = string.slice(0, cursorPosition);
        let second = string.slice(cursorPosition);
        string = first + "()" + second;
        cursorShift += 1;
      }
      else if (string[cursorPosition] !== "(") {
        let first = string.slice(0, cursorPosition);
        let second = string.slice(cursorPosition);
        string = first + "(" + second;
        cursorShift += 1;
      }
    }
  }

  let regex = RegExp(",|\\s*[/^]\\s*\\d*\\.?\\d+\\s*(?=[a-zA-Zπτeφ(])|" +
                     "\\s*[/^]\\s*[πτeφ]\\s*(?=[πτeφ\(])|" +
                     "pi|tau|phi|[*·]{2}|\\*|\\bif\\b|<=|!=|>=", "gi");

  string = string.replace(regex, function(match, offset) {
    if (cursorPosition >= offset + match.length) {
      cursorShift += -match.length + 1;
    }

    if (/[*·]{2,}/.test(match)) {
      return "^";
    }

    else if (match.trim()[0] === "/" || match.trim()[0] === "^") {
      let replacement = match.replace(/\s*/g, "") + " · ";
      if (cursorPosition >= offset + match.length) {
        cursorShift += replacement.length - 1;
      }
      return replacement;
    }

    switch (match.toLowerCase()) {
      case ",": return ".";
      case "pi": return "π";
      case "tau": return "τ";
      case "phi": return "φ";
      case "*": return "·";
      case "if": return "{}";
      case "<=": return "≤";
      case "!=": return "≠";
      case ">=": return "≥";
      default:
        if (cursorPosition >= offset + match.length) {
          cursorShift += match.length - 1;
        }
        return match;
    }
  });

  INPUT.value = string;
  INPUT.selectionStart = INPUT.selectionEnd = cursorPosition + cursorShift;
}


function getParserString() {
  let parserString = INPUT.value.toLowerCase();

  let regex = /π|τ|φ|·|≠|≤|≥/g;
  parserString = parserString.replace(regex, function(match) {
    switch (match) {
      case "π": return "pi";
      case "τ": return "tau";
      case "φ": return "phi";
      case "·": return "*";
      case "≠": return "!=";
      case "≤": return "<=";
      case "≥": return ">=";
    }
  });

  regex = RegExp("(\\d\\s*|pi\\s*|tau\\s*|e\\s*|phi\\s*)" +
                 "(?=pi|tau|e|phi|x|abs|round|trunc|floor|ceil|" +
                 "sqrt|cbrt|log|ln|sin|asin|cos|acos|tan|atan)", "g");
  parserString = parserString.replace(regex, function(match, p1, offset) {
    if (/log\d*\.?\d+$/.test(parserString.slice(0, offset + 1))) return match;
    else if (/.+\s+/.test(match)) return match + "* ";
    else if (/.+/.test(match)) return match + "*";
  });

  return parserString;
}


function handleLimitUpdate(event) {
  let lowerLimit = graph.getLowerLimit();
  let upperLimit = graph.getUpperLimit();

  waveform.update(lowerLimit, upperLimit);
  fourier.update(lowerLimit, upperLimit);
  spectrum.update(fourier.series);
  if (synth) synth.setPeriodicWave(fourier.series);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


const BWV = {
  846: BWV846,
  974: BWV974,
  1068: BWV1068,
  1007: BWV1007,
  1006: BWV1006
};
var currentlyPlaying;


for (number in BWV) {
  bind(document.getElementById(`bwv${number}-button`), BWV[number]);
}


function bind(button, midi) {
  button.playing = false;
  button.addEventListener("click", function(event) {
    if (!synth) {
      synth = new Synthesizer();
      synth.setPeriodicWave(fourier.series);
    }
    if (button.playing) {
      synth.stop();
      button.playing = false;
      button.style.backgroundSize = "";
      currentlyPlaying = undefined;
    }
    else {
      synth.stop();
      if (currentlyPlaying) {
        currentlyPlaying.playing = false;
        currentlyPlaying.style.backgroundSize = "";
      }
      window.setTimeout(function() {
        synth.play(midi, true);
      }, 25)
      button.playing = true;
      currentlyPlaying = button;
      button.style.backgroundSize = "11200%";
    }
  }, false);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


var overlayButton = document.getElementById("overlay-button");
var infoIcon = overlayButton.querySelector(".info-icon");
var line1 = overlayButton.querySelector(".x-line-1");
var line2 = overlayButton.querySelector(".x-line-2");
var overlay = document.getElementById("overlay");
var firstOpen = true;
var overlayOpen = false;


overlayButton.addEventListener("click", function(event) {
  if (overlayOpen) {
    overlayButton.style.borderWidth = "0";
    infoIcon.style.transform = "translate(-50%, -50%) scale(0, 1)";
    line1.style.transform = "translate(-50%, -50%) scale(1, 1) rotate(0)";
    line2.style.transform = "translate(-50%, -50%) scale(1, 1) rotate(0)";

    setTimeout(function () {
      infoIcon.parentElement.style.borderWidth = "";
      infoIcon.style.transform = "";
      line1.style.transform = "";
      line2.style.transform = "";
    }, parseFloat(window.getComputedStyle(line1).transitionDuration) * 1000);

    overlay.style.transform = "";
    overlay.style.transitionDuration = "0.5s";
    setTimeout(function () {overlay.style.transitionDuration = "";}, 25);
    overlayOpen = false;
  }
  else {
    infoIcon.parentElement.style.borderWidth = "0";
    infoIcon.style.transform = "translate(-50%, -50%) scale(0, 1)";
    line1.style.transform = "translate(-50%, -50%) scale(1, 1) rotate(0)";
    line2.style.transform = "translate(-50%, -50%) scale(1, 1) rotate(0)";

    setTimeout(function () {
      infoIcon.parentElement.style.borderWidth = "0";
      infoIcon.style.transform = "translate(-50%, -50%) scale(0, 1)";
      line1.style.transform = "translate(-50%, -50%) scale(1, 1) rotate(45deg)";
      line2.style.transform = "translate(-50%, -50%) scale(1, 1) rotate(-45deg)";
    }, parseFloat(window.getComputedStyle(line1).transitionDuration) * 1000);

    overlay.style.transform = "translateX(0) scaleX(1)";
    overlay.style.transitionDuration = "0.5s";
    setTimeout(function () {overlay.style.transitionDuration = "";}, 25);
    overlayOpen = true;
    if (firstOpen) {
      setTimeout(function () {
        navigation[0].click();
        content[0].style.transitionDuration = "0s, 1s";
      }, 250);
      firstOpen = false;
    }
  }
}, false);


var navigation = document.getElementsByClassName("nav-item");
var content = document.getElementsByClassName("content-item");


for (let i = 0, n = navigation.length; i < n; i++) {
  navigation[i].addEventListener("click", function(event) {
    content[i].parentElement.parentElement.style.scrollBehavior = "auto";
    content[i].parentElement.parentElement.style["-webkit-overflow-scrolling"] = "auto";
    content[i].parentElement.parentElement.scrollTop = 0;
    content[i].parentElement.parentElement.style.scrollBehavior = "";
    content[i].parentElement.parentElement.style["-webkit-overflow-scrolling"] = "";
    for (let j = 0; j < n; j++) {
      if (j == i) {
        navigation[j].firstElementChild.style.transform = "scaleX(1)";
        content[j].parentElement.style.zIndex = "1";
        content[j].style.height = "100%";
        content[j].style.opacity = "1";
        content[j].style.transform = "scaleY(1)";
        content[j].style.transformOrigin = "top";
        content[j].style.transitionDuration = "0s, 0.5s";
      }
      else {
        navigation[j].firstElementChild.style.transform = "";
        content[j].parentElement.style.zIndex = "";
        content[j].style.height = "";
        content[j].style.opacity = "";
        content[j].style.transform = "";
        content[j].style.transformOrigin = "";
        content[j].style.transitionDuration = "";
      }
    }
  }, false);
}
