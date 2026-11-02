import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../site.config';

export async function GET(context) {
  const items = (await getCollection('hirek', ({ data }) => data.published))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 50);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: items.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.date,
      link: `${base}/hirek/${a.id}/`,
    })),
    customData: '<language>hu</language>',
  });
}
