import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'hirek'>;

/** Csak a jóváhagyott cikkek, legújabb elöl. Fejlesztői előnézetben a tervezetek is látszanak. */
export async function getPublished(): Promise<Article[]> {
  const showDrafts = import.meta.env.DEV;
  const all = await getCollection('hirek', ({ data }) => showDrafts || data.published);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Hivatkozás az oldal gyökeréhez képest (GitHub Pages alútvonal miatt). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^https?:\/\//.test(path)) return path;
  return `${base}/${path.replace(/^\//, '')}`;
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function readingTime(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

/** YouTube-link vagy azonosító -> videóazonosító (vagy null). */
export function youtubeId(input?: string): string | null {
  if (!input) return null;
  const m = input.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(input.trim()) ? input.trim() : null;
}
