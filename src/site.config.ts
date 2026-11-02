// ============================================================
//  AZ OLDAL ALAPADATAI – itt egy helyen átírható minden
// ============================================================
export const SITE = {
  // Munkacím – ha megvan a végleges név, csak ezt kell átírni
  name: 'Társasjáték Hírek',
  tagline: 'A társasjátékos világ friss hírei, magyarul',
  description:
    'Független, hirdetésmentes magyar hírblog a társasjáték-ipar újdonságairól: megjelenések, kiadói hírek, rendezvények, Kickstarter-kampányok és díjak.',
  email: 'info.matafe@gmail.com',
  defaultAuthor: 'Szerkesztőség',
  // Látogatottság-mérés (GoatCounter, sütik nélkül). Regisztráció után ide jön a választott kód,
  // pl. ha a címed tarsasjatekhirek.goatcounter.com, akkor: 'tarsasjatekhirek'. Üresen hagyva nincs mérés.
  goatcounter: 'tarsasjatekhirek',
};

// Cikktípusok megjelenítése
export const ARTICLE_TYPES = {
  sajat: { label: 'Saját cikk', color: 'var(--c-teal)' },
  forditas: { label: 'Fordítás', color: 'var(--c-plum)' },
  gyujtott: { label: 'Hírösszefoglaló', color: 'var(--c-accent)' },
  video: { label: 'Videóajánló', color: '#b8860b' },
} as const;
