/**
 * Wraps external image URLs with the image proxy.
 * Local URLs (starting with /) pass through unchanged.
 * External URLs (http/https) get proxied for CORS handling.
 *
 * @param url - Image URL (external or local)
 * @returns Proxied URL for external, original for local, null if input is null
 */
export function proxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Local URLs don't need proxying
  if (url.startsWith('/')) {
    return url;
  }

  // External URLs get proxied
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // Unknown scheme, return as-is (will likely fail, which is expected)
  return url;
}
