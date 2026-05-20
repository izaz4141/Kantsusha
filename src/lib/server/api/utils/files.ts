import { join, extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { isValidPath } from '$lib/server/path';

const MIME_TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

export async function serveFile(filePath: string): Promise<Response | null> {
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] ?? 'application/octet-stream';
    return new Response(data, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return null;
  }
}

export async function handleFileRequest(
  assetsDir: string | undefined,
  path: string
): Promise<Response> {
  if (!assetsDir) {
    return new Response('KANTSUSHA_ASSETS_DIR not configured', { status: 500 });
  }

  if (!isValidPath(assetsDir, path)) {
    return new Response('Invalid path', { status: 400 });
  }

  const filePath = join(assetsDir, path);
  const file = await serveFile(filePath);

  if (!file) {
    return new Response('File not found', { status: 404 });
  }

  return file;
}