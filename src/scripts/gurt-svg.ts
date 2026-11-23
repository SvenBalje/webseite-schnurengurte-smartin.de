// Zeichnet einen Schnurengurt als SVG-Text. Wird beim Build (Skizzen ohne JavaScript)
// und im Browser (Gurt-Gestalter) verwendet – deshalb eine reine Funktion ohne DOM.
// Alle Eingaben werden geprüft, weil das Ergebnis im Browser per innerHTML gesetzt wird.

export type Motiv = 'raute' | 'doppelraute' | 'dreieck' | 'streifen' | 'laengs' | 'schlicht';

export interface GurtOptionen {
  schnuere: number;
  /** „#rrggbb“ oder zweifarbig gedreht „#rrggbb/#rrggbb“ */
  grund: string;
  motiv: Motiv;
  motivFarbe: string;
  art?: 'englisch' | 'western';
  form?: 'gerade' | 'anatomisch';
  /** Länge in cm (60–140), streckt die Skizze leicht */
  laenge?: number;
  schnalle?: 'edelstahl' | 'messing';
  /** Farbe des Schnallenschutzes (Wollfilz) */
  filz?: string;
  dRing?: boolean;
}

const ABSTAND = 14; // Abstand der Schnüre
const DICKE = 11; // Schnurstärke
const RAND = 30; // Platz links/rechts (für D-Ringe)
const MOTIVE: Motiv[] = ['raute', 'doppelraute', 'dreieck', 'streifen', 'laengs', 'schlicht'];
const HEX = /^#[0-9a-f]{6}$/i;

