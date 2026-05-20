import path from 'node:path';

export function isValidPath(base: string, target: string): boolean {
  const basePath = path.resolve(base);
  const targetPath = path.resolve(base, target);
  return targetPath.startsWith(basePath + path.sep) || targetPath === basePath;
}