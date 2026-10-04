/** Return a byte range from a cached complete clip (including WebKit requests). */
export async function rangedAudioResponse(request: Request, response: Response): Promise<Response> {
  const range = request.headers.get('range');
  if (!range || response.status !== 200) return response;
  const bytes = await response.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${bytes.byteLength}` } });
  const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (start > end || start >= bytes.byteLength || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
    return new Response(null, { status: 416, headers: { 'content-range': `bytes */${bytes.byteLength}` } });
  }
  const headers = new Headers(response.headers);
  headers.set('accept-ranges', 'bytes');
  headers.set('content-range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('content-length', String(end - start + 1));
  return new Response(bytes.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
}
