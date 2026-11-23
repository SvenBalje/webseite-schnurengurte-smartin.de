// Preise der Schnurengurte – eine Quelle für die Preisseite und den Richtpreis im Gurt-Gestalter.
// Stand: Preisliste der bisherigen Webseite.

export type Preisgruppe = 'leinenMerino' | 'mohairAlpaka';
export type Extra = 'dRing' | 'dreiecke' | 'western' | 'messing' | 'anatomisch';

/** Längenstufen in cm („bis …“) */
export const laengen = [60, 80, 100, 120, 140] as const;

export const extraNamen: Record<Extra, { name: string; info?: string }> = {
  dRing: { name: 'D-Ring' },
  dreiecke: { name: 'Dreiecke' },
  western: { name: 'Westerngurte' },
  messing: { name: 'Messingschnalle eng' },
  anatomisch: { name: 'Anatomisch', info: 'zwei D-Ringe mit Verstärkung' },
};

export const preisgruppen: Record<Preisgruppe, { titel: string; grundpreise: number[]; extras: Record<Extra, number> }> = {
  leinenMerino: {
    titel: 'Leinen, Merino und Leinen-Merino',
    grundpreise: [98.5, 123.5, 148.5, 173.5, 198.5],
    extras: { dRing: 5, dreiecke: 20, western: 8, messing: 5, anatomisch: 15 },
  },
  mohairAlpaka: {
    titel: 'Mohair und Alpaka',
    grundpreise: [118.5, 143.5, 168.5, 193.5, 218.5],
    extras: { dRing: 5, dreiecke: 20, western: 12, messing: 8, anatomisch: 15 },
  },
};

const format = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
/** 98.5 → „98,50 €“ */
export const euro = (betrag: number) => format.format(betrag);
