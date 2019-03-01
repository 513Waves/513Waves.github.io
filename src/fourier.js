var FourierTransform = function() {
  const THIS = this;
  const N = 1024;
  let lowerLimit = 0;
  let upperLimit = 2 * Math.PI;


  THIS.series = {
    aCoefficients: [0, 1, 0],
    bCoefficients: [0, 0, 0]
  }


  THIS.f = function(x) {
    return Math.sin(x);
  }


  THIS.new = function(f) {
    if (f !== undefined) THIS.f = f;
    calculate();
  }


  THIS.update = function(ll, ul) {
    if (ll !== undefined) lowerLimit = ll;
    if (ul !== undefined) upperLimit = ul;
    calculate();
  }


  function calculate() {
    let waveformValues = [];
    let minY;
    let maxY;

    for (let i = 0; i < N; i++) {
      let y;
      try {
        y = THIS.f(lowerLimit + i * (upperLimit - lowerLimit) / N );
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

    if (minY === maxY) waveformValues.fill(0);
    else waveformValues = waveformValues.map(y => (y - minY) / (maxY - minY));

    THIS.series = fourierTransform(waveformValues);
  }


  let Complex = function(real, imaginary=0) {
    this.real = real;
    this.imag = imaginary;

    this.conj = function() {
      return new Complex(this.real, -this.imag);
    }

    this.inv = function() {
      if (this.real == 0 && this.imag == 0) {
        throw new Error("complex has no inverse");
      }
      else {
        let denominator = Math.pow(this.real, 2) + Math.pow(this.imag, 2);
        return new Complex(this.real / denominator, -this.imag / denominator);
      }
    }

    this.add = function(other) {
      return new Complex(this.real + other.real, this.imag + other.imag);
    }

    this.sub = function(other) {
      return new Complex(this.real - other.real, this.imag - other.imag);
    }

    this.mul = function(other) {
      let real = this.real * other.real - this.imag * other.imag;
      let imaginary = this.real * other.imag + this.imag * other.real;
      return new Complex(real, imaginary);
    }

    this.pow = function(exponent) {
      if (!Number.isInteger(exponent)) {
        throw new Error("exponent must be an integer");
      }
      else {
        let result = new Complex(1, 0);
        if (exponent == 0) {
          return result;
        }
        else if (exponent > 0) {
          for (let i = 0; i < exponent; i++) {
            result = result.mul(this);
          }
          return result;
        }
        else if (exponent < 0) {
          for (let i = 0; i > exponent; i--) {
            result = result.mul(this);
          }
          return result.inv();
        }
      }
    }
  }


  function getOmega(n) {
    let real = Math.cos(2 * Math.PI / n);
    let imaginary = Math.sin(2 * Math.PI / n);
    return new Complex(real, imaginary);
  }


  function fourierTransform(y) {
    function reverseBits(i, bits) {
      let b = i.toString(2);
      while (b.length < bits) {
        b = "0" + b;
      }
      return parseInt(b.split("").reverse().join(""), 2);
    }

    let n = y.length;
    if (n & (n-1)) {
      throw new Error("n must be power of 2");
    }

    for (let i = 0; i < y.length; i++) {
      y[i] = new Complex(y[i]);
    }

    let steps = (n-1).toString(2).length;
    let omega = getOmega(n);
    let omegas = [];
    for (let i = 0; i < Math.floor(n/2); i++) {
      omegas.push(omega.pow(-i));
    }

    for (let i = 0; i < steps; i++) {
      let c = Array(n);

      let divisions = 2 ** i;
      let batch = Math.floor(n / divisions);
      let half = Math.floor(batch / 2);

      for (let j = 0; j < divisions; j++) {
        for (let k = 0; k < half; k++) {
          let index = k + j * batch;
          let y0 = y[index];
          let y1 = y[index + half];
          c[index] = y0.add(y1);
          c[index + half] = omegas[divisions * k].mul(y0.sub(y1));
        }
      }

      y = [...c];
    }

    let c = [];
    for (let i = 0; i < n; i++) {
      let j = reverseBits(i, (n-1).toString(2).length);
      c.push(y[j]);
    }

    let a = [(c[0]).real];
    let b = [0];

    for (let i = 1; i < Math.floor(n / 2); i++) {
      let c0 = c[i];
      let c1 = c[n-i];
      a.push((c0.add(c1)).real);
      b.push((c1.sub(c0)).imag);
    }

    a.push(c[Math.floor(n / 2)].real);
    b.push(0);

    return {
      aCoefficients: a.map(x => x / n),
      bCoefficients: b.map(x => x / n)
    }
  }
}
