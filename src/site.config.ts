// ============================================================
//  AZ OLDAL ALAPADATAI – itt egy helyen átírható minden
// ============================================================
export const SITE = {
  // Munkacím – ha megvan a végleges név, csak ezt kell átírni
  name: 'Társasjáték Hírek',
  tagline: 'A társasjátékos világ friss hírei, magyarul',
  description:
    'Független magyar hírblog a társasjáték-ipar újdonságairól: megjelenések, kiadói hírek, rendezvények, Kickstarter-kampányok és díjak.',
  email: 'info.matafe@gmail.com',
  defaultAuthor: 'Szerkesztőség',
};

// Cikktípusok megjelenítése
export const ARTICLE_TYPES = {
  sajat: { label: 'Saját cikk', color: 'var(--c-teal)' },
  forditas: { label: 'Fordítás', color: 'var(--c-plum)' },
  gyujtott: { label: 'Hírösszefoglaló', color: 'var(--c-accent)' },
  video: { label: 'Videóajánló', color: '#b8860b' },
} as const;
