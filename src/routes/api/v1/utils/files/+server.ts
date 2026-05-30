import { handleFileRequest } from '$lib/server/api/utils/files';

export async function GET({ url }) {
  const filePath = url.searchParams.get('path');

  if (!filePath) {
    return new Response('Missing path parameter', { status: 400 });
  }

  return handleFileRequest(process.env.KANTSUSHA_ASSETS_DIR, filePath);
}
