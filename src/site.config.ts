// ============================================================
//  AZ OLDAL ALAPADATAI – itt egy helyen átírható minden
// ============================================================
export const SITE = {
  name: 'DOBJektív',
  tagline: 'A társasjátékos világ friss hírei, magyarul',
  description:
    'Független, hirdetésmentes magyar hírblog a társasjáték-ipar újdonságairól: megjelenések, kiadói hírek, rendezvények, Kickstarter-kampányok és díjak.',
  email: 'dobjektiv@gmail.com',
  // A kiadó (Magyar Társasjáték-fejlesztők Egyesülete) e-mail-címe az impresszumhoz
  publisherEmail: 'info.matafe@gmail.com',
  facebook: 'https://www.facebook.com/matafe.org',
  defaultAuthor: 'Szerkesztőség',
  // Látogatottság-mérés (GoatCounter, sütik nélkül). Regisztráció után ide jön a választott kód,
  // pl. ha a címed tarsasjatekhirek.goatcounter.com, akkor: 'tarsasjatekhirek'. Üresen hagyva nincs mérés.
  goatcounter: 'tarsasjatekhirek',
};

// Cikktípusok megjelenítése
export const ARTICLE_TYPES = {
  // color: a jelölés színe, text: a szöveg színe ezen a háttéren
  sajat: { label: 'Saját cikk', color: '#111111', text: '#ffffff' },
  forditas: { label: 'Fordítás', color: '#948f89', text: '#ffffff' },
  gyujtott: { label: 'Hírösszefoglaló', color: '#f9ab0a', text: '#111111' },
  video: { label: 'Videóajánló', color: '#ffd46b', text: '#111111' },
} as const;
