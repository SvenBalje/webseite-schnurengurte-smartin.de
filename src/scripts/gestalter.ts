// Gurt-Gestalter im Browser: liest die Auswahl, zeichnet die Skizze neu, rechnet den Richtpreis
// und übergibt den Entwurf ans Kontaktformular. Texte werden nur per textContent gesetzt;
// die Skizze entsteht aus geprüften Werten (siehe gurt-svg.ts).
import { gurtSvg, type Motiv } from './gurt-svg';
import { euro, preisgruppen } from '../data/preise';
import {
  materialVon,
  richtpreis,
  zusammenfassung,
  kurzText,
  zuGurtOptionen,
  startAuswahl,
  type Auswahl,
} from '../data/konfigurator';

for (const gestalter of document.querySelectorAll<HTMLElement>('[data-gestalter]')) {
  const buehne = gestalter.querySelector<HTMLElement>('[data-gurt]')!;
  const preisFeld = gestalter.querySelector<HTMLElement>('[data-preis]')!;
  const preisKurz = gestalter.querySelector<HTMLElement>('[data-preis-kurz]');
  const liste = gestalter.querySelector<HTMLElement>('[data-liste]')!;
  const meldung = gestalter.querySelector<HTMLElement>('[data-meldung]')!;
  const paletten = [...gestalter.querySelectorAll<HTMLFieldSetElement>('[data-palette]')];
  let material = startAuswahl.material;

  const wert = (feld: string) =>
    gestalter.querySelector<HTMLInputElement>(`fieldset:not([hidden]) input[data-feld="${feld}"]:checked`)?.value ?? '';

  const lesen = (): Auswahl => ({
    art: wert('art') === 'western' ? 'western' : 'englisch',
    form: wert('form') === 'anatomisch' ? 'anatomisch' : 'gerade',
    material: wert('material'),
    schnuere: Number(wert('schnuere')),
    laenge: Number(wert('laenge')),
    grund: wert('grund'),
    motiv: wert('motiv') as Motiv,
    motivFarbe: wert('motivFarbe'),
    schnalle: wert('schnalle') === 'messing' ? 'messing' : 'edelstahl',
    filz: wert('filz'),
    dRing: wert('dRing') === 'ja',
  });

  /** Palette des neuen Materials zeigen; gleiche Farbe behalten, sonst die erste wählen */
  const materialWechseln = (neu: string): string[] => {
    const hinweise: string[] = [];
    for (const art of ['grund', 'motivFarbe'] as const) {
      const bisher = wert(art);
      for (const p of paletten.filter((p) => p.dataset.palette === art)) p.hidden = p.dataset.material !== neu;
      const sichtbar = paletten.find((p) => p.dataset.palette === art && !p.hidden);
      const radios = [...(sichtbar?.querySelectorAll<HTMLInputElement>('input') ?? [])];
      const gleich = radios.find((r) => r.value === bisher);
      // Motivfarbe möglichst anders als die Grundfarbe, sonst ist das Motiv unsichtbar
      const grundJetzt = art === 'motivFarbe' ? wert('grund') : '';
      const wahl = gleich ?? radios.find((r) => r.value !== grundJetzt) ?? radios[0];
      if (wahl) wahl.checked = true;
      if (!gleich && wahl && bisher) {
        hinweise.push(`${art === 'grund' ? 'Farbe' : 'Motivfarbe'} auf ${wahl.value} gesetzt – ${bisher} gibt es in ${materialVon(neu).name} nicht.`);
      }
    }
    // Aufpreise hängen von der Preisgruppe ab
    const extras = preisgruppen[materialVon(neu).gruppe].extras;
    for (const el of gestalter.querySelectorAll<HTMLElement>('[data-aufpreis]')) {
      const e = el.dataset.aufpreis as keyof typeof extras;
      if (e in extras) el.textContent = `+${euro(extras[e])}`;
    }
    return hinweise;
  };

  const aktualisieren = () => {
    const hinweise: string[] = [];
    const neuesMaterial = wert('material');
    if (neuesMaterial !== material) {
      hinweise.push(...materialWechseln(neuesMaterial));
      material = neuesMaterial;
    }
    const a = lesen();
    for (const p of paletten) if (p.dataset.palette === 'motivFarbe') p.disabled = a.motiv === 'schlicht';

    buehne.innerHTML = gurtSvg(zuGurtOptionen(a), `Skizze: ${kurzText(a)}`);
    const preis = `ca. ${euro(richtpreis(a).summe)}`;
    preisFeld.textContent = preis;
    if (preisKurz) preisKurz.textContent = preis;

    liste.replaceChildren(
      ...zusammenfassung(a)
        .filter(([k]) => k !== 'Richtpreis')
        .map(([k, v]) => {
          const zeile = document.createElement('div');
          const dt = document.createElement('dt');
          const dd = document.createElement('dd');
          dt.textContent = k;
          dd.textContent = v;
          zeile.append(dt, dd);
          return zeile;
        }),
    );
    meldung.textContent = [...hinweise, `Richtpreis ${preis}.`].join(' ');
  };

  gestalter.addEventListener('change', aktualisieren);

  gestalter.querySelector('[data-entwurf-anfragen]')?.addEventListener('click', () => {
    const feld = document.querySelector<HTMLTextAreaElement>('#kontakt textarea[name="nachricht"]');
    if (!feld) return;
    const text = ['Mein Entwurf:', ...zusammenfassung(lesen()).map(([k, v]) => `– ${k}: ${v}`)].join('\n');
    // Einen früher übernommenen Entwurf ersetzen statt anzuhängen
    const ohneAltenEntwurf = feld.value.replace(/^Mein Entwurf:\n(?:– .*\n?)*\n*/m, '');
    feld.value = `${text}\n\n${ohneAltenEntwurf}`.trimEnd() + '\n';
    requestAnimationFrame(() => feld.focus({ preventScroll: true }));
  });
}
