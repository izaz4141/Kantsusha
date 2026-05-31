import { page } from '$app/state';
import { CURRENCY_SYMBOLS } from './constants';

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

export function getSubHost(host: string): string {
  const parts = host.split('.');
  if (parts.length >= 2) {
    return parts.slice(1).join('.');
  }
  return host;
}

export function substituteEnv(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, inner) => {
    if (inner.startsWith('KANTSUSHA_')) {
      return process.env[inner] ?? `\${${inner}}`;
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
      return process.env[inner] ?? '';
    } else if (inner === 'HOST') {
      return page.url.hostname;
    } else if (inner === 'SUBHOST') {
      return getSubHost(page.url.hostname);
    }

    return `\${${inner}}`;
  });
}
