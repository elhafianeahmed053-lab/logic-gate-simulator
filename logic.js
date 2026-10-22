/*
 * Logic gate simulator: pure logic (no DOM), shared by the web page and the tests.
 * Mirrors the Python version: gates, a safe Boolean expression parser,
 * transistor-level CMOS NOT/NAND, and the universal-gate constructions.
 */
(function (root) {
  'use strict';

  /* ---------- Gates ---------- */

  const GATES = {
    AND: {
      arity: 2,
      fn: (a, b) => a & b,
      formula: 'A · B',
      rule: 'Output is 1 only if all inputs are 1.',
    },
    OR: {
      arity: 2,
      fn: (a, b) => a | b,
      formula: 'A + B',
      rule: 'Output is 1 if at least one input is 1.',
    },
    NOT: {
      arity: 1,
      fn: (a) => 1 - a,
      formula: "A'",
      rule: 'Output is the opposite of the input.',
    },
    NAND: {
      arity: 2,
      fn: (a, b) => 1 - (a & b),
      formula: "(A · B)'",
      rule: 'AND followed by NOT. Output is 0 only when both inputs are 1.',
    },
    NOR: {
      arity: 2,
      fn: (a, b) => 1 - (a | b),
      formula: "(A + B)'",
      rule: 'OR followed by NOT. Output is 1 only when both inputs are 0.',
    },
    XOR: {
      arity: 2,
      fn: (a, b) => a ^ b,
      formula: "A ⊕ B = A'B + AB'",
      rule: 'Output is 1 only when the inputs are different.',
    },
    XNOR: {
      arity: 2,
      fn: (a, b) => 1 - (a ^ b),
      formula: "AB + A'B'",
      rule: 'XOR followed by NOT. Output is 1 only when the inputs are the same.',
    },
    BUFFER: {
      arity: 1,
      fn: (a) => a,
      formula: 'A',
      rule: 'Output equals the input. It isolates circuits and drives heavy loads.',
    },
  };

  const GATE_ORDER = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'];

  /** All input combinations for n bits, first input is the most significant. */
  function combos(n) {
    const rows = [];
    for (let i = 0; i < 1 << n; i++) {
      const row = [];
      for (let b = n - 1; b >= 0; b--) row.push((i >> b) & 1);
      rows.push(row);
    }
    return rows;
  }

  function gateTable(name) {
    const gate = GATES[name];
    if (!gate) throw new Error('Unknown gate: ' + name);
    return combos(gate.arity).map((inputs) => ({ inputs, out: gate.fn(...inputs) }));
  }

  /* ---------- Boolean expressions (safe parser, no eval) ----------
   * Grammar, loosest to tightest binding (same order as Python):
   *   or  <  and  <  not  <  ^ (XOR)  <  variable | 0 | 1 | ( ... )
   */

  function tokenize(src) {
    const out = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '(' || ch === ')' || ch === '^') { out.push({ t: ch }); i++; continue; }
      if (ch === '0' || ch === '1') { out.push({ t: 'const', v: Number(ch) }); i++; continue; }
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      if (m) {
        const word = m[0];
        const lower = word.toLowerCase();
        if (lower === 'and' || lower === 'or' || lower === 'not') out.push({ t: lower });
        else out.push({ t: 'var', n: word });
        i += word.length;
        continue;
      }
      throw new Error('Unexpected character "' + ch + '". Use and, or, not, ^, brackets, 0, 1 and variable names.');
    }
    return out;
  }

  function describe(tok) {
    return tok.t === 'var' ? tok.n : tok.t === 'const' ? String(tok.v) : tok.t;
  }

  function parse(src) {
    const toks = tokenize(src);
    if (!toks.length) throw new Error('Type an expression to see its truth table.');
    let p = 0;
    const peek = () => (toks[p] ? toks[p].t : null);
    const next = () => toks[p++];

    function parseOr() {
      let left = parseAnd();
      while (peek() === 'or') { next(); left = { t: 'or', l: left, r: parseAnd() }; }
      return left;
    }
    function parseAnd() {
      let left = parseNot();
      while (peek() === 'and') { next(); left = { t: 'and', l: left, r: parseNot() }; }
      return left;
    }
    function parseNot() {
      if (peek() === 'not') { next(); return { t: 'not', x: parseNot() }; }
      return parseXor();
    }
    function parseXor() {
      let left = parseAtom();
      while (peek() === '^') { next(); left = { t: 'xor', l: left, r: parseAtom() }; }
      return left;
    }
    function parseAtom() {
      const tok = next();
      if (!tok) throw new Error('The expression ends too early. Add an input after the last operator.');
      if (tok.t === 'var') return { t: 'var', n: tok.n };
      if (tok.t === 'const') return { t: 'const', v: tok.v };
      if (tok.t === '(') {
        const inner = parseOr();
        if (peek() !== ')') throw new Error('A bracket is not closed. Add ")".');
        next();
        return inner;
      }
      throw new Error('Unexpected "' + describe(tok) + '" here. Expected an input or a bracket.');
    }

    const ast = parseOr();
    if (p < toks.length) throw new Error('Unexpected "' + describe(toks[p]) + '". Join inputs with and, or or ^.');
    return ast;
  }

  function variables(ast) {
    const names = new Set();
    (function walk(n) {
      if (n.t === 'var') names.add(n.n);
      else if (n.t === 'not') walk(n.x);
      else if (n.l) { walk(n.l); walk(n.r); }
    })(ast);
    return Array.from(names).sort();
  }

  function evaluate(n, env) {
    switch (n.t) {
      case 'var': return env[n.n];
      case 'const': return n.v;
      case 'not': return 1 - evaluate(n.x, env);
      case 'and': return evaluate(n.l, env) & evaluate(n.r, env);
      case 'or': return evaluate(n.l, env) | evaluate(n.r, env);
      case 'xor': return evaluate(n.l, env) ^ evaluate(n.r, env);
      default: throw new Error('Unknown node: ' + n.t);
    }
  }

  const MAX_VARIABLES = 6;

  function expressionTable(src) {
    const ast = parse(src);
    const names = variables(ast);
    if (!names.length) throw new Error('Use at least one variable, for example A or X.');
    if (names.length > MAX_VARIABLES) {
      throw new Error('Use at most ' + MAX_VARIABLES + ' different variables. This one has ' + names.length + '.');
    }
    const rows = combos(names.length).map((inputs) => {
      const env = {};
      names.forEach((name, i) => { env[name] = inputs[i]; });
      return { inputs, out: evaluate(ast, env) };
    });
    return { names, rows };
  }

  /* ---------- CMOS (transistors as switches) ----------
   * nMOS is ON when its gate is high (1); pMOS is ON when its gate is low (0).
   * A pull-up network of pMOS connects the output to 3 V, a pull-down network
   * of nMOS connects it to 0 V. Exactly one network should conduct.
   */

  const pmosOn = (g) => g === 0;
  const nmosOn = (g) => g === 1;

  function resolve(pullUp, pullDown) {
    if (pullUp && !pullDown) return 1;
    if (pullDown && !pullUp) return 0;
    throw new Error(pullUp ? 'Short circuit: both networks conduct.' : 'Floating output: no network conducts.');
  }

  function cmosNot(a) {
    const P = pmosOn(a);
    const N = nmosOn(a);
    return { out: resolve(P, N), pullUp: P, pullDown: N, states: { P, N } };
  }

  function cmosNand(a, b) {
    const P1 = pmosOn(a);
    const P2 = pmosOn(b);
    const N1 = nmosOn(a);
    const N2 = nmosOn(b);
    const pullUp = P1 || P2; // parallel: either one pulls the output up
    const pullDown = N1 && N2; // series: both must be ON to pull it down
    return { out: resolve(pullUp, pullDown), pullUp, pullDown, states: { P1, P2, N1, N2 } };
  }

  const CMOS = {
    NOT: { arity: 1, names: ['P', 'N'], run: cmosNot },
    NAND: { arity: 2, names: ['P1', 'P2', 'N1', 'N2'], run: cmosNand },
  };

  function cmosTable(kind) {
    const circuit = CMOS[kind];
    if (!circuit) throw new Error('Unknown CMOS circuit: ' + kind);
    return combos(circuit.arity).map((inputs) => ({ inputs, ...circuit.run(...inputs) }));
  }

  /* ---------- Universal gates ---------- */

  const nand = (a, b) => 1 - (a & b);
  const nor = (a, b) => 1 - (a | b);

  const UNIVERSAL = [
    { label: 'NOT', from: 'NAND', how: 'NAND(A, A)', arity: 1,
      build: (a) => nand(a, a), ref: (a) => 1 - a },
    { label: 'AND', from: 'NAND', how: 'NAND(NAND(A, B), NAND(A, B))', arity: 2,
      build: (a, b) => { const n = nand(a, b); return nand(n, n); }, ref: (a, b) => a & b },
    { label: 'OR', from: 'NAND', how: 'NAND(NAND(A, A), NAND(B, B))', arity: 2,
      build: (a, b) => nand(nand(a, a), nand(b, b)), ref: (a, b) => a | b },
    { label: 'NOT', from: 'NOR', how: 'NOR(A, A)', arity: 1,
      build: (a) => nor(a, a), ref: (a) => 1 - a },
    { label: 'OR', from: 'NOR', how: 'NOR(NOR(A, B), NOR(A, B))', arity: 2,
      build: (a, b) => { const n = nor(a, b); return nor(n, n); }, ref: (a, b) => a | b },
    { label: 'AND', from: 'NOR', how: 'NOR(NOR(A, A), NOR(B, B))', arity: 2,
      build: (a, b) => nor(nor(a, a), nor(b, b)), ref: (a, b) => a & b },
  ];

  function universalChecks() {
    return UNIVERSAL.map((c) => ({
      label: c.label,
      from: c.from,
      how: c.how,
      ok: combos(c.arity).every((row) => c.build(...row) === c.ref(...row)),
    }));
  }

  const api = {
    GATES, GATE_ORDER, combos, gateTable,
    parse, expressionTable, MAX_VARIABLES,
    CMOS, cmosNot, cmosNand, cmosTable,
    universalChecks,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Logic = api;
})(typeof window !== 'undefined' ? window : globalThis);
