const { toCents, fromCents, addCents, multiplyCents } = require('../utils/money');

function parseQuantity(value) {
  if (value === null || value === undefined) {
    throw new Error('Quantity is required');
  }
  const str = String(value).trim();
  if (!/^[-+]?\d+(\.\d+)?$/.test(str)) {
    const err = new Error('Invalid quantity format');
    err.code = 'INVALID_QUANTITY';
    throw err;
  }
  const negative = str.startsWith('-');
  const unsigned = str.replace(/^[-+]/, '');
  const [i, f = ''] = unsigned.split('.');
  const scale = 10 ** Math.min(f.length, 6); // support up to 6 decimals on qty
  const units = Number((i || '0') + f.padEnd(Math.min(f.length, 6), '0'));
  const signedUnits = negative ? -units : units;
  return { units: signedUnits, scale };
}

function computeLineTotals(line, options = {}) {
  const currency = line.currency || options.currency || 'EUR';
  const quantityInfo = parseQuantity(line.quantity);
  const unitPriceCents = toCents(line.unit_price);

  const netBeforeDiscount = Math.round(
    (unitPriceCents * quantityInfo.units) / quantityInfo.scale
  );

  const discountPct = line.discount_percent ?? line.discount ?? 0;
  const discountAmtCents = line.discount_amount ? toCents(line.discount_amount) : 0;

  const discountPctCents =
    discountPct ? Math.round((netBeforeDiscount * Number(discountPct)) / 100) : 0;

  const netCents = Math.max(0, netBeforeDiscount - discountPctCents - discountAmtCents);

  const vatRate = line.vat_rate !== undefined && line.vat_rate !== null
    ? Number(line.vat_rate)
    : Number(options.defaultVatRate || 0);

  const vatCents = multiplyCents(netCents, `${vatRate}%`);
  const grossCents = netCents + vatCents;

  return {
    net_cents: netCents,
    vat_cents: vatCents,
    gross_cents: grossCents,
    vat_rate: vatRate,
    currency,
  };
}

function summariseDocumentTotals(lineTotals) {
  const summary = {
    net_total_cents: 0,
    vat_total_cents: 0,
    gross_total_cents: 0,
    vat_summary: {},
  };

  for (const line of lineTotals) {
    summary.net_total_cents = addCents(summary.net_total_cents, line.net_cents);
    summary.vat_total_cents = addCents(summary.vat_total_cents, line.vat_cents);
    summary.gross_total_cents = addCents(summary.gross_total_cents, line.gross_cents);

    const key = String(line.vat_rate ?? 0);
    if (!summary.vat_summary[key]) {
      summary.vat_summary[key] = { net_cents: 0, vat_cents: 0, gross_cents: 0 };
    }
    summary.vat_summary[key].net_cents = addCents(
      summary.vat_summary[key].net_cents,
      line.net_cents
    );
    summary.vat_summary[key].vat_cents = addCents(
      summary.vat_summary[key].vat_cents,
      line.vat_cents
    );
    summary.vat_summary[key].gross_cents = addCents(
      summary.vat_summary[key].gross_cents,
      line.gross_cents
    );
  }

  return summary;
}

module.exports = {
  computeLineTotals,
  summariseDocumentTotals,
  toCents,
  fromCents,
  addCents,
  multiplyCents,
};
