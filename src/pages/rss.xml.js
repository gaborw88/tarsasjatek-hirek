import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../site.config';

export async function GET(context) {
  const items = (await getCollection('hirek', ({ data }) => data.published))
    .sort((a, b) => (b.data.publishedAt ?? b.data.date).valueOf() - (a.data.publishedAt ?? a.data.date).valueOf())
    .slice(0, 50);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: new URL(import.meta.env.BASE_URL, context.site).href,
    items: items.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      // a megjelenés (jóváhagyás) ideje, hogy a később jóváhagyott cikkek is újként jelenjenek meg a hírolvasókban és a Facebook-automatizálásban
      pubDate: a.data.publishedAt ?? a.data.date,
      link: `${base}/hirek/${a.id}/`,
    })),
    customData: '<language>hu</language>',
  });
}
