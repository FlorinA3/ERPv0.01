const test = require('node:test');
const assert = require('node:assert/strict');
const {
  toCents,
  addCents,
  multiplyCents,
  fromCents,
} = require('./money');
const {
  computeLineTotals,
  summariseDocumentTotals,
} = require('../services/calculationService');

test('money: 0.1 + 0.2 patterns stay stable', () => {
  const a = toCents('0.1');
  const b = toCents('0.2');
  assert.equal(a, 10);
  assert.equal(b, 20);
  assert.equal(addCents(a, b), 30);
  assert.equal(addCents(a, a, a), 30);
});

test('money: multiplyCents supports percent strings and numbers', () => {
  const base = 1000; // 10.00
  assert.equal(multiplyCents(base, '20%'), 200);
  assert.equal(multiplyCents(base, 20), 200); // integer treated as percent
  assert.equal(multiplyCents(base, 1.19), 1190);
});

test('calculations: mixed VAT summary groups correctly', () => {
  const lines = [
    computeLineTotals({ quantity: 1, unit_price: '100.00', vat_rate: 0 }),
    computeLineTotals({ quantity: 1, unit_price: '100.00', vat_rate: 20 }),
  ];
  const summary = summariseDocumentTotals(lines);
  assert.equal(summary.net_total_cents, 20000);
  assert.equal(summary.vat_total_cents, 2000);
  assert.equal(summary.gross_total_cents, 22000);
  assert.equal(summary.vat_summary['0'].vat_cents, 0);
  assert.equal(summary.vat_summary['20'].vat_cents, 2000);
});

test('calculations: large invoice stays precise', () => {
  const lines = [];
  for (let i = 0; i < 50; i += 1) {
    lines.push(computeLineTotals({ quantity: 3, unit_price: '1.99', vat_rate: 20 }));
  }
  const summary = summariseDocumentTotals(lines);
  // Each line: net 5.97, vat 1.19, gross 7.16
  assert.equal(summary.net_total_cents, 29850);
  assert.equal(summary.vat_total_cents, 5950);
  assert.equal(summary.gross_total_cents, 35800);
});

test('calculations: discount percent applied before VAT', () => {
  const line = computeLineTotals({
    quantity: 2,
    unit_price: '100.00',
    discount_percent: 10,
    vat_rate: 20,
  });
  assert.equal(line.net_cents, 18000);
  assert.equal(line.vat_cents, 3600);
  assert.equal(line.gross_cents, 21600);
  assert.equal(fromCents(line.gross_cents), '216.00');
});
