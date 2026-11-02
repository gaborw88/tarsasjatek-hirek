import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const hirek = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hirek' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // sajat = én írtam | forditas = linkből fordítva | gyujtott = automatikus hírgyűjtés
    type: z.enum(['sajat', 'forditas', 'gyujtott']).default('sajat'),
    // Csak a jóváhagyott (published: true) cikkek jelennek meg az oldalon
    published: z.boolean().default(false),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // A kép forrása / szerzői joga, pl. "Fotó: Gémklub sajtóanyag"
    imageCredit: z.string().optional(),
    // Csak szerkesztőknek: javasolt kép linkje (nem jelenik meg az oldalon)
    imageSuggestion: z.string().optional(),
    sources: z
      .array(z.object({ name: z.string(), url: z.string() }))
      .default([]),
  }),
});

export const collections = { hirek };
