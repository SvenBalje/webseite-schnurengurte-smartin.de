// Zentrale Konfiguration der Webseite.
// Alles mit "PLATZHALTER" muss vor dem Go-Live ersetzt werden.
// `npm run check` warnt, `npm run check:produktion` (läuft vor jedem Produktions-Upload) bricht ab.

export interface NavEintrag {
  titel: string;
  href: string;
  kinder?: NavEintrag[];
  /** als Akzent-Knopf darstellen (Handlungsaufforderung) */
  hervorheben?: boolean;
}

export const site = {
  name: 's.mARTin Schnurengurte',
  /** Produktions-Adresse ohne abschließenden Schrägstrich. Staging setzt SITE_URL im Workflow. */
  url: 'https://www.schnurengurte-smartin.de',
  beschreibung:
    'Handgefertigte Schnurengurte aus Mohair, Alpaka, Leinen und Merino – jeder Gurt ein Unikat, gefertigt von Simone Behrens in Brahlstorf.',
  sprache: 'de',

  impressum: {
    firma: 'Sattelgurtmanufaktur s. mARTin',
    inhaberin: 'Simone Behrens',
    strasse: 'Schwarzer Weg 6',
    plzOrt: '19273 Brahlstorf',
    telefon: '0157 36972337',
    telefonLink: '+4915736972337',
    email: 'info@schnurengurte-smartin.de',
    /** Wie auf der alten Seite angegeben – Bezeichnung (Steuernummer oder USt-IdNr.) mit Kundin klären. */
    ustId: '64 189 036 573',
  },

  instagram: 'https://www.instagram.com/s.martin_reitzubehoer',
  routenplaner: 'https://www.google.com/maps/dir/?api=1&destination=Schwarzer+Weg+6,+19273+Brahlstorf',

  /** Hauptnavigation (immer mit abschließendem Schrägstrich) */
  // „Start“ fehlt bewusst: das Logo führt zur Startseite.
  navigation: [
    {
      titel: 'Schnurengurte',
      href: '/material/',
      kinder: [
        { titel: 'Material & Breiten', href: '/material/' },
        { titel: 'Mohair', href: '/modelle/mohair/' },
        { titel: 'Alpaka', href: '/modelle/alpaka/' },
        { titel: 'Leinen', href: '/modelle/leinen/' },
        { titel: 'Merino', href: '/modelle/merino/' },
        { titel: 'Schnallenschutz', href: '/modelle/schnallenschutz/' },
        { titel: 'Pflege', href: '/pflege/' },
      ],
    },
    { titel: 'Gurt gestalten', href: '/gurt-gestalten/', hervorheben: true },
    { titel: 'Preise', href: '/preise/' },
    { titel: 'Galerie', href: '/galerie/' },
    { titel: 'Blankets & Satteldecken', href: '/blankets-satteldecken/' },
    { titel: 'Handgestrickt', href: '/handgestrickt/' },
    { titel: 'Kontakt', href: '/kontakt/' },
  ] as NavEintrag[],

  /**
   * Dienste, die erst nach Einwilligung geladen werden dürfen (Analytics, Karten, Videos …).
   * Leer = kein Cookie-Banner. Die Domain muss zusätzlich in der CSP in public/.htaccess erlaubt werden.
   */
  einwilligungsDienste: [] as Array<{ id: string; name: string; beschreibung: string; src: string }>,
};

export default site;
