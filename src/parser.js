var MathParser = function() {
  const THIS = this;

  let string;
  let lexemes;
  let conditions;
  let index;
  let x;

  const CONSTANTS = {
		e:      Math.E,
		pi:     Math.PI,
		tau:    Math.PI * 2,
		phi:    (1 + Math.sqrt(5)) / 2
		}

  const FUNCTIONS = {
    abs:    Math.abs,
    round:  Math.round,
    trunc:  Math.trunc,
    floor:  Math.floor,
    ceil:   Math.ceil,
    sqrt:   Math.sqrt,
    cbrt:   Math.cbrt,
    ln:     Math.log,
    log:    Math.log10,
    sin:    Math.sin,
    asin:   Math.asin,
    sinh:   Math.sinh,
    asinh:  Math.asinh,
    cos:    Math.cos,
    acos:   Math.acos,
    cosh:   Math.cosh,
    acosh:  Math.acosh,
    tan:    Math.tan,
    atan:   Math.atan,
    tanh:   Math.tanh,
    atanh:  Math.atanh
  }

  const TOKENS = [
		["T_SPC", / +/y],
		["T_FLT", /\d*\.\d+(?=\s*($|[-+*/^<=!>){}]))/y],
		["T_INT", /\d+(?=\s*($|[-+*/^<=!>){}]))/y],
		["T_FNC", RegExp("(abs|round|trunc|floor|ceil|sqrt|cbrt|" +
                     "log(\\d*\\.\\d+|[1-9]\\d*)|log|ln|" +
                     "sinh|asinh|cosh|acosh|tanh|atanh|" +
                     "sin|asin|cos|acos|tan|atan)(?=\\s*\\()", "y")],
    ["T_CST", /(e|pi|tau|phi)(?=\s*($|[-+*/^<=!>){}]))/y],
		["T_VAR", /x(?=\s*($|[-+*/^<=!>){}]))/y],
		["T_EXP", /\*\*(?=\s*(\w|\.\d|[-(]))/y],
		["T_EXP", /\^(?=\s*(\w|\.\d|[-(]))/y],
		["T_MUL", /\*(?=\s*(\w|\.\d|[-(]))/y],
		["T_MUL", /\/(?=\s*(\w|\.\d|[-(]))/y],
		["T_ADD", /\+(?=\s*(\w|\.\d|[-(]))/y],
		["T_ADD", /-(?=\s*(\w|\.\d|[-(]))/y],
		["T_LPR", /\((?=\s*(\w|\.\d|[-(]))/y],
		["T_RPR", /\)(?=\s*($|[-+*/^<=!>){}]))/y],
		["T_LGC", /([<=>][=]?|!=)(?=\s*(\w|\.\d|[-(]))/y],
		["T_LCB", /{(?=\s*(\w|\.\d|[-(]))/y],
		["T_RCB", /}(?=\s*(\w|\.\d|[-(]))/y],
  ]


  THIS.tokenize = function(inputString) {
    string = inputString;
    lexemes = [];
    conditions = [];
    getLexemes();
  }


  THIS.evaluate = function(xValue = undefined) {
    x = xValue;
    if (lexemes.length == 0) {
			throw new Error("string must be tokenized before evaluating");
    }
    else if (conditions.length > 0) {
      for (let i = conditions.length - 1; i >= 0; i--) {
        index = conditions[i] + 1;
				if (parseCurlyBrackets()) {
					index++;
					return parseAddition();
        }
      }
      if (conditions[0] != 0) {
				index = 0;
				return parseAddition();
      }
      else {
        return undefined;
      }
    }
    else {
      index = 0;
      return parseAddition();
    }
  }


  function getLexemes() {
    let i = 0;
    let parentheses = []
    let curlyBrackets = []

    if (string.length == 0) {
      throw new SyntaxError();
    }

    else {
      let regex = /\s*(?=$|[+*/^<=!>)}])/y;
      regex.lastIndex = 0;
      let match = regex.exec(string);
      if (match) {
        throw new SyntaxError();
      }
    }

    while (i < string.length) {
      let match = null;
      for (let j = 0, l = TOKENS.length; j < l; j++) {
        let regex = TOKENS[j][1];
        regex.lastIndex = i;
        match = regex.exec(string);
        if (match) {
          i = regex.lastIndex;
          let token = TOKENS[j][0];

          switch (token) {
            case "T_SPC":
              break;
            case "T_INT":
            case "T_FLT":
              lexemes.push(["T_NUM", Number(match[0])]);
              break;
            case "T_CST":
              lexemes.push(["T_NUM", CONSTANTS[match[0]]]);
              break;
            case "T_VAR":
              lexemes.push(["T_VAR", match[0]]);
              break;
            case "T_FNC":
              let func = match[0];
              if (func.slice(0, 3) === "log" && func.length > 3) {
                lexemes.push([token, func]);
              }
              else {
                lexemes.push([token, FUNCTIONS[func]]);
              }
              break;
            case "T_LPR":
              parentheses.push(i);
              lexemes.push([token, match[0]]);
              break;
            case "T_RPR":
              if (parentheses.length <= 0) {
                throw new SyntaxError();
              }
              else {
                parentheses.pop();
                lexemes.push([token, match[0]]);
              }
              break;
            case "T_LCB":
              if (curlyBrackets.length > 0) {
                throw new SyntaxError();
              }
              else {
                curlyBrackets.push(i);
                conditions.push(lexemes.length);
                lexemes.push([token, match[0]]);
              }
              break;
            case "T_RCB":
              if (curlyBrackets.length <= 0) {
                throw new SyntaxError();
              }
              else {
                curlyBrackets.pop();
                lexemes.push([token, match[0]]);
              }
              break;
            default:
              lexemes.push([token, match[0]]);
          }
          break;
        }
      }
      if (!match) {
        throw new SyntaxError();
      }
    }

    if (parentheses.length != 0) {
      throw new SyntaxError();
    }
    if (curlyBrackets.length != 0) {
      throw new SyntaxError();
    }
  }


  function hasNext(self) {
		return index < lexemes.length;
  }


	function nextToken() {
		return lexemes[index][0];
  }


	function nextLexeme() {
		return lexemes[index][1];
  }


  function parseAddition() {
    let result = parseMultiplication();
    while (hasNext() && nextToken() === "T_ADD") {
      if (nextLexeme() === "+") {
        index++;
        result += parseMultiplication();
      }
      else if (nextLexeme() === "-") {
        index++;
        result -= parseMultiplication();
      }
    }
    return result;
  }


  function parseMultiplication() {
    let result = parseExponentiation();
    while (hasNext() && nextToken() === "T_MUL") {
      if (nextLexeme() === "*") {
        index++;
        result *= parseExponentiation();
      }
      else if (nextLexeme() === "/") {
        index++;
        let denominator = parseExponentiation();
        if (denominator == 0) {
          throw new Error ("cannot divide by 0");
        }
        else {
          result *= 1 / denominator;
        }
      }
    }
    return result;
  }


  function parseExponentiation() {
    let result = parseNegative();
    if (hasNext() && (nextLexeme() === "^" || nextLexeme() === "**")) {
      index++;
      let exponent = parseExponentiation();
      if (result == 0 && exponent < 0) {
        throw new Error ("cannot exponentiate 0 with number < 0");
      }
      else if (result <= 0 && !Number.isInteger(exponent)) {
        throw new Error ("cannot exponentiate numbers <= 0 with decimals");
      }
      else {
        return Math.pow(result, exponent);
      }
    }
    else {
      return result;
    }
  }


  function parseNegative() {
  	let sign = 1;
  	while (nextLexeme() === "-") {
      sign *= -1;
      index++;
    }
  	return sign * parseFunction();
  }


  function parseFunction() {
		if (nextToken() === "T_FNC") {
			let func = nextLexeme();
			index++;
			if (func == Math.sqrt) {
				let radicand = parseParentheses();
				if (radicand < 0) {
					throw new Error("cannot compute square root of number < 0");
        }
				else {
				 return func(radicand);
       }
     }
			else if (func == Math.log || func == Math.log10) {
				let number = parseParentheses();
				if (number <= 0) {
					throw new Error("cannot compute logarithm of number <= 0");
        }
				else {
					return func(number);
        }
      }
			else if (typeof func == "string") {
        let base = Number(func.slice(3));
				let number = parseParentheses();
        if (base === 1) {
          throw new Error("cannot compute logarithm with base 1");
        }
				else if (number <= 0) {
					throw new Error("cannot compute logarithm of number <= 0");
        }
				else {
          return Math.log(number) / Math.log(base);
        }
      }
      else if (func == Math.asin || func == Math.acos) {
        let number = parseParentheses();
        if (number < -1 || number > 1) {
          if (func == Math.asin) {
            throw new Error("cannot compute asin of number outside [-1, 1]");
          }
          else if (func == Math.acos) {
            throw new Error("cannot compute acos of number outside [-1, 1]");
          }
        }
        else {
          return func(number);
        }
      }
      else if (func == Math.acosh) {
        let number = parseParentheses();
        if (number < 1) {
          throw new Error("cannot compute acosh of number < 1");
        }
        else {
          return func(number);
        }
      }
      else if (func == Math.atanh) {
        let number = parseParentheses();
        if (number <= -1 || number >= 1) {
          throw new Error("cannot compute atanh of number outside (-1, 1)");
        }
        else {
          return func(number);
        }
      }
			else {
				return func(parseParentheses());
      }
    }
		else {
			return parseParentheses();
    }
  }


  function parseParentheses() {
		if (nextLexeme() === "(") {
			index++;
      let inner = parseAddition();
			if (nextLexeme() != ")") {
				throw new SyntaxError();
      }
      else {
        index++;
        return inner;
      }
    }
		else {
			return parseVariable();
    }
  }


  function parseVariable() {
		if (nextToken() === "T_VAR") {
      index++;
      return x;
    }
		else {
			return parseNumber();
    }
  }


  function parseNumber() {
		if (nextToken() === "T_NUM") {
			let number = nextLexeme();
			index++;
			return number;
    }
		else {
			throw new SyntaxError();
    }
  }


  function parseCurlyBrackets() {
		let term0 = parseAddition();
		if (hasNext() && nextToken() != "T_LGC") {
			throw new SyntaxError();
    }
		while (hasNext() && nextToken() === "T_LGC") {
			let operator = nextLexeme();
			index++;
      let term1 = parseAddition();
      switch (operator) {
        case "<":
          if (term0 >= term1) {
            return false;
          }
          term0 = term1;
          break;
        case "<=":
          if (term0 > term1) {
            return false;
          }
          term0 = term1;
          break;
        case "=":
        case "==":
  				if (term0 != term1) {
  					return false;
          }
					term0 = term1;
          break;
        case "!=":
          if (term0 == term1) {
            return false;
          }
          term0 = term1;
          break;
        case ">=":
  				if (term0 < term1) {
  					return false;
          }
  				term0 = term1;
          break;
        case ">":
          if (term0 <= term1) {
            return false;
          }
          term0 = term1;
          break;
      }
    }
		return true;
  }
}
