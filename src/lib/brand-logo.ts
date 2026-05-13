/**
 * Brand → logo URL resolution. Primary source is logo.dev (resolves a logo
 * for any company domain). On error we cascade to Simple Icons (curated tech
 * brand SVGs) and finally to a single-letter monogram in the component.
 */

import { brandSlug } from "./brand-slug";

// Brand display name → primary domain. logo.dev resolves by domain, so this
// map is the bridge from "Sony" to "sony.com". Generic fallback: `<slug>.com`.
const BRAND_DOMAIN: Record<string, string> = {
  apple: "apple.com",
  sony: "sony.com",
  nikon: "nikon.com",
  canon: "canon.com",
  fujifilm: "fujifilm.com",
  fuji: "fujifilm.com",
  leica: "leica-camera.com",
  panasonic: "panasonic.com",
  olympus: "olympus-global.com",
  sigma: "sigma-global.com",
  tamron: "tamron.com",
  zeiss: "zeiss.com",
  dji: "dji.com",
  gopro: "gopro.com",
  samsung: "samsung.com",
  lg: "lg.com",
  microsoft: "microsoft.com",
  dell: "dell.com",
  hp: "hp.com",
  lenovo: "lenovo.com",
  asus: "asus.com",
  acer: "acer.com",
  razer: "razer.com",
  logitech: "logitech.com",
  bose: "bose.com",
  sonos: "sonos.com",
  jbl: "jbl.com",
  beats: "beatsbydre.com",
  google: "google.com",
  nintendo: "nintendo.com",
  playstation: "playstation.com",
  xbox: "xbox.com",
  valve: "valvesoftware.com",
  steam: "valvesoftware.com",
  amazon: "amazon.com",
  anker: "anker.com",
  garmin: "garmin.com",
  ricoh: "ricoh.com",
  pentax: "ricoh-imaging.com",
  hasselblad: "hasselblad.com",
  oneplus: "oneplus.com",
  oppo: "oppo.com",
  xiaomi: "xiaomi.com",
  huawei: "huawei.com",
  intel: "intel.com",
  amd: "amd.com",
  nvidia: "nvidia.com",
  ibm: "ibm.com",
  "bang & olufsen": "bang-olufsen.com",
  bang: "bang-olufsen.com",
  bangolufsen: "bang-olufsen.com",
};

export function brandDomain(brand: string): string {
  const norm = brand.trim().toLowerCase();
  if (BRAND_DOMAIN[norm]) return BRAND_DOMAIN[norm];
  return `${brandSlug(brand)}.com`;
}

export function logoDevUrl(brand: string, size = 128): string | null {
  const token = process.env.NEXT_PUBLIC_LOGODEV_KEY;
  if (!token) return null;
  const domain = brandDomain(brand);
  // `retina=true` returns 2x for crisp display on dense screens.
  return `https://img.logo.dev/${domain}?token=${token}&size=${size}&retina=true&format=png`;
}