const hexOder = (h: string | undefined, ersatz: string) => (h && HEX.test(h) ? h : ersatz);
const maskieren = (s: string) => s.replace(/[&<>"]/g, (z) => `&#${z.charCodeAt(0)};`);
const r1 = (n: number) => Math.round(n * 10) / 10;

type Abschnitt = [number, number];

interface Masse {
  oben: number;
  unten: number;
  mitte: number;
}

/** Abschnitte einer Schnur in Motivfarbe. u = Position −1 (links) … 1 (rechts), abstand = Schnüre von der Mitte */
function motivAbschnitte(motiv: Motiv, u: number, abstand: number, m: Masse): Abschnitt[] {
  const a = Math.abs(u);
  const teile: Abschnitt[] = [];
  const raute = (mitte: number, hoehe: number, breite: number) => {
    const h = hoehe * (1 - a / breite);
    if (h > 2) teile.push([mitte - h, mitte + h]);
  };

  switch (motiv) {
    case 'raute': {
      const aussen = 150 * (1 - a / 0.95);
      const innen = aussen - 46;
      if (aussen > 2) {
        if (innen > 2) teile.push([m.mitte - aussen, m.mitte - innen], [m.mitte + innen, m.mitte + aussen]);
        else teile.push([m.mitte - aussen, m.mitte + aussen]);
      }
      raute(m.mitte, 34, 0.32);
      break;
    }
    case 'doppelraute':
      raute(m.mitte - 92, 78, 0.8);
      raute(m.mitte + 92, 78, 0.8);
      break;
    case 'dreieck': {
      // Spitzen zeigen zur Mitte – oben und unten gespiegelt
      const tiefe = 190 * (1 - a);
      if (tiefe > 2) teile.push([m.oben + 24, m.oben + 24 + tiefe], [m.unten - 24 - tiefe, m.unten - 24]);
      break;
    }
    case 'streifen':
      for (const y of [m.mitte - 120, m.mitte - 14, m.mitte + 92]) teile.push([y, y + 28]);
      break;
    case 'laengs':
      if (Math.round(abstand) % 3 === 2) teile.push([m.oben, m.unten]);
      break;
    case 'schlicht':
      break;
  }
  return teile;
}

/** Rollschnalle (Rahmen mit Rolle) */
function rollschnalle(x: number, y: number, b: number, metall: [string, string]): string {
  return (
    `<rect x="${r1(x)}" y="${y}" width="${r1(b)}" height="44" rx="9" fill="none" stroke="${metall[0]}" stroke-width="6"/>` +
    `<rect x="${r1(x + 6)}" y="${y + 15}" width="${r1(b - 12)}" height="14" rx="7" fill="${metall[1]}"/>`
  );
}

/** D-Ring seitlich; richtung −1 = nach links offen, 1 = nach rechts */
function dRing(x: number, y: number, richtung: -1 | 1, metall: [string, string]): string {
  const w = 16 * richtung;
  return `<path d="M${x} ${y - 15} q${w * 1.6} 0 ${w * 1.6} 15 q0 15 ${-w * 1.6} 15 z" fill="none" stroke="${metall[0]}" stroke-width="5" stroke-linejoin="round"/>`;
}

export function gurtSvg(eingabe: GurtOptionen, titel = ''): string {
  const grundTeile = (eingabe.grund ?? '').split('/');
  const o = {
    schnuere: [13, 15, 17].includes(eingabe.schnuere) ? eingabe.schnuere : 17,
    grund: hexOder(grundTeile[0], '#999999'),
    grund2: grundTeile[1] && HEX.test(grundTeile[1]) ? grundTeile[1] : '',
    motiv: MOTIVE.includes(eingabe.motiv) ? eingabe.motiv : 'schlicht',
    motivFarbe: hexOder(eingabe.motivFarbe, '#999999'),
    art: eingabe.art === 'western' ? 'western' : 'englisch',
    anatomisch: eingabe.form === 'anatomisch',
    laenge: [60, 80, 100, 120, 140].includes(eingabe.laenge ?? 0) ? eingabe.laenge! : 120,
    messing: eingabe.schnalle === 'messing',
    filz: hexOder(eingabe.filz, '#2f211a'),
    dRing: eingabe.dRing === true,
  };
  const metall: [string, string] = o.messing ? ['#c49a3a', '#e2c475'] : ['#b9bdc1', '#d9dcdf'];

  const n = o.schnuere;
  const innenBreite = (n - 1) * ABSTAND + DICKE;
  const breite = RAND * 2 + innenBreite;
  const hoehe = 740 + ((o.laenge - 60) / 20) * 40; // 740 … 900
  const m: Masse = { oben: 128, unten: hoehe - 128, mitte: hoehe / 2 };
  const mitteX = breite / 2;
  const mitteIndex = (n - 1) / 2;

  // Anatomisch: Schnüre laufen zur Mitte taillenförmig zusammen
  const einzug = (y: number) => {
    if (!o.anatomisch || y <= m.oben || y >= m.unten) return 1;
    const t = (y - m.mitte) / ((m.unten - m.oben) / 2);
    return 1 - 0.2 * 0.5 * (1 + Math.cos(Math.PI * t));
  };
  const xBei = (x0: number, y: number) => mitteX + (x0 - mitteX) * einzug(y);
  const pfad = (x0: number, y1: number, y2: number) => {
    if (!o.anatomisch) return `M${r1(x0)} ${r1(y1)}V${r1(y2)}`;
    let d = '';
    const schritte = Math.max(2, Math.ceil((y2 - y1) / 16));
    for (let s = 0; s <= schritte; s++) {
      const y = y1 + ((y2 - y1) * s) / schritte;
      d += `${s ? 'L' : 'M'}${r1(xBei(x0, y))} ${r1(y)}`;
    }
    return d;
  };

  let schnuere = '';
  let zweitfarbe = '';
  let motiv = '';
  let struktur = '';
  for (let i = 0; i < n; i++) {
    const x = RAND + DICKE / 2 + i * ABSTAND;
    const voll = pfad(x, m.oben - 6, m.unten + 6);
    schnuere += `<path d="${voll}" stroke="${o.grund}"/>`;
    if (o.grund2) zweitfarbe += `<path d="${voll}"/>`;
    const u = (i - mitteIndex) / mitteIndex;
    for (const [y1, y2] of motivAbschnitte(o.motiv, u, Math.abs(i - mitteIndex), m)) {
      motiv += `<path d="${pfad(x, y1, y2)}" stroke="${o.motivFarbe}"/>`;
    }
    // Drehung der Kordel andeuten
    struktur += `<path d="${pfad(x, m.oben, m.unten)}" stroke-dashoffset="${(i % 2) * 4}"/>`;
  }

  // Schnallenschutz aus Wollfilz mit Steppnaht
  const schutz = (y: number, h: number) =>
    `<rect x="${RAND - 6}" y="${y}" width="${innenBreite + 12}" height="${h}" rx="9" fill="${o.filz}"/>` +
    `<rect x="${RAND}" y="${y + 6}" width="${innenBreite}" height="${h - 12}" rx="5" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 4"/>`;

  // Enden: Englischgurt mit zwei schmalen Rollschnallen, Westerngurt mit einem großen Ring
  const ende = (y: number) => {
    if (o.art === 'western') {
      const b = innenBreite * 0.7;
      return `<rect x="${r1(mitteX - b / 2)}" y="${y}" width="${r1(b)}" height="44" rx="22" fill="none" stroke="${metall[0]}" stroke-width="7"/>`;
    }
    const b = innenBreite * 0.4;
    const luecke = innenBreite * 0.08;
    return rollschnalle(mitteX - luecke / 2 - b, y, b, metall) + rollschnalle(mitteX + luecke / 2, y, b, metall);
  };

  // Verstärkung mit D-Ringen (anatomisch) und zusätzlicher D-Ring
  let mitteTeile = '';
  if (o.anatomisch) {
    const links = xBei(RAND, m.mitte) - 8;
    const rechts = xBei(RAND + innenBreite, m.mitte) + 8;
    mitteTeile +=
      `<rect x="${r1(links)}" y="${m.mitte - 18}" width="${r1(rechts - links)}" height="36" rx="6" fill="${o.filz}"/>` +
      dRing(r1(links), m.mitte, -1, metall) +
      dRing(r1(rechts), m.mitte, 1, metall);
  }
  if (o.dRing) {
    const y = m.mitte + 110;
    const rechts = xBei(RAND + innenBreite, y) + 4;
    mitteTeile +=
      `<rect x="${r1(rechts - 22)}" y="${y - 12}" width="26" height="24" rx="5" fill="${o.filz}"/>` +
      dRing(r1(rechts + 2), y, 1, metall);
  }

  return (
    `<svg class="gurt" viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" role="img" aria-label="${maskieren(titel)}">` +
    ende(8) +
    `<g fill="none" stroke-width="${DICKE}" stroke-linecap="round" stroke-linejoin="round">${schnuere}</g>` +
    (o.grund2 ? `<g fill="none" stroke="${o.grund2}" stroke-width="${DICKE - 2}" stroke-dasharray="6 6" stroke-linejoin="round">${zweitfarbe}</g>` : '') +
    `<g fill="none" stroke-width="${DICKE}" stroke-linecap="butt" stroke-linejoin="round">${motiv}</g>` +
    `<g fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="${DICKE - 3}" stroke-dasharray="3 5" stroke-linecap="butt">${struktur}</g>` +
    schutz(60, 76) +
    schutz(hoehe - 136, 76) +
    mitteTeile +
    ende(hoehe - 52) +
    `</svg>`
  );
}
