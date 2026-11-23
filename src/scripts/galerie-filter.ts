// Filter der Galerie nach Gurtart. Ohne JavaScript bleibt die Leiste verborgen und alle Bilder sind sichtbar.
const leiste = document.querySelector<HTMLElement>('[data-galerie-filter]');
const status = document.querySelector<HTMLElement>('[data-galerie-status]');
const eintraege = [...document.querySelectorAll<HTMLLIElement>('[data-galerie] > li')];

if (leiste && eintraege.length) {
  const knoepfe = [...leiste.querySelectorAll<HTMLButtonElement>('button[data-filter]')];

  const filtern = (knopf: HTMLButtonElement) => {
    const wahl = knopf.dataset.filter;
    let sichtbar = 0;
    for (const li of eintraege) {
      li.hidden = wahl !== 'alle' && li.dataset.gruppe !== wahl;
      if (!li.hidden) sichtbar++;
    }
    for (const k of knoepfe) k.setAttribute('aria-pressed', String(k === knopf));
    if (status) {
      const text = knopf.dataset.text;
      status.textContent = `${sichtbar} ${sichtbar === 1 ? 'Gurt' : 'Gurte'} angezeigt.${text ? ` ${text}` : ''}`;
    }
  };

  for (const k of knoepfe) k.addEventListener('click', () => filtern(k));
}
