// Galeriebilder in der Reihenfolge der alten Seite, nach Gurtart gruppiert.
// Die Bilder liegen in src/assets/bilder/galerie/galerie-NN.*
import type { ImageMetadata } from 'astro';

const dateien = import.meta.glob<{ default: ImageMetadata }>('../assets/bilder/galerie/*.{jpg,webp}', {
  eager: true,
});

function bild(nr: number): ImageMetadata {
  const name = `galerie-${String(nr).padStart(2, '0')}.`;
  const treffer = Object.entries(dateien).find(([pfad]) => pfad.includes(name));
  if (!treffer) throw new Error(`Galeriebild ${nr} fehlt`);
  return treffer[1].default;
}

/** Alt-Texte: Gurtart und Farben, wie auf dem Foto zu sehen */
const beschreibungen: Record<number, string> = {
  1: 'Englischgurt in Braun mit hellbraunen Längsschnüren',
  2: 'Englischgurt in Natur mit grünen Querbändern',
  3: 'Englischgurt in Natur und Schwarz',
  4: 'Westerngurt in Natur mit türkisem Rautenmuster',
  5: 'Westerngurt in Natur mit pinkem Rautenmuster',
  6: 'Westerngurt in Dunkelbraun',
  7: 'Anatomisch geformter Gurt in Natur und Braun',
  8: 'Anatomisch geformter Gurt in Natur und Grün',
  9: 'Zwei anatomisch geformte Gurte in Natur und Schwarz',
  10: 'Zwei anatomisch geformte Gurte in Braun und Grau',
  11: 'Anatomisch geformter Gurt in Bordeaux',
  12: 'Zwei anatomisch geformte Gurte in Natur und Türkis',
  13: 'Schnurengurt in Braun mit orangefarbenem Rautenmuster',
  14: 'Schnurengurt in Natur mit königsblauem Rautenmuster',
  15: 'Schnurengurt in Natur mit Petrol',
  16: 'Schnurengurt in Grau-Weiß gemustert mit Schwarz',
  17: 'Schnurengurt in Grau-Weiß gemustert mit Bordeaux',
  18: 'Schnurengurt in Braun mit türkisem Muster',
  19: 'Schnurengurt in Natur mit lila Rautenmuster',
  20: 'Schnurengurt in Natur mit blauen Akzenten',
  21: 'Schnurengurt in Natur und Schwarz mit geometrischem Muster',
  22: 'Schnurengurt in Natur mit schwarzem Dreieck',
  23: 'Schnurengurt in Grau gemustert mit Dunkelgrün',
  24: 'Schnurengurt in Grau gemustert mit Schwarz',
  25: 'Schwarzer Gurt mit grauen Schnallenschützern, Nahaufnahme',
  26: 'Schnurengurt in Natur und Schwarz',
  27: 'Schnurengurt in Natur mit braunem Dreieck',
  28: 'Schnurengurt in Hellgrau und Natur',
  29: 'Schnurengurt in Natur mit braunen Querbändern',
  30: 'Westerngurt in Natur mit pinkem Dreieck',
  31: 'Zwei Schnurengurte in Grau und Hellgrün',
  32: 'Schnurengurt in Natur mit braunen Akzenten',
  33: 'Westerngurt in Braun mit Muster',
  34: 'Westerngurt in Natur mit Petrol',
  35: 'Schnurengurt in Rostbraun',
  36: 'Westerngurt in Bordeaux mit rotem Muster',
  37: 'Westerngurt in Natur mit türkisem Rautenmuster',
  38: 'Westerngurt in Braun mit Türkis',
  39: 'Schnurengurt in Schwarz und Natur',
  40: 'Schnurengurt in Natur mit braunen Enden',
  41: 'Schnurengurt in Braun mit Natur, Rautenmuster',
  42: 'Westerngurt in Schwarz mit Lila',
  43: 'Westerngurt in Braun mit hellblauer Raute',
  44: 'Schnurengurt in Braun und Natur',
  45: 'Schnurengurt in Natur',
  46: 'Westerngurt in Braun mit Dunkelgrün',
  47: 'Schnurengurt in Natur mit grauen Enden',
  48: 'Schnurengurt in Schwarz mit türkisem Muster',
  49: 'Schnurengurt in Schwarz mit rotem Rautenmuster',
  50: 'Schnurengurt in Grau mit lila Raute',
  51: 'Schnurengurt in Dunkelblau',
  52: 'Schnurengurt in Dunkelblau, schmal',
  53: 'Westerngurt in Rostbraun',
  54: 'Westerngurt in Braun mit Natur',
  55: 'Schnurengurt in Dunkelbraun mit Rautenmuster',
  56: 'Schnurengurt in Schwarz mit braunem Dreieck',
  57: 'Langer Schnurengurt in Braun',
  58: 'Langer Schnurengurt in Dunkelbraun',
  59: 'Schnurengurt in Natur mit bordeauxroter Raute',
  60: 'Leinengurt in Natur',
  61: 'Schnurengurt in Schwarz und Natur',
  62: 'Edelstahl-Rollschnallen am Gurt, Nahaufnahme',
  63: 'Schnurengurt in Schwarz und Natur',
  64: 'Leinengurt in Natur mit schwarzem Dreieck',
  65: 'Leinengurt in Natur',
};

export interface GalerieGruppe {
  titel: string;
  text: string;
  bilder: { src: ImageMetadata; alt: string }[];
}

function gruppe(titel: string, text: string, von: number, bis: number): GalerieGruppe {
  const bilder = [];
  for (let nr = von; nr <= bis; nr++) bilder.push({ src: bild(nr), alt: beschreibungen[nr] });
  return { titel, text, bilder };
}

export const galerie: GalerieGruppe[] = [
  gruppe('Englischgurte', '', 1, 3),
  gruppe('Westerngurte', '', 4, 6),
  gruppe('Anatomisch geformt', 'Mit zwei D-Ringen und Verstärkung, der Form des Pferdes angepasst.', 7, 12),
  gruppe('Weitere Arbeiten', 'Jeder Gurt ein Unikat – von schlicht bis aufwändig.', 13, 65),
];

export default galerie;
