/**
 * Reseller logo resolution. Cascades:
 *   1) logo.dev (high-quality brand logo, uses the publishable key)
 *   2) Google s2 favicon (catches anything logo.dev misses — Korean stores,
 *      indie shops, etc.)
 *   3) Letter monogram (component-side fallback when both fail)
 */

export function resellerDomain(url: string): string | null {
  try {
    // If the user typed "amazon.com" or "www.amazon.com", coerce a protocol so
    // URL() doesn't choke.
    const withProtocol = /^https?:\/\//.test(url) ? url : `https://${url}`;
    const host = new URL(withProtocol).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function logoDevDomainUrl(url: string, size = 128): string | null {
  const token = process.env.NEXT_PUBLIC_LOGODEV_KEY;
  if (!token) return null;
  const domain = resellerDomain(url);
  if (!domain) return null;
  return `https://img.logo.dev/${domain}?token=${token}&size=${size}&retina=true&format=png`;
}

export function googleFaviconUrl(url: string, size = 128): string | null {
  const domain = resellerDomain(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}
