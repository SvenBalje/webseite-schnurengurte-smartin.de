// Zentrale Konfiguration der Webseite.
// Alles mit "PLATZHALTER" muss vor dem Go-Live ersetzt werden.
// `npm run check` warnt, `npm run check:produktion` (läuft vor jedem Produktions-Upload) bricht ab.

export const site = {
  name: 'PLATZHALTER Firmenname',
  /** Produktions-Adresse ohne abschließenden Schrägstrich. Staging setzt SITE_URL im Workflow. */
  url: 'https://www.platzhalter-domain.de',
  beschreibung: 'PLATZHALTER Kurzbeschreibung der Firma für Suchmaschinen (ca. 150 Zeichen).',
  sprache: 'de',

  impressum: {
    firma: 'PLATZHALTER Firma GmbH',
    strasse: 'PLATZHALTER Straße 1',
    plzOrt: '00000 PLATZHALTER',
    vertreten: 'PLATZHALTER Geschäftsführer/in',
    telefon: 'PLATZHALTER +49 000 000000',
    email: 'info@platzhalter-domain.de',
    registergericht: 'PLATZHALTER Amtsgericht',
    registernummer: 'PLATZHALTER HRB 00000',
    ustId: 'PLATZHALTER DE000000000',
  },

  /** Hauptnavigation */
  navigation: [{ titel: 'Start', href: '/' }],

  /**
   * Dienste, die erst nach Einwilligung geladen werden dürfen (Analytics, Karten, Videos …).
   * Leer = kein Cookie-Banner. Eintrag z. B.:
   * { id: 'statistik', name: 'Statistik (Matomo)', beschreibung: '…', src: 'https://…/matomo.js' }
   * Die Domain muss zusätzlich in der CSP in public/.htaccess erlaubt werden.
   */
  einwilligungsDienste: [] as Array<{ id: string; name: string; beschreibung: string; src: string }>,
};

export default site;
