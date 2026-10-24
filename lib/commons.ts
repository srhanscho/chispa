export interface ImageResult {
  url: string;
  source: "wikimedia" | "openai" | "mascot" | "fallback";
  credit?: string;
  pageUrl?: string;
}

interface CommonsPage {
  index?: number;
  title?: string;
  imageinfo?: {
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }[];
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

// Book scans and documents render as page thumbnails that make no sense for kids.
const SCANNED = /\.(pdf|djvu|tiff?)$/i;
// Internet Archive book scans: "(IA identifier)" or "(year) (Flickr id)" in the file name.
const BOOK_SCAN = /\(IA [^)]+\)|\(\d{10,}\)/;

const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function pickCommonsImage(json: unknown, mustContain?: string | null): ImageResult | null {
  const pages = (json as { query?: { pages?: Record<string, CommonsPage> } }).query?.pages;
  if (!pages) return null;

  const best = Object.values(pages)
    .filter((page) => page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url)
    .filter((page) => !SCANNED.test(page.imageinfo?.[0]?.url ?? "") && !BOOK_SCAN.test(page.title ?? ""))
    .filter((page) => !mustContain || normalize(page.title ?? "").includes(normalize(mustContain)))
    .sort((a, b) => (a.index ?? Infinity) - (b.index ?? Infinity))[0];
  const info = best?.imageinfo?.[0];
  if (!info) return null;

  const artist = stripHtml(info.extmetadata?.Artist?.value ?? "");
  const license = info.extmetadata?.LicenseShortName?.value ?? "";
  return {
    url: (info.thumburl ?? info.url)!,
    source: "wikimedia",
    credit: [artist, license].filter(Boolean).join(" · ") || undefined,
    pageUrl: info.descriptionurl,
  };
}

// Wikimedia Commons is the only web source, so children never see arbitrary search results.
export async function searchCommons(
  query: string,
  { bitmapOnly = true, mustContain }: { bitmapOnly?: boolean; mustContain?: string | null } = {},
): Promise<ImageResult | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: bitmapOnly ? `${query} filetype:bitmap` : query,
    gsrnamespace: "6",
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "800",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "Chispa/0.1 (open-source kids tutor; https://github.com/srhanscho/chispa)" },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) return null;
  return pickCommonsImage(await response.json(), mustContain);
}
