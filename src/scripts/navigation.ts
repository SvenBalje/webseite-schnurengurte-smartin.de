// Mobiles Menü und Untermenüs. Ohne JavaScript greift public/ohne-js.css (per <noscript> geladen).

const menueKnopf = document.querySelector<HTMLButtonElement>('.menue-knopf');
const unterKnoepfe = [...document.querySelectorAll<HTMLButtonElement>('.unter-knopf')];

function setze(knopf: HTMLButtonElement, offen: boolean) {
  knopf.setAttribute('aria-expanded', String(offen));
}

menueKnopf?.addEventListener('click', () => {
  setze(menueKnopf, menueKnopf.getAttribute('aria-expanded') !== 'true');
});

for (const knopf of unterKnoepfe) {
  knopf.addEventListener('click', () => {
    const offen = knopf.getAttribute('aria-expanded') !== 'true';
    unterKnoepfe.forEach((k) => setze(k, false));
    setze(knopf, offen);
  });
}

// Untermenüs schließen bei Klick außerhalb und mit Escape
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.hat-untermenue')) unterKnoepfe.forEach((k) => setze(k, false));
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const offen = unterKnoepfe.find((k) => k.getAttribute('aria-expanded') === 'true');
  if (offen) {
    setze(offen, false);
    offen.focus();
  } else if (menueKnopf?.getAttribute('aria-expanded') === 'true') {
    setze(menueKnopf, false);
    menueKnopf.focus();
  }
});
