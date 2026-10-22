// Run with:  node logic.test.js
const assert = require('node:assert');
const L = require('./logic.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('ok   ' + name);
  } catch (err) {
    console.error('FAIL ' + name + '\n     ' + err.message);
    process.exitCode = 1;
  }
}

const outs = (table) => table.map((r) => r.out);

test('basic gate truth tables', () => {
  assert.deepStrictEqual(outs(L.gateTable('AND')), [0, 0, 0, 1]);
  assert.deepStrictEqual(outs(L.gateTable('OR')), [0, 1, 1, 1]);
  assert.deepStrictEqual(outs(L.gateTable('NOT')), [1, 0]);
});

test('derived gate truth tables', () => {
  assert.deepStrictEqual(outs(L.gateTable('NAND')), [1, 1, 1, 0]);
  assert.deepStrictEqual(outs(L.gateTable('NOR')), [1, 0, 0, 0]);
  assert.deepStrictEqual(outs(L.gateTable('XOR')), [0, 1, 1, 0]);
  assert.deepStrictEqual(outs(L.gateTable('XNOR')), [1, 0, 0, 1]);
  assert.deepStrictEqual(outs(L.gateTable('BUFFER')), [0, 1]);
});

test('every gate in GATE_ORDER exists', () => {
  L.GATE_ORDER.forEach((name) => assert.ok(L.GATES[name], name));
  assert.strictEqual(L.GATE_ORDER.length, Object.keys(L.GATES).length);
});

test('XOR expression from the lecture, F = X\'Y + XY\'', () => {
  const { names, rows } = L.expressionTable('(not X and Y) or (X and not Y)');
  assert.deepStrictEqual(names, ['X', 'Y']);
  assert.deepStrictEqual(outs(rows), [0, 1, 1, 0]);
});

test('caret is XOR', () => {
  assert.deepStrictEqual(outs(L.expressionTable('A ^ B').rows), [0, 1, 1, 0]);
});

test('operator precedence matches the Python version', () => {
  assert.deepStrictEqual(outs(L.expressionTable('not A and B').rows), [0, 1, 0, 0]);
  assert.deepStrictEqual(outs(L.expressionTable('A or B and C').rows), [0, 0, 0, 1, 1, 1, 1, 1]);
  assert.deepStrictEqual(outs(L.expressionTable('A ^ B and C').rows), [0, 0, 0, 1, 0, 1, 0, 0]);
});

test('keywords are case-insensitive and constants work', () => {
  assert.deepStrictEqual(outs(L.expressionTable('A AND NOT B').rows), [0, 0, 1, 0]);
  assert.deepStrictEqual(outs(L.expressionTable('A or 1').rows), [1, 1]);
});

test('bad expressions are rejected with a message', () => {
  const bad = ["__import__('os')", 'A and 5', '', '   ', 'A and', '(A or B', 'A B', '1', 'A + B', 'A or )'];
  bad.forEach((src) => {
    assert.throws(() => L.expressionTable(src), Error, JSON.stringify(src));
  });
});

test('too many variables is rejected', () => {
  assert.throws(() => L.expressionTable('A and B and C and D and E and F and G'), /at most 6/);
  assert.strictEqual(L.expressionTable('A and B and C and D and E and F').rows.length, 64);
});

test('CMOS NOT and NAND match the ideal gates', () => {
  L.cmosTable('NOT').forEach((r) => assert.strictEqual(r.out, L.GATES.NOT.fn(...r.inputs)));
  L.cmosTable('NAND').forEach((r) => assert.strictEqual(r.out, L.GATES.NAND.fn(...r.inputs)));
});

test('CMOS NAND transistor states match the lecture table', () => {
  const t = L.cmosTable('NAND');
  assert.deepStrictEqual(t[0].states, { P1: true, P2: true, N1: false, N2: false }); // 00
  assert.deepStrictEqual(t[1].states, { P1: true, P2: false, N1: false, N2: true }); // 01
  assert.deepStrictEqual(t[2].states, { P1: false, P2: true, N1: true, N2: false }); // 10
  assert.deepStrictEqual(t[3].states, { P1: false, P2: false, N1: true, N2: true }); // 11
});

test('exactly one CMOS network conducts for every input', () => {
  ['NOT', 'NAND'].forEach((kind) =>
    L.cmosTable(kind).forEach((r) => assert.notStrictEqual(r.pullUp, r.pullDown)));
});

test('NAND and NOR are universal', () => {
  const checks = L.universalChecks();
  assert.strictEqual(checks.length, 6);
  checks.forEach((c) => assert.ok(c.ok, c.label + ' from ' + c.from));
});

console.log('\n' + passed + ' tests passed' + (process.exitCode ? ', some failed' : ''));
