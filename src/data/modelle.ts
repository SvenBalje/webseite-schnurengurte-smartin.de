// Inhalte der Modellseiten (/modelle/<slug>/) – übernommen von der alten Webseite.
import type { ImageMetadata } from 'astro';
import mohair from '../assets/bilder/modelle/mohair.webp';
import mohair2 from '../assets/bilder/modelle/mohair-2mm.jpg';
import mohair8 from '../assets/bilder/modelle/mohair-8mm.jpg';
import kordelbaender from '../assets/bilder/kopf/kordelbaender.jpg';
import alpaka8 from '../assets/bilder/modelle/alpaka-8mm.jpg';
import leinen from '../assets/bilder/modelle/leinen.jpg';
import leinenSonder from '../assets/bilder/modelle/leinen-sonderedition.webp';
import leinen1mm from '../assets/bilder/modelle/leinen-1mm.webp';
import wollfaeden from '../assets/bilder/modelle/wollfaeden.webp';
import merino from '../assets/bilder/modelle/merino.webp';
import merinoSchwarz from '../assets/bilder/modelle/merino-schwarz.webp';
import merinoSchwarz2 from '../assets/bilder/modelle/merino-schwarz-2.webp';
import merinoWalnuss from '../assets/bilder/modelle/merino-walnuss.webp';
import schnallenschutz from '../assets/bilder/modelle/schnallenschutz.webp';

export interface Bild {
  src: ImageMetadata;
  alt: string;
}

export interface Variante {
  titel: string;
  bild: Bild;
  text?: string[];
  farben?: string[];
}

export interface Modell {
  slug: string;
  name: string;
  /** Teaser für Karten */
  kurz: string;
  /** Wollfarben für die Farbleiste (Namen aus src/data/farben.ts) */
  farben: string[];
  beschreibung: string;
  bild: Bild;
  absaetze: string[];
  eigenschaftenTitel?: string;
  eigenschaften?: string[];
  nachsatz?: string[];
  varianten: Variante[];
  /** zusätzlicher Textabschnitt (z. B. Walnussfärbung) */
  vertiefung?: { titel: string; absaetze: string[]; zwischentitel?: Record<number, string> };
}

