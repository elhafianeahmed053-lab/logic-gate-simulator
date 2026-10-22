/* Logic gate simulator: page behaviour. All logic lives in logic.js. */
(function () {
  'use strict';

  const L = window.Logic;
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  const $ = (selector, root) => (root || document).querySelector(selector);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rowIndex = (inputs) => inputs.reduce((n, b) => n * 2 + b, 0);

  /* ---------- Shared: truth table markup ---------- */

  function tableHTML(names, rows, outName) {
    const head = names.map((n) => '<th scope="col">' + esc(n) + '</th>').join('') +
      '<th scope="col" class="out">' + esc(outName) + '</th>';
    const body = rows.map((r) =>
      '<tr>' + r.inputs.map((v) => '<td>' + v + '</td>').join('') +
      '<td class="out ' + (r.out ? 'one' : 'zero') + '">' + r.out + '</td></tr>').join('');
    return '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody>';
  }

  function markCurrent(table, index) {
    Array.from(table.tBodies[0].rows).forEach((tr, i) => {
      tr.classList.toggle('current', i === index);
      if (i === index) tr.setAttribute('aria-current', 'true');
      else tr.removeAttribute('aria-current');
    });
  }

  function buildPicker(container, name, values, selected, onChange) {
    container.insertAdjacentHTML('beforeend', values.map((v) =>
      '<label class="seg"><input type="radio" name="' + name + '" value="' + v + '"' +
      (v === selected ? ' checked' : '') + '><span>' + v + '</span></label>').join(''));
    container.addEventListener('change', (e) => {
      if (e.target.name === name) onChange(e.target.value);
    });
  }

  /* ---------- 1. Gate playground ---------- */

  // Body outlines, drawn in a 400 x 180 box. inEnd is where input wires stop,
  // tip is the right-most point of the body.
  const OR_PATH = 'M140 40Q200 40 240 90Q200 140 140 140Q172 90 140 40Z';
  const AND_PATH = 'M140 40H190A50 50 0 0 1 190 140H140Z';
  const SHAPES = {
    AND: { path: AND_PATH, inEnd: 140, tip: 240, bubble: false },
    NAND: { path: AND_PATH, inEnd: 140, tip: 240, bubble: true },
    OR: { path: OR_PATH, inEnd: 156, tip: 240, bubble: false },
    NOR: { path: OR_PATH, inEnd: 156, tip: 240, bubble: true },
    XOR: { path: OR_PATH, extra: 'M128 40Q160 90 128 140', inEnd: 139, tip: 240, bubble: false },
    XNOR: { path: OR_PATH, extra: 'M128 40Q160 90 128 140', inEnd: 139, tip: 240, bubble: true },
    NOT: { path: 'M150 50V130L230 90Z', inEnd: 150, tip: 230, bubble: true },
    BUFFER: { path: 'M150 50V130L230 90Z', inEnd: 150, tip: 230, bubble: false },
  };

  const stage = { gate: 'XOR', inputs: [0, 0] };
  const gateSvg = $('#gate-svg');
  const stageTable = $('#stage-table');

  function switchMarkup(i, y) {
    return '<g class="switch" role="switch" tabindex="0" data-switch="' + i + '" aria-checked="false" aria-label="Input ' + LETTERS[i] + '">' +
      '<rect class="hit" x="0" y="' + (y - 22) + '" width="96" height="44"/>' +
      '<rect class="ring" x="26" y="' + (y - 21) + '" width="68" height="42" rx="21"/>' +
      '<rect class="pill" x="30" y="' + (y - 17) + '" width="60" height="34" rx="17"/>' +
      '<circle class="knob" cx="47" cy="' + y + '" r="13"/>' +
      '<text class="digit" x="72" y="' + (y + 6) + '" text-anchor="middle">0</text>' +
      '<text class="sw-name" x="6" y="' + (y + 6) + '">' + LETTERS[i] + '</text></g>';
  }

  function buildGate() {
    const gate = L.GATES[stage.gate];
    const shape = SHAPES[stage.gate];
    const ys = gate.arity === 1 ? [90] : [62, 118];
    const outStart = shape.bubble ? shape.tip + 12 : shape.tip;

    let svg = '';
    ys.forEach((y, i) => {
      svg += '<line class="wire" data-wire="in' + i + '" x1="90" y1="' + y + '" x2="' + shape.inEnd + '" y2="' + y + '"/>';
    });
    svg += '<line class="wire" data-wire="out" x1="' + outStart + '" y1="90" x2="340" y2="90"/>';
    svg += '<path class="gbody" d="' + shape.path + '"/>';
    if (shape.extra) svg += '<path class="gbody gextra" d="' + shape.extra + '"/>';
    if (shape.bubble) svg += '<circle class="gbody" cx="' + (shape.tip + 6) + '" cy="90" r="6"/>';
    ys.forEach((y, i) => { svg += switchMarkup(i, y); });
    svg += '<circle class="lamp" cx="364" cy="90" r="24"/>' +
      '<text class="lamp-digit" x="364" y="98" text-anchor="middle">0</text>' +
      '<text class="out-name" x="364" y="136" text-anchor="middle">Y</text>';

    gateSvg.innerHTML = svg;
    gateSvg.setAttribute('aria-label', stage.gate + ' gate diagram');

    const names = LETTERS.slice(0, gate.arity);
    stageTable.innerHTML = tableHTML(names, L.gateTable(stage.gate), 'Y');
    $('#stage-formula').textContent = 'Y = ' + gate.formula;
    $('#stage-rule').textContent = gate.rule;
    $('#stage-py').textContent = 'python main.py gate ' + stage.gate.toLowerCase();
    updateGate();
  }

  function updateGate() {
    const gate = L.GATES[stage.gate];
    const out = gate.fn(...stage.inputs);

    gateSvg.querySelectorAll('[data-switch]').forEach((el) => {
      const i = Number(el.dataset.switch);
      const on = stage.inputs[i] === 1;
      el.classList.toggle('on', on);
      el.setAttribute('aria-checked', String(on));
      const digit = $('.digit', el);
      digit.textContent = stage.inputs[i];
      digit.setAttribute('x', on ? 48 : 72);
    });
    gateSvg.querySelectorAll('[data-wire^="in"]').forEach((el) => {
      el.classList.toggle('up', stage.inputs[Number(el.dataset.wire.slice(2))] === 1);
    });
    $('[data-wire="out"]', gateSvg).classList.toggle('up', out === 1);
    $('.lamp', gateSvg).classList.toggle('on', out === 1);
    const lampDigit = $('.lamp-digit', gateSvg);
    lampDigit.classList.toggle('on', out === 1);
    lampDigit.textContent = out;

    markCurrent(stageTable, rowIndex(stage.inputs));
    $('#stage-status').textContent =
      stage.inputs.map((v, i) => LETTERS[i] + ' = ' + v).join(', ') + ', so Y = ' + out + '.';
  }

  function toggleStageInput(i) {
    stage.inputs[i] = 1 - stage.inputs[i];
    updateGate();
  }

  gateSvg.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-switch]');
    if (sw) toggleStageInput(Number(sw.dataset.switch));
  });
  gateSvg.addEventListener('keydown', (e) => {
    const sw = e.target.closest('[data-switch]');
    if (sw && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      toggleStageInput(Number(sw.dataset.switch));
    }
  });

  buildPicker($('#gate-picker'), 'gate', L.GATE_ORDER, stage.gate, (name) => {
    stage.gate = name;
    const arity = L.GATES[name].arity;
    stage.inputs = Array.from({ length: arity }, (_, i) => stage.inputs[i] || 0);
    buildGate();
  });

  /* ---------- 2. Expression lab ---------- */

  const EXAMPLES = [
    { label: 'XOR from the lecture', expr: "(not X and Y) or (X and not Y)" },
    { label: 'XNOR', expr: '(A and B) or (not A and not B)' },
    { label: 'Majority of three', expr: '(A and B) or (A and C) or (B and C)' },
    { label: 'NAND using not', expr: 'not (A and B)' },
  ];

  const exprInput = $('#expr-input');
  const exprTable = $('#expr-table');
  const exprMessage = $('#expr-message');

  $('#expr-examples').innerHTML = EXAMPLES.map((ex, i) =>
    '<button type="button" class="chip" data-example="' + i + '">' + esc(ex.label) + '</button>').join('');

  $('#expr-examples').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-example]');
    if (!btn) return;
    exprInput.value = EXAMPLES[Number(btn.dataset.example)].expr;
    runExpression();
    exprInput.focus();
  });

  function runExpression() {
    const src = exprInput.value;
    try {
      const { names, rows } = L.expressionTable(src);
      exprTable.innerHTML = tableHTML(names, rows, 'F');
      exprTable.hidden = false;
      const ones = rows.filter((r) => r.out === 1).length;
      exprMessage.className = 'msg';
      exprMessage.textContent = names.length + (names.length === 1 ? ' variable, ' : ' variables, ') +
        rows.length + ' rows, output is 1 in ' + ones + '.';
      $('#expr-py').textContent = 'python main.py expr "' + src.trim() + '"';
      $('#expr-py-row').hidden = false;
    } catch (err) {
      exprTable.hidden = true;
      $('#expr-py-row').hidden = true;
      exprMessage.className = src.trim() ? 'msg error' : 'msg';
      exprMessage.textContent = err.message;
    }
  }
  exprInput.addEventListener('input', runExpression);

  /* ---------- 3. CMOS lab ---------- */

  const cmos = { kind: 'NAND', inputs: [0, 0] };
  const cmosSvg = $('#cmos-svg');
  const cmosTable = $('#cmos-table');

  function transistorMarkup(name, cx, top, gateLetter) {
    return '<g class="t" data-t="' + name + '">' +
      '<rect x="' + (cx - 42) + '" y="' + top + '" width="84" height="52" rx="10"/>' +
      '<text class="t-name" x="' + (cx - 30) + '" y="' + (top + 22) + '">' + name + '</text>' +
      '<text class="t-state" x="' + (cx + 30) + '" y="' + (top + 22) + '" text-anchor="end">OFF</text>' +
      '<text class="t-gate" x="' + cx + '" y="' + (top + 41) + '" text-anchor="middle">gate ' + gateLetter + '</text></g>';
  }

  function buildCmosSvg() {
    const isNand = cmos.kind === 'NAND';
    const pNames = isNand ? ['P1', 'P2'] : ['P'];
    const nNames = isNand ? ['N1', 'N2'] : ['N'];
    const pxs = isNand ? [100, 220] : [160];
    const CX = 160, NODE_Y = 170, BH = 52;
    const nTop = (i) => 214 + i * 80;
    const railY = nTop(nNames.length - 1) + BH + 42;
    const height = railY + 44;

    let s = '';
    s += '<line class="rail" x1="40" y1="30" x2="280" y2="30"/><text class="rail-t" x="40" y="18">3 V (logic 1)</text>';
    s += '<line class="rail" x1="40" y1="' + railY + '" x2="280" y2="' + railY + '"/>' +
      '<text class="rail-t" x="40" y="' + (railY + 24) + '">0 V (logic 0)</text>';

    pNames.forEach((n, i) => {
      const x = pxs[i];
      s += '<polyline class="wire" data-w="pu:' + n + '" points="' + x + ',30 ' + x + ',70"/>';
      s += '<polyline class="wire" data-w="pu:' + n + '" points="' + x + ',122 ' + x + ',' + NODE_Y + ' ' + CX + ',' + NODE_Y + '"/>';
    });
    s += '<line class="wire" data-w="pd" x1="' + CX + '" y1="' + NODE_Y + '" x2="' + CX + '" y2="' + nTop(0) + '"/>';
    nNames.forEach((n, i) => {
      const next = i < nNames.length - 1 ? nTop(i + 1) : railY;
      s += '<line class="wire" data-w="pd" x1="' + CX + '" y1="' + (nTop(i) + BH) + '" x2="' + CX + '" y2="' + next + '"/>';
    });
    s += '<line class="wire" data-w="out" x1="' + CX + '" y1="' + NODE_Y + '" x2="314" y2="' + NODE_Y + '"/>';
    s += '<circle class="node" cx="' + CX + '" cy="' + NODE_Y + '" r="6"/>';

    pNames.forEach((n, i) => { s += transistorMarkup(n, pxs[i], 70, LETTERS[isNand ? i : 0]); });
    nNames.forEach((n, i) => { s += transistorMarkup(n, CX, nTop(i), LETTERS[isNand ? i : 0]); });

    const upX = Math.max.apply(null, pxs) + 56;
    s += '<text class="net-t" x="' + upX + '" y="90">Pull-up</text>' +
      '<text class="net-s" x="' + upX + '" y="108">' + (isNand ? 'pMOS, parallel' : 'pMOS') + '</text>';
    s += '<text class="net-t" x="' + (CX + 56) + '" y="' + (nTop(0) + 22) + '">Pull-down</text>' +
      '<text class="net-s" x="' + (CX + 56) + '" y="' + (nTop(0) + 40) + '">' + (isNand ? 'nMOS, series' : 'nMOS') + '</text>';

    s += '<circle class="lamp" cx="336" cy="' + NODE_Y + '" r="22"/>' +
      '<text class="lamp-digit" x="336" y="' + (NODE_Y + 8) + '" text-anchor="middle">0</text>' +
      '<text class="out-name" x="336" y="' + (NODE_Y + 44) + '" text-anchor="middle">Y</text>';

    cmosSvg.setAttribute('viewBox', '0 0 380 ' + height);
    cmosSvg.innerHTML = s;
    cmosSvg.setAttribute('aria-label', 'CMOS ' + cmos.kind + ' gate transistor diagram');
  }

  function buildCmos() {
    const circuit = L.CMOS[cmos.kind];
    cmos.inputs = Array.from({ length: circuit.arity }, (_, i) => cmos.inputs[i] || 0);

    $('#cmos-toggles').innerHTML = cmos.inputs.map((_, i) =>
      '<button type="button" class="toggle" role="switch" aria-checked="false" data-cin="' + i + '">' +
      '<span>Input ' + LETTERS[i] + '</span><span class="t-val">0</span></button>').join('');

    buildCmosSvg();

    const names = LETTERS.slice(0, circuit.arity);
    const rows = L.cmosTable(cmos.kind);
    const head = names.concat(circuit.names).map((n) => '<th scope="col">' + n + '</th>').join('') +
      '<th scope="col" class="out">Y</th>';
    const body = rows.map((r) =>
      '<tr>' + r.inputs.map((v) => '<td>' + v + '</td>').join('') +
      circuit.names.map((n) => '<td class="' + (r.states[n] ? 'on' : 'off') + '">' + (r.states[n] ? 'ON' : 'OFF') + '</td>').join('') +
      '<td class="out ' + (r.out ? 'one' : 'zero') + '">' + r.out + '</td></tr>').join('');
    cmosTable.innerHTML = '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody>';
    updateCmos();
  }

  function listNames(names) {
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function cmosCaption(result) {
    const circuit = L.CMOS[cmos.kind];
    const pNames = circuit.names.filter((n) => n[0] === 'P');
    const nNames = circuit.names.filter((n) => n[0] === 'N');
    const onP = pNames.filter((n) => result.states[n]);
    const onN = nNames.filter((n) => result.states[n]);
    const verb = (list) => (list.length > 1 ? 'are' : 'is');

    if (cmos.kind === 'NOT') {
      return result.out === 1
        ? 'A is 0, so the pMOS is ON and the nMOS is OFF. The pMOS pulls the output up to 3 V, so Y is 1.'
        : 'A is 1, so the nMOS is ON and the pMOS is OFF. The nMOS pulls the output down to 0 V, so Y is 0.';
    }
    if (result.out === 1) {
      return listNames(onP) + ' ' + verb(onP) + ' ON, so the output is pulled up to 3 V and Y is 1. ' +
        'The nMOS switches are in series, so the pull-down stays cut unless both are ON.';
    }
    return 'N1 and N2 are both ON, so the output is pulled down to 0 V and Y is 0. ' +
      'Both pMOS switches are OFF, so nothing pulls the output up.';
  }

  function updateCmos() {
    const circuit = L.CMOS[cmos.kind];
    const result = circuit.run(...cmos.inputs);

    document.querySelectorAll('[data-cin]').forEach((btn) => {
      const on = cmos.inputs[Number(btn.dataset.cin)] === 1;
      btn.setAttribute('aria-checked', String(on));
      $('.t-val', btn).textContent = on ? 1 : 0;
    });

    cmosSvg.querySelectorAll('[data-t]').forEach((el) => {
      const on = result.states[el.dataset.t];
      el.classList.toggle('on', on);
      $('.t-state', el).textContent = on ? 'ON' : 'OFF';
    });
    cmosSvg.querySelectorAll('[data-w]').forEach((el) => {
      const key = el.dataset.w;
      el.classList.remove('up', 'down');
      if (key.indexOf('pu:') === 0) { if (result.states[key.slice(3)]) el.classList.add('up'); }
      else if (key === 'pd') { if (result.pullDown) el.classList.add('down'); }
      else el.classList.add(result.out === 1 ? 'up' : 'down');
    });
    const node = $('.node', cmosSvg);
    node.classList.remove('up', 'down');
    node.classList.add(result.out === 1 ? 'up' : 'down');
    $('.lamp', cmosSvg).classList.toggle('on', result.out === 1);
    const lampDigit = $('.lamp-digit', cmosSvg);
    lampDigit.classList.toggle('on', result.out === 1);
    lampDigit.textContent = result.out;

    markCurrent(cmosTable, rowIndex(cmos.inputs));
    $('#cmos-caption').textContent = cmosCaption(result);
  }

  $('#cmos-toggles').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cin]');
    if (!btn) return;
    const i = Number(btn.dataset.cin);
    cmos.inputs[i] = 1 - cmos.inputs[i];
    updateCmos();
  });

  buildPicker($('#cmos-picker'), 'cmos', ['NOT', 'NAND'], cmos.kind, (kind) => {
    cmos.kind = kind;
    buildCmos();
  });

  /* ---------- 4. Universal gates ---------- */

  function buildUniversal() {
    const rows = L.universalChecks().map((c) =>
      '<tr><th scope="row">' + c.label + ' from ' + c.from + '</th>' +
      '<td class="how">' + esc(c.how) + '</td>' +
      '<td>' + (c.ok ? 'Matches ' + c.label + ' for every input' : 'Does not match') + '</td></tr>').join('');
    $('#uni-table').innerHTML =
      '<thead><tr><th scope="col">Build</th><th scope="col">Circuit</th><th scope="col">Check</th></tr></thead><tbody>' +
      rows + '</tbody>';
  }

  /* ---------- Copy buttons ---------- */

  function flash(button, text) {
    const original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.textContent = text;
    setTimeout(() => { button.textContent = original; }, 1600);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy-for]');
    if (!btn) return;
    const text = document.getElementById(btn.dataset.copyFor).textContent;
    if (!navigator.clipboard) { flash(btn, 'Copy not available'); return; }
    navigator.clipboard.writeText(text).then(
      () => flash(btn, 'Copied'),
      () => flash(btn, 'Copy failed'));
  });

  /* ---------- Start ---------- */

  buildGate();
  runExpression();
  buildCmos();
  buildUniversal();
})();
