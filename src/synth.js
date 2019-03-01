var Synthesizer = function() {
  const THIS = this;

  let notes = {};
  let startTime;
  let stop = false;
  let schedulingTimeout;
  let interval = 50;
  let lookAhead = 0.2;
  let loopingTimeout;


  let audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioContext.sampleRate = 44100;

  let master = audioContext.createGain();
  master.gain.setValueAtTime(0.75, audioContext.currentTime);
  master.connect(audioContext.destination);


  let envelope = {
    attack: 50,
    decay: 250,
    sustain: 0.8,
    release: 1000
  };


  let periodicWave = audioContext.createPeriodicWave(
    new Float32Array([0, 1, 0]),
    new Float32Array([0, 0, 0]),
    {disableNormalization: false});


  let Note = function(frequency, pan=0) {
    let oscillator;
    let gainNode;
    let panNode;

    this.setPeriodicWave = function(periodicWave) {
      if (oscillator) oscillator.setPeriodicWave(periodicWave);
    }

    this.on = function(time, velocity) {
      let t = startTime + time;
      let a = envelope.attack / 1000;
      let p = Math.pow(10, (velocity / 127) - 1) - 0.1;
      let d = envelope.decay / 1000;
      let s = p * envelope.sustain;

      if (!oscillator) {
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        if (audioContext.createStereoPanner) {
          panNode = audioContext.createStereoPanner();
        }

        oscillator.setPeriodicWave(periodicWave);
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.connect(gainNode);

        if (panNode) {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          panNode.pan.setValueAtTime(pan, audioContext.currentTime);
          gainNode.connect(panNode);
          panNode.connect(master);
        }
        else {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.connect(master);
        }

        oscillator.start(t);
      }

      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(p, t + a);
      gainNode.gain.setTargetAtTime(s, t + a, d / 5);
    }

    this.off = function(time) {
      let t = startTime + time;
      let r = envelope.release / 1000;

      if (oscillator) {
        gainNode.gain.cancelScheduledValues(t);
        gainNode.gain.setTargetAtTime(0, t, r / 5);
        gainNode.gain.setValueAtTime(0, t + r);
        oscillator.stop(t + r);
        oscillator = undefined;
      }
    }
  }


  THIS.setPeriodicWave = function(fourierSeries) {
    periodicWave = audioContext.createPeriodicWave(
      new Float32Array(fourierSeries.aCoefficients),
      new Float32Array(fourierSeries.bCoefficients),
      {disableNormalization: false});
    for (let note in notes) {
      notes[note].setPeriodicWave(periodicWave);
    }
  }


  THIS.play = function(midi, loop=false) {
    let i = 0;
    let timePerTick = 60 / (midi.tempo * midi.tpqn);
    startTime = audioContext.currentTime;
    stop = false;

    function scheduleNextAudioEvent() {
      while (!stop && i < midi.track.length && midi.track[i][0] * timePerTick
        < audioContext.currentTime - startTime + lookAhead) {
        let time = midi.track[i][0] * timePerTick;
        let note = midi.track[i][2];

        if (midi.track[i][1] === "On") {
          if (!(note in notes)) {
            let frequency = Math.pow(2, (note - 69) / 12) * 440;
            let pan = (note - 21) / (108 - 21) - 0.5;
            notes[note] = new Note(frequency, pan);
          }
          notes[note].on(time, midi.track[i][3]);
        }
        else if (midi.track[i][1] === "Off") {
          notes[note].off(time);
        }

        i++;
      }

      if (!stop && i < midi.track.length) {
        schedulingTimeout = window.setTimeout(scheduleNextAudioEvent, interval);
      }
    }

    schedulingTimeout = window.setTimeout(scheduleNextAudioEvent, interval);

    if (!stop && loop) {
      loopingTimeout = window.setTimeout(function() {
        THIS.play(midi, true);
      }, (midi.length * timePerTick - audioContext.currentTime + startTime) * 1000);
    }

    document.addEventListener("visibilitychange", adjustScheduling, false);
  }


  THIS.stop = function() {
    for (let note in notes) {
      notes[note].off(envelope.release / 2500);
    }

    stop = true;
    notes = {};
    clearTimeout(schedulingTimeout);
    clearTimeout(loopingTimeout);

    document.removeEventListener("visibilitychange", adjustScheduling, false);
  }


  function adjustScheduling(event) {
    if (document.visibilityState === "visible") {
      interval = 50;
      lookAhead = 0.2;
    }
    else {
      interval = 1500;
      lookAhead = 3;
    }
  }
}
