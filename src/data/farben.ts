// Wollfarben für Gurt-Gestalter und Farbleisten.
// Namen aus den Farblisten der Modellseiten (src/data/modelle.ts) und den Garn- und Gurtfotos;
// die Hex-Werte sind Annäherungen für die Bildschirmdarstellung.

const farben: Record<string, string> = {
  Natur: '#ddd3bd',
  Weiß: '#efece4',
  Sand: '#c4a77c',
  Hellgrau: '#b3b2ad',
  Dunkelgrau: '#55555a',
  Braun: '#7a5136',
  Dunkelbraun: '#43291b',
  Walnuss: '#8a5a36',
  Schwarz: '#1f1d1d',
  Türkis: '#17979c',
  Helltürkis: '#7cc9c4',
  Petrol: '#0e5a61',
  Blau: '#2b55a8',
  Bordeaux: '#7c1f36',
  Beere: '#b0184f',
  Rotbraun: '#93391e',
  // Filzfarben des Schnallenschutzes (aus den Fotos)
  Rot: '#a8282d',
  Grün: '#2f5d3a',
};

/** Hex-Werte zu einem Farbnamen; „Braun/Weiß“ ergibt beide Farben */
export function hexFuer(name: string): string[] {
  return name
    .split('/')
    .map((teil) => farben[teil.trim()])
    .filter((hex): hex is string => Boolean(hex));
}

/** Farbe für die Gurtskizze: einfarbig „#rrggbb“, zweifarbig gedreht „#rrggbb/#rrggbb“ */
export const skizzenFarbe = (name: string) => hexFuer(name).join('/') || '#999999';
