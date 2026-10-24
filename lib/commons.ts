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

function toResult(page: CommonsPage): ImageResult {
  const info = page.imageinfo![0];
  const artist = stripHtml(info.extmetadata?.Artist?.value ?? "");
  const license = info.extmetadata?.LicenseShortName?.value ?? "";
  return {
    url: (info.thumburl ?? info.url)!,
    source: "wikimedia",
    credit: [artist, license].filter(Boolean).join(" · ") || undefined,
    pageUrl: info.descriptionurl,
  };
}

export function pickCommonsImages(json: unknown, mustContain?: string | null, limit = 4): ImageResult[] {
  const pages = (json as { query?: { pages?: Record<string, CommonsPage> } }).query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .filter((page) => page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url)
    .filter((page) => !SCANNED.test(page.imageinfo?.[0]?.url ?? "") && !BOOK_SCAN.test(page.title ?? ""))
    .filter((page) => !mustContain || normalize(page.title ?? "").includes(normalize(mustContain)))
    .sort((a, b) => (a.index ?? Infinity) - (b.index ?? Infinity))
    .slice(0, limit)
    .map(toResult);
}

export function pickCommonsImage(json: unknown, mustContain?: string | null): ImageResult | null {
  return pickCommonsImages(json, mustContain, 1)[0] ?? null;
}

async function queryCommons(query: string, bitmapOnly: boolean): Promise<unknown> {
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
  return response.ok ? response.json() : null;
}

type SearchOptions = { bitmapOnly?: boolean; mustContain?: string | null };

// Wikimedia Commons is the only web source, so children never see arbitrary search results.
export async function searchCommons(query: string, { bitmapOnly = true, mustContain }: SearchOptions = {}) {
  return pickCommonsImage(await queryCommons(query, bitmapOnly), mustContain);
}

export async function searchCommonsCandidates(
  query: string,
  { bitmapOnly = true, mustContain }: SearchOptions = {},
): Promise<ImageResult[]> {
  return pickCommonsImages(await queryCommons(query, bitmapOnly), mustContain, 4);
}
