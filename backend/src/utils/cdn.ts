const CDN_BASE_URL = process.env.CDN_BASE_URL!;
const CDN_API_KEY = process.env.CDN_API_KEY!;
const CDN_PROJECT = process.env.CDN_PROJECT!;

export async function uploadToCdn(
  fileBuffer: Buffer,
  originalName: string,
  mimeType?: string,
): Promise<{ filename: string; url: string }> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], mimeType ? { type: mimeType } : undefined);
  formData.append('file', blob, originalName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2-minute CDN timeout

  let res: Response;
  try {
    res = await fetch(`${CDN_BASE_URL}/upload/${CDN_PROJECT}`, {
      method: 'POST',
      headers: { 'x-api-key': CDN_API_KEY },
      body: formData,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('CDN upload timeout after 120s');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CDN upload failed: ${res.status} ${text}`);
  }

  const data = await res.json() as { url: string };
  // data.url = "/f/love-scrum/images/{filename}"
  const filename = data.url.split('/').pop()!;
  const url = `${CDN_BASE_URL}${data.url}`;
  return { filename, url };
}

export async function deleteFromCdn(filename: string): Promise<void> {
  const res = await fetch(`${CDN_BASE_URL}/files/${CDN_PROJECT}/images/${filename}`, {
    method: 'DELETE',
    headers: { 'x-api-key': CDN_API_KEY },
  });

  // 404 = already gone, treat as success
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`CDN delete failed: ${res.status} ${text}`);
  }
}
