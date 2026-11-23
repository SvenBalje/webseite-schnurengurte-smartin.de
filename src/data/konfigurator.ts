// Optionen des Gurt-Gestalters – abgeleitet aus den Inhalten der Webseite:
// Materialien und Farben (src/data/modelle.ts), Preise und Aufpreise (src/data/preise.ts),
// Motive und Schnallenschutz-Farben (Galerie-Fotos). Wird beim Build und im Browser genutzt.
import { preisgruppen, euro, laengen, type Preisgruppe } from './preise';
import { skizzenFarbe } from './farben';
import type { GurtOptionen, Motiv } from '../scripts/gurt-svg';

export interface Material {
  id: string;
  name: string;
  gruppe: Preisgruppe;
  /** Farbnamen wie auf der Modellseite; „A/B“ = zweifarbig gedrehte Kordel */
  farben: string[];
}

export const materialien: Material[] = [
  {
    id: 'mohair',
    name: 'Mohair',
    gruppe: 'mohairAlpaka',
    farben: ['Natur', 'Sand', 'Hellgrau', 'Dunkelgrau', 'Schwarz', 'Braun', 'Dunkelbraun', 'Rotbraun', 'Bordeaux', 'Türkis', 'Helltürkis', 'Blau', 'Braun/Blau'],
  },
  { id: 'alpaka', name: 'Alpaka', gruppe: 'mohairAlpaka', farben: ['Weiß', 'Braun', 'Braun/Weiß'] },
  { id: 'leinen', name: 'Leinen', gruppe: 'leinenMerino', farben: ['Natur', 'Schwarz', 'Petrol', 'Beere', 'Braun', 'Blau'] },
  { id: 'merino', name: 'Merino', gruppe: 'leinenMerino', farben: ['Weiß', 'Natur', 'Schwarz', 'Schwarz/Weiß', 'Walnuss'] },
  { id: 'merino-leinen', name: 'Merino/Leinen', gruppe: 'leinenMerino', farben: ['Natur', 'Hellgrau', 'Natur/Hellgrau'] },
];

export const arten = [
  { id: 'englisch', name: 'Englischgurt', text: 'mit zwei Schnallen je Seite' },
  { id: 'western', name: 'Westerngurt', text: 'mit Ring je Seite' },
] as const;

export const formen = [
  { id: 'gerade', name: 'Gerade', text: '' },
  { id: 'anatomisch', name: 'Anatomisch geformt', text: 'zwei D-Ringe mit Verstärkung' },
] as const;

export const breiten = [
  { wert: 13, text: 'für Ponys bis Stockmaß 1 m' },
  { wert: 15, text: 'für Endmaßponys' },
  { wert: 17, text: 'für Warmblüter' },
] as const;

export const motive: Array<{ id: Motiv; name: string }> = [
  { id: 'raute', name: 'Raute' },
  { id: 'doppelraute', name: 'Doppelraute' },
  { id: 'dreieck', name: 'Dreiecke' },
  { id: 'streifen', name: 'Querbänder' },
  { id: 'laengs', name: 'Längsstreifen' },
  { id: 'schlicht', name: 'Schlicht' },
];

export const schnallen = [
  { id: 'edelstahl', name: 'Edelstahl-Rollschnalle', text: 'rostfrei, V2A' },
  { id: 'messing', name: 'Messingschnalle eng', text: '' },
] as const;

/** Schnallenschutz aus Wollfilz – Farben wie auf den Fotos */
export const filzFarben = ['Schwarz', 'Dunkelbraun', 'Rot', 'Bordeaux', 'Blau', 'Grün', 'Türkis', 'Beere'];

export interface Auswahl {
  art: 'englisch' | 'western';
  form: 'gerade' | 'anatomisch';
  material: string;
  schnuere: number;
  laenge: number;
  grund: string;
  motiv: Motiv;
  motivFarbe: string;
  schnalle: 'edelstahl' | 'messing';
  filz: string;
  dRing: boolean;
}

export const startAuswahl: Auswahl = {
  art: 'englisch',
  form: 'gerade',
  material: 'mohair',
  schnuere: 17,
  laenge: 120,
  grund: 'Natur',
  motiv: 'raute',
  motivFarbe: 'Türkis',
  schnalle: 'edelstahl',
  filz: 'Dunkelbraun',
  dRing: false,
};

export const materialVon = (id: string) => materialien.find((m) => m.id === id) ?? materialien[0];

/** Richtpreis: Grundpreis nach Material und Länge plus Aufpreise laut Preisliste */
export function richtpreis(a: Auswahl): { summe: number; posten: Array<[string, number]> } {
  const g = preisgruppen[materialVon(a.material).gruppe];
  const stufe = Math.max(0, laengen.indexOf(a.laenge as (typeof laengen)[number]));
  const posten: Array<[string, number]> = [[`Grundpreis bis ${laengen[stufe]} cm`, g.grundpreise[stufe]]];
  if (a.art === 'western') posten.push(['Westerngurt', g.extras.western]);
  if (a.form === 'anatomisch') posten.push(['Anatomisch', g.extras.anatomisch]);
  if (a.motiv === 'dreieck') posten.push(['Dreiecke', g.extras.dreiecke]);
  if (a.schnalle === 'messing') posten.push(['Messingschnalle eng', g.extras.messing]);
  if (a.dRing) posten.push(['Zusätzlicher D-Ring', g.extras.dRing]);
  return { summe: posten.reduce((s, [, p]) => s + p, 0), posten };
}

const name = <T extends { id: string; name: string }>(liste: readonly T[], id: string) =>
  liste.find((e) => e.id === id)?.name ?? id;

/** Zusammenfassung als Paare (Bezeichnung, Wert) – für die Liste und die Anfrage */
export function zusammenfassung(a: Auswahl): Array<[string, string]> {
  const motiv = a.motiv === 'schlicht' ? 'schlicht' : `${name(motive, a.motiv)} in ${a.motivFarbe}`;
  return [
    ['Modell', `${name(arten, a.art)}, ${a.form === 'anatomisch' ? 'anatomisch geformt' : 'gerade'}`],
    ['Material', `${materialVon(a.material).name}, ${a.schnuere} Schnüre, bis ${a.laenge} cm`],
    ['Farbe', a.grund],
    ['Motiv', motiv],
    ['Schnalle', name(schnallen, a.schnalle)],
    ['Schnallenschutz', `Wollfilz in ${a.filz}`],
    ...(a.dRing ? ([['Extra', 'zusätzlicher D-Ring']] as Array<[string, string]>) : []),
    ['Richtpreis', `ca. ${euro(richtpreis(a).summe)}`],
  ];
}

/** Kurzbeschreibung für die Bildbeschreibung der Skizze */
export const kurzText = (a: Auswahl) =>
  `${name(arten, a.art)} aus ${materialVon(a.material).name}, ${a.grund}, ${a.motiv === 'schlicht' ? 'ohne Motiv' : `${name(motive, a.motiv)} in ${a.motivFarbe}`}`;

export function zuGurtOptionen(a: Auswahl): GurtOptionen {
  return {
    schnuere: a.schnuere,
    grund: skizzenFarbe(a.grund),
    motiv: a.motiv,
    motivFarbe: skizzenFarbe(a.motivFarbe).split('/')[0],
    art: a.art,
    form: a.form,
    laenge: a.laenge,
    schnalle: a.schnalle,
    filz: skizzenFarbe(a.filz),
    dRing: a.dRing,
  };
}
