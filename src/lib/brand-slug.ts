// Map brand names to Simple Icons slugs. Simple Icons (https://simpleicons.org)
// expects lowercase, hyphenated names — most match directly, a handful need
// explicit aliases.
const ALIASES: Record<string, string> = {
  apple: "apple",
  sony: "sony",
  nikon: "nikon",
  canon: "canon",
  fujifilm: "fujifilm",
  fuji: "fujifilm",
  leica: "leica",
  panasonic: "panasonic",
  olympus: "olympus",
  sigma: "sigma",
  tamron: "tamron",
  zeiss: "zeiss",
  dji: "dji",
  gopro: "gopro",
  samsung: "samsung",
  lg: "lg",
  microsoft: "microsoft",
  dell: "dell",
  hp: "hp",
  lenovo: "lenovo",
  asus: "asus",
  acer: "acer",
  razer: "razer",
  logitech: "logitech",
  bose: "bose",
  sonos: "sonos",
  jbl: "jbl",
  beats: "beatsbydre",
  google: "google",
  nintendo: "nintendo",
  playstation: "playstation",
  xbox: "xbox",
  valve: "valve",
  steam: "valve",
  amazon: "amazon",
  anker: "anker",
  garmin: "garmin",
  ricoh: "ricoh",
  pentax: "pentax",
  hasselblad: "hasselblad",
  oneplus: "oneplus",
  oppo: "oppo",
  xiaomi: "xiaomi",
  huawei: "huawei",
  intel: "intel",
  amd: "amd",
  nvidia: "nvidia",
  ibm: "ibm",
  bang: "bangolufsen",
  "bang & olufsen": "bangolufsen",
  bangolufsen: "bangolufsen",
};

export function brandSlug(brand: string): string {
  const norm = brand.trim().toLowerCase();
  if (ALIASES[norm]) return ALIASES[norm];
  // Generic: strip non-alphanumerics
  return norm.replace(/[^a-z0-9]/g, "");
}

export function brandLogoUrl(brand: string): string {
  return `https://cdn.simpleicons.org/${brandSlug(brand)}`;
}