export const modelle: Modell[] = [
  {
    slug: 'mohair',
    name: 'Mohair',
    kurz: 'Edel, leicht und feuchtigkeitsregulierend – die Faser der Angoraziege.',
    farben: ['Natur', 'Sand', 'Hellgrau', 'Dunkelgrau', 'Schwarz', 'Braun', 'Dunkelbraun', 'Rotbraun', 'Bordeaux', 'Türkis', 'Helltürkis', 'Blau'],
    beschreibung:
      'Schnurengurte aus Mohair: leicht, feuchtigkeitsregulierend und antibakteriell. Erhältlich in 2 mm und 8 mm in vielen Farben.',
    bild: { src: mohair, alt: 'Frau kniet im Stroh und schmiegt sich an ein Pony mit langer Mähne' },
    absaetze: [
      'Mohair stammt von der Angoraziege und gehört zu den edlen Zwirnen und den leichtesten Naturfasern, die die Natur zu bieten hat.',
    ],
    eigenschaftenTitel: 'Folgende Dinge bringt Mohair mit:',
    eigenschaften: [
      'Absorbiert Feuchtigkeit bis zu 30 % seines eigenen Gewichtes',
      'Es fühlt sich dabei nicht nass an',
      'Es ist gleichzeitig wasserabweisend',
      'Die Wolle wirkt im Winter wärmend und im Sommer kühlend',
    ],
    nachsatz: [
      'Mohair hat eine antibakterielle Wirkung aufgrund des trockenen Trageklimas, das macht Mohair ideal, um Pilzbildung zu vermeiden.',
    ],
    varianten: [
      {
        titel: 'Mohair 2 mm',
        bild: { src: mohair2, alt: 'Mohair-Schnüre in 2 mm Stärke in Grau, Türkis, Rotbraun, Bordeaux und Natur' },
        farben: ['Hellgrau', 'Helltürkis', 'Dunkelgrau', 'Schwarz', 'Rotbraun', 'Braun', 'Bordeaux', 'Natur', 'Türkis'],
      },
      {
        titel: 'Mohair 8 mm',
        bild: { src: mohair8, alt: 'Mohair-Kordeln in 8 mm Stärke in Schwarz, Grau, Sand, Braun und Braun-Blau' },
        farben: ['Schwarz', 'Dunkelgrau', 'Hellgrau', 'Sand', 'Dunkelbraun', 'Braun/Blau'],
      },
    ],
  },
  {
    slug: 'alpaka',
    name: 'Alpaka',
    kurz: 'Hohlfasern mit einzigartigen Thermoeigenschaften – besonders weich für empfindliche Pferde.',
    farben: ['Weiß', 'Braun', 'Weiß', 'Braun'],
    beschreibung:
      'Schnurengurte aus Alpaka: wärmend im Winter, kühlend im Sommer, besonders weich und langlebig. 8 mm in Braun, Weiß und Braun/Weiß.',
    bild: { src: kordelbaender, alt: 'Fünf Schnurengurte in Braun, Rot und Türkis hängen an einem Holzgeländer am Wasser' },
    absaetze: [
      'Warum die Alpaka-Faser so wertvoll ist, wird bei einem Blick auf die Faserstruktur klar. Die Fasern sind innen hohl und weisen damit einmalige Thermoeigenschaften auf. Alpaka kann im Winter und im Sommer getragen werden.',
      'Das schöne „Hautgefühl“ für uns, die Weichheit des Materials, ist besonders für empfindliche Pferde geeignet. Dies ist auf die Schuppenstruktur der Faser zurückzuführen, die mit 0,4 µm sehr eng beieinanderliegt – dadurch kratzt es nicht.',
    ],
    eigenschaften: [
      'Im Winter wärmend und im Sommer kühlend',
      'Besonders langlebig (dreimal reißfester als Schurwolle)',
      'Feuchtigkeitsabweisend (die Aufnahme von Feuchtigkeit liegt bei 25 %)',
      'Weniger Verfilzungen',
      'Undurchlässig für UV-Strahlung',
    ],
    varianten: [
      {
        titel: 'Alpaka 8 mm',
        bild: { src: alpaka8, alt: 'Drei Alpaka-Kordeln in 8 mm: Braun/Weiß, Weiß und Braun, nummeriert 1 bis 3' },
        farben: ['Braun/Weiß', 'Weiß', 'Braun'],
      },
    ],
  },
  {
    slug: 'leinen',
    name: 'Leinen',
    kurz: 'Atmungsaktiv, reißfest und schmutzabweisend – und stabilisiert den Sattel.',
    farben: ['Natur', 'Natur', 'Schwarz', 'Petrol', 'Beere', 'Braun', 'Blau'],
    beschreibung:
      'Schnurengurte aus Leinen: atmungsaktiv, reißfest, schmutzabweisend und stabilisierend – ideal für rundrippige Pferde mit wenig Widerrist.',
    bild: { src: leinen, alt: 'Aufgerollte naturfarbene Leinenkordel' },
    absaetze: [
      'Leinen hat hervorragende Eigenschaften: Es ist atmungsaktiv, reißfest, schmutzabweisend, bakterizid, antistatisch, schweißmindernd und flusenfrei.',
      'Es nimmt Feuchtigkeit auf und gibt sie in die Umgebung ab. Es ist auch umweltfreundlicher als Baumwolle, und beim Anbau kann auf Pestizide verzichtet werden, da die Stängel der Naturpflanze Flachs sehr resistent gegen Schädlinge sind.',
      'Wegen der guten Feuchtigkeitsaufnahme und der weichen Oberfläche ist Flachs eine komfortable Faser. Sie wird durch häufiges Waschen immer schöner und kann wie Seide glänzen.',
      'Auch erwähnenswert ist, dass Leinengurte einen Sattel stabilisieren können. Das kann für Pferdebesitzer, die rundrippige Pferde mit wenig Widerrist haben, schon interessant sein.',
    ],
    varianten: [
      {
        titel: 'Sonderedition – nur so lange der Vorrat reicht',
        bild: { src: leinenSonder, alt: 'Große Spule mit schwarzer Leinenkordel' },
      },
      {
        titel: '1 mm für die Querverbindung',
        bild: { src: leinen1mm, alt: 'Fünf Garnkonen in Schwarz, Petrol, Beere, Braun und Blau' },
      },
      {
        titel: 'Merino/Leinen',
        bild: { src: wollfaeden, alt: 'Gedrehte Kordel aus Merino und Leinen in Natur und Grau' },
      },
    ],
  },
  {
    slug: 'merino',
    name: 'Merino',
    kurz: 'Kratzt nicht, reguliert die Temperatur und ist eine nachhaltige Faser.',
    farben: ['Weiß', 'Natur', 'Schwarz', 'Weiß', 'Schwarz', 'Walnuss'],
    beschreibung:
      'Schnurengurte aus Merinowolle: kratzt nicht, temperaturregulierend und nachhaltig. Neu in Schwarz und als limitierte, mit Walnuss handgefärbte Edition.',
    bild: { src: merino, alt: 'Aufgerollte weiße Merinokordel' },
    absaetze: ['Schafwolle und speziell Merinowolle bietet von Natur aus viele Vorteile.'],
    eigenschaftenTitel: 'Merinowolle:',
    eigenschaften: [
      'Kratzt nicht',
      'Ist atmungsaktiv und temperaturregulierend – kühlt im Sommer und wärmt im Winter',
      'Bildet keine unangenehmen Gerüche',
      'Speichert Feuchtigkeit, ohne sich feucht anzufühlen',
      'Wärmt auch in feuchtem Zustand',
      'Transportiert Feuchtigkeit nach außen, knittert nicht, ist schwer entflammbar und lädt sich nicht elektrostatisch auf',
      'Hat einen natürlichen UV-Schutz, ist biologisch abbaubar und eine erneuerbare, nachhaltige Faser',
    ],
    varianten: [
      {
        titel: 'Merino/Leinen',
        bild: { src: wollfaeden, alt: 'Gedrehte Kordel aus Merino und Leinen in Natur und Grau' },
      },
      {
        titel: 'Neu: Merino Schwarz',
        bild: { src: merinoSchwarz, alt: 'Große Spule mit schwarzer Merinokordel' },
      },
      {
        titel: 'Merino Schwarz/Weiß',
        bild: { src: merinoSchwarz2, alt: 'Schwarz-weiß gestreifte Merinokordel in Nahaufnahme' },
      },
      {
        titel: 'Handgefärbte Wolle mit Walnuss',
        bild: { src: merinoWalnuss, alt: 'Mit Walnuss handgefärbte Merinokordel in warmem Braun' },
        text: [
          'Ein natürlicher Farbschatz: Ich biete hier eine limitierte Edition von handgefärbter Merinowolle für Eure Sattelgurte an. Es ist eine besondere Methode, die nicht nur umweltfreundlich, sondern auch historisch bedeutsam ist: das Färben von Wolle mit Walnüssen.',
        ],
      },
    ],
    vertiefung: {
      titel: 'Die Tradition des Färbens mit Walnuss',
      absaetze: [
        'Das Färben von Textilien mit Walnüssen hat eine lange Tradition. Schon in der Antike nutzten verschiedene Kulturen die Schalen und Blätter des Walnussbaums, um Stoffe in warme, erdige Töne zu tauchen. Diese natürliche Färbemethode ist nicht nur nachhaltig, sondern verleiht der Wolle auch eine einzigartige, rustikale Ästhetik.',
        'Wolle, die mit Walnuss gefärbt wurde, zeichnet sich durch eine warme, braune Farbpalette aus, die von hellen Beige- bis zu tiefen Schokoladentönen reicht. Jeder Strang handgefärbter Wolle ist einzigartig, da die natürlichen Variationen im Färbeprozess zu unterschiedlichen Nuancen und Schattierungen führen.',
        'Ein weiterer Vorteil der Walnussfärbung ist ihre Umweltfreundlichkeit. Im Gegensatz zu synthetischen Farbstoffen enthalten Walnüsse keine schädlichen Chemikalien, was sie zu einer gesunden Wahl für Mensch und Natur macht.',
        'Handgefärbte Wolle mit Walnuss ist nicht nur ein Zeichen von handwerklicher Sorgfalt und Kreativität, sondern auch ein Beitrag zu nachhaltigem und umweltbewusstem Handarbeiten. Die natürlichen Farben, die durch diesen traditionellen Färbeprozess entstehen, verleihen jedem Projekt einen Hauch von Authentizität und Schönheit.',
      ],
      zwischentitel: { 3: 'Fazit' },
    },
  },
  {
    slug: 'schnallenschutz',
    name: 'Schnallenschutz',
    kurz: 'Aus Wollfilz, 6 mm stark – passend zu Ihrem Schnurengurt.',
    farben: [],
    beschreibung:
      'Schnallenschutz aus Wollfilz (90 % Schurwolle, 10 % Polyester), 6 mm stark – passend zu den handgefertigten Schnurengurten von s.mARTin.',
    bild: { src: schnallenschutz, alt: 'Mehrere Schnallenschützer aus blauem und rotem Wollfilz an einer alten Nähmaschine' },
    absaetze: [],
    eigenschaftenTitel: 'Folgende Dinge bringt der Schnallenschutz mit:',
    eigenschaften: [
      'Schnallenschutz ist aus Wollfilz: 90 % Schurwolle und 10 % Polyester',
      '6 mm stark',
      'Einen dickeren Schnallenschutz kann ich nicht anbieten, da die Durchschubhöhe meiner Nähmaschinen das nicht erlaubt.',
    ],
    varianten: [],
  },
];

export default modelle;
