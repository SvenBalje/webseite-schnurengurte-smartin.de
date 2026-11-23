// Großansicht für die Galerie. Ohne JavaScript öffnen die Links einfach das große Bild.
// Geblättert wird nur durch die Bilder, die der Filter gerade zeigt.
const dialog = document.querySelector<HTMLDialogElement>('.leuchtkasten');
const alleLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-leuchtkasten]')];

if (dialog && alleLinks.length) {
  const bild = dialog.querySelector('img')!;
  const text = dialog.querySelector('figcaption')!;
  const zaehler = dialog.querySelector<HTMLElement>('[data-zaehler]')!;
  let links = alleLinks;
  let aktuell = 0;

  const sichtbare = () => alleLinks.filter((a) => !a.closest('li')?.hidden);

  const vorladen = (index: number) => {
    const link = links[(index + links.length) % links.length];
    if (link) new Image().src = link.href;
  };

  const zeige = (index: number) => {
    aktuell = (index + links.length) % links.length;
    const link = links[aktuell];
    bild.src = link.href;
    bild.alt = link.dataset.alt ?? '';
    bild.hidden = false;
    text.textContent = link.dataset.alt ?? '';
    zaehler.textContent = `${aktuell + 1} / ${links.length}`;
    vorladen(aktuell + 1);
    vorladen(aktuell - 1);
  };

  alleLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links = sichtbare();
      zeige(links.indexOf(link));
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-zurueck]')?.addEventListener('click', () => zeige(aktuell - 1));
  dialog.querySelector('[data-weiter]')?.addEventListener('click', () => zeige(aktuell + 1));
  dialog.querySelector('[data-schliessen]')?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') zeige(aktuell - 1);
    if (e.key === 'ArrowRight') zeige(aktuell + 1);
  });

  // Wischen auf Touch-Geräten
  let startX: number | null = null;
  dialog.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const weg = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(weg) > 50) zeige(aktuell + (weg < 0 ? 1 : -1));
  });

  // Klick neben das Bild (auf den dunklen Grund) schließt
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || (e.target as Element).classList.contains('leuchtkasten__bild')) dialog.close();
  });

  // Fokus nach dem Schließen zurück auf das zuletzt geöffnete Bild
  dialog.addEventListener('close', () => links[aktuell]?.focus());
}
