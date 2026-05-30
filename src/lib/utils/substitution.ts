import { page } from '$app/state';
import { env } from '$env/dynamic/private';

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

export function getBaseDomain(host: string): string {
  const parts = host.split('.');
  if (parts.length >= 2) {
    return parts.slice(1).join('.');
  }
  return host;
}

export function substituteEnv(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, inner) => {
    if (inner.startsWith('KANTSUSHA_')) {
      return env[inner] ?? `\${${inner}}`;
    }
    return `\${${inner}}`;
  });
}

export function substituteEnvRecursive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return substituteEnv(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => substituteEnvRecursive(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = substituteEnvRecursive(value);
    }
    return result;
  }

  return obj;
}

export function resolveString(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, inner) => {
    if (inner.startsWith('KANTSUSHA_')) {
      return env[inner] ?? '';
    } else if (inner === 'SUBHOST') {
      return getBaseDomain(page.url.hostname);
    }

    return `\${${inner}}`;
  });
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  IDR: 'Rp',
  THB: '฿',
  VND: '₫',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  HKD: 'HK$',
  SGD: 'S$',
  BRL: 'R$',
  MXN: 'MX$',
  PHP: '₱',
  MYR: 'RM',
  TRY: '₺',
  RUB: '₽',
  ZAR: 'R',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  BDT: '৳',
  PKR: '₨',
  EGP: 'E£',
  NGN: '₦',
  GHS: '₵',
  KES: 'KSh',
  UAH: '₴',
  CZK: 'Kč',
  HUF: 'Ft',
  ILS: '₪',
  CLP: 'CLP$',
  COP: 'COP$',
  PEN: 'S/',
  ARS: 'AR$',
  BGN: 'лв',
  RON: 'lei',
  TWD: 'NT$',
  AED: 'د.إ',
  SAR: 'ر.س',
  ISK: 'kr',
  BHD: '.د.ب',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  DZD: 'د.ج',
  MAD: 'د.م.',
  TND: 'د.ت',
  LKR: 'Rs',
  NPR: 'Rs',
  MMK: 'K',
  KHR: '៛',
  LAK: '₭',
  BND: 'B$',
  PYG: '₲',
  UYU: '$U',
  KZT: '₸',
  UZS: "so'm",
  GEL: '₾',
  AMD: '֏',
  AZN: '₼',
  BYN: 'Br',
  RSD: 'дин.',
  MKD: 'ден',
  ALL: 'L',
  BAM: 'KM',
  HRK: 'kn',
  CUP: '₱',
  DOP: 'RD$',
  GTQ: 'Q',
  HNL: 'L',
  NIO: 'C$',
  CRC: '₡',
  PAB: 'B/.',
  XAF: 'Fr',
  XOF: 'CFA',
  XCD: 'EC$',
  BSD: 'B$',
  BBD: 'Bds$',
  JMD: 'J$',
  TTD: 'TT$',
  KYD: 'CI$',
  HTG: 'G',
  MDL: 'L',
  CVE: 'Esc',
  MZN: 'MT',
  AOA: 'Kz',
  ZMW: 'ZK',
  MWK: 'MK',
  BWP: 'P',
  SCR: 'SR',
  MUR: '₨',
  MVR: 'Rf',
  BTN: 'Nu.',
  AFN: '؋',
  IRR: '﷼',
  IQD: 'ع.د',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  SYP: '£S',
};
