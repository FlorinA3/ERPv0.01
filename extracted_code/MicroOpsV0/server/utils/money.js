/**
 * Integer-cents money helpers to avoid floating-point errors.
 * All functions assume a default scale of 2 (cents) unless specified otherwise.
 */

function toCents(value, scale = 2) {
  if (value === null || value === undefined) return 0;
  const str = String(value).trim();
  if (str === '') return 0;

  if (!/^[-+]?\d+(\.\d+)?$/.test(str)) {
    const err = new Error('Invalid money format');
    err.code = 'INVALID_MONEY_FORMAT';
    throw err;
  }

  const negative = str.startsWith('-');
  const unsigned = str.replace(/^[-+]/, '');
  const [intPartRaw, fracRaw = ''] = unsigned.split('.');

  const fracPart = fracRaw.padEnd(scale, '0');
  let base = BigInt(intPartRaw || '0') * BigInt(10 ** scale);

  if (fracRaw.length <= scale) {
    base += BigInt(fracPart || '0');
  } else {
    const kept = fracRaw.slice(0, scale);
    const dropped = fracRaw.slice(scale);
    base += BigInt(kept || '0');
    const shouldRoundUp =
      dropped[0] && Number(dropped[0]) >= 5;
    if (shouldRoundUp) {
      base += 1n;
    }
  }

  const result = negative ? -base : base;
  return Number(result);
}

function fromCents(cents, scale = 2) {
  const isNegative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const factor = 10 ** scale;
  const intPart = Math.floor(abs / factor);
  const fracPart = String(abs % factor).padStart(scale, '0');
  const str = `${intPart}.${fracPart}`;
  return isNegative ? `-${str}` : str;
}

function addCents(...values) {
  return values.reduce((sum, val) => sum + Number(val || 0), 0);
}

function parseFactorToRatio(factor) {
  if (factor === null || factor === undefined) {
    const err = new Error('Factor is required');
    err.code = 'INVALID_FACTOR';
    throw err;
  }

  let raw = factor;
  let isPercent = false;

  if (typeof factor === 'string') {
    const trimmed = factor.trim();
    if (trimmed.endsWith('%')) {
      isPercent = true;
      raw = trimmed.slice(0, -1);
    } else {
      raw = trimmed;
    }
  }

  if (typeof raw === 'number') {
    if (Number.isInteger(raw)) {
      // interpret whole numbers as percentages (e.g. 20 => 20%)
      return { numerator: BigInt(raw), denominator: 100n };
    }
    raw = String(raw);
  }

  if (typeof raw === 'string') {
    if (!/^[-+]?\d+(\.\d+)?$/.test(raw)) {
      const err = new Error('Invalid factor format');
      err.code = 'INVALID_FACTOR';
      throw err;
    }
    const negative = raw.startsWith('-');
    const unsigned = raw.replace(/^[-+]/, '');
    const [i, f = ''] = unsigned.split('.');
    const numerator = BigInt((i || '0') + f);
    const denominator = BigInt(10 ** f.length || 1);
    const signedNumerator = negative ? -numerator : numerator;

    if (isPercent) {
      return { numerator: signedNumerator, denominator: denominator * 100n };
    }
    // If original factor was a decimal number (e.g. 1.19), treat as multiplier
    if (f.length > 0) {
      return { numerator: signedNumerator, denominator };
    }
    // If original factor was an integer string without %, treat as percent
    return { numerator: signedNumerator, denominator: 100n };
  }

  const err = new Error('Unsupported factor type');
  err.code = 'INVALID_FACTOR';
  throw err;
}

function multiplyCents(cents, factor) {
  const { numerator, denominator } = parseFactorToRatio(factor);
  const c = BigInt(Math.trunc(cents));
  const product = c * numerator;
  const half = denominator / 2n;
  const adjusted = product >= 0 ? product + half : product - half;
  return Number(adjusted / denominator);
}

module.exports = {
  toCents,
  fromCents,
  addCents,
  multiplyCents,
};
