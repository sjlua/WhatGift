/**
 * Utility functions for URL sanitization, domain extraction, and image loading.
 */

/**
 * Sanitizes and cleans URLs, preventing duplication (e.g. <url><url>)
 * and fixing common malformed URL patterns like doubled protocols.
 *
 * @param {string} rawUrl - The input URL to sanitize.
 * @returns {string} Sanitized URL without duplicates.
 */
export function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Fix doubled scheme e.g. https://https:// or http://https://
  url = url.replace(/^(?:https?:\/\/)+(https?:\/\/)/i, '$1');

  // Handle whitespace-separated duplicates e.g. "https://a.com https://a.com"
  const tokens = url.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2 && tokens[0] === tokens[1]) {
    url = tokens[0];
  }

  // Exact duplication where string is repeated twice: A + A
  if (url.length % 2 === 0) {
    const half = url.length / 2;
    if (url.slice(0, half) === url.slice(half)) {
      url = url.slice(0, half);
    }
  }

  // Concatenated duplicate URLs: https://...https://... or http://...http://...
  const secondSchemeIdx = url.search(/.https?:\/\//i);
  if (secondSchemeIdx !== -1) {
    const splitIdx = secondSchemeIdx + 1;
    const part1 = url.slice(0, splitIdx).trim();
    const part2 = url.slice(splitIdx).trim();
    if (part1 === part2 || part1.replace(/\/$/, '') === part2.replace(/\/$/, '')) {
      url = part1;
    }
  }

  return url;
}

/**
 * Extracts clean domain name for display e.g. "apple.com"
 *
 * @param {string} url - The URL to extract domain from.
 * @returns {string} Domain name or 'Store Link'.
 */
export function getDomain(url) {
  if (!url) return 'Store Link';
  const clean = sanitizeUrl(url);
  try {
    return new URL(clean).hostname.replace('www.', '');
  } catch {
    return 'Store Link';
  }
}

/**
 * Returns a fallback proxy URL using wsrv.nl for images blocked by hotlinking / AWS WAF.
 *
 * @param {string} url - The image URL to proxy.
 * @returns {string} The proxied image URL.
 */
export function getProxiedImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return clean;
  if (clean.includes('wsrv.nl/?url=')) return clean;
  return `https://wsrv.nl/?url=${encodeURIComponent(clean)}`;
}

/**
 * Image error handler that attempts a fallback through a CORS/WAF proxy before failing.
 *
 * @param {Event} e - The image error event.
 * @param {string} originalUrl - The original image URL.
 * @param {Function} [onFinalError] - Callback if both direct and proxied loading fail.
 */
export function handleImageFallbackError(e, originalUrl, onFinalError) {
  const target = e?.currentTarget;
  if (!target) return;
  if (!target.dataset.proxied && originalUrl) {
    target.dataset.proxied = 'true';
    target.src = getProxiedImageUrl(originalUrl);
  } else {
    target.style.display = 'none';
    if (onFinalError) onFinalError();
  }
}
