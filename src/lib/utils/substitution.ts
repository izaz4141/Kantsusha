import { page } from '$app/state';

export function getBaseDomain(host: string): string {
  const parts = host.split('.');
  if (parts.length >= 2) {
    return parts.slice(1).join('.');
  }
  return host;
}

export function resolveString(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, inner) => {
    if (inner.startsWith('KANTSUSHA_')) {
      return process.env[inner] ?? '';
    } else if (inner === 'SUBHOST') {
      return getBaseDomain(page.url.hostname);
    }

    return `\${${inner}}`;
  });
}
