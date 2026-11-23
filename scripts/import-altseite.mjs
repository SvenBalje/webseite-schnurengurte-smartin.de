// Einmaliger Import der Bilder und Downloads von der alten Webflow-Seite (November 2026).
// EINMALIG – nach dem Livegang der neuen Seite nicht erneut ausführen (die Quelle gibt es dann nicht mehr).
// Aufruf: node scripts/import-altseite.mjs
// Die Texte wurden von Hand in die Astro-Seiten übernommen; dieses Skript holt nur Dateien.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASIS = 'https://www.schnurengurte-smartin.de/images/';
const ZIEL = fileURLToPath(new URL('../src/assets/bilder/', import.meta.url));

/** Webflow-Dateiname → Zielpfad (ohne Endung, die Endung bleibt die des Originals) */
const bilder = {
  // Logo und Kopfbilder (Slider der alten Startseite)
  '6274fd667224241e825c7033_6242bc37faee5cc22ab7ebda_a21ff4fb43f8b0f2c3bbe293290b6696.png': 'logo/logo',
  '6424fcf1b6ff9ad2100035fd_f8471c0a782050c44931e367ae475698.webp': 'kopf/gurte-am-zaun',
  '6396d4ad10c582cec6edf0ba_56f74a4d79009b5f0134a2c82df04032.webp': 'kopf/kopf-2',
  '627a3f93226f355d1d003209_6242bef4a1c3973406d1f1ba_ABDD905A-F27B-4907-B26F-1AD02D8807AB_11zon.jpg': 'kopf/kordelbaender',
  '627a3f93d5cd4f2fb007473e_6242bd89e286b909683a58fe_9382711E-1E4E-4DFA-88B4-988019E5DB2A_11zon.jpg': 'kopf/schnurengurte',
  '622eeee812e23f440846cd51_d70c84a2910c4be72d7671d425dfde0d.jpg': 'kopf/kopf-5',
  // Startseite
  '62550caa3e8e42cde1258f08_b06e9a8f7563afc6122e179d6b26f59b.jpg': 'start/handgefertigt',
  '627b5fcae6ebae4b142e0830_c621868e51bde573c6b86fb69d67caf3.jpg': 'start/material',
  '62550caa77da40cd3d15c577_372e72f9823538fbdf689dd2e0e1a15d.jpg': 'start/braunes-pferd',
  '627b5fcb142070023ab0173f_3821c7e50218ca3f824be326a3d2d22e.jpg': 'start/modelle-breiten',
  '62550caa57353afc1a872484_7b38763fb0a9bbaffc917725ad72dd0b.jpg': 'start/angebote',
  // Blankets & Satteldecken
  '67455652382db0afb867bdf1_Schabracke aus Sattelfilz.webp': 'blankets/schabracke-sattelfilz',
  '67455652ae6c0d41b47f319f_Sattelfilz.webp': 'blankets/sattelfilz-vb',
  '6745559a488dd33f2e2dd40b_Sattelfilz. 1.webp': 'blankets/sattelfilz-wb',
  // Handgestrickt
  '658421a871553a14bb124cdb_4f4e13411465713b7cec8d9d785f534c.webp': 'handgestrickt/wolle',
  '66b1cb3aa1d970b7264f868a_d7832fc0e70adcffd272eb8bea994619.webp': 'handgestrickt/merino-pullover',
  // Modelle
  '65389d1a2fd7aa16f1b2bb2f_7888c35b5350221db2c0ab3dae824f0b.webp': 'modelle/mohair',
  '62c528e2e127ab8c2f9f038d_2d3ab6059af7458514b9289a44d3b018.jpg': 'modelle/mohair-2mm',
  '62c528e34443c50a9742ccde_f2b6368d8ded26b4592086923aa4fd0e.jpg': 'modelle/mohair-8mm',
  '6267aaadebc4935c0180fd6f_9138b1b96c274b58a68740040f1681bc.jpg': 'modelle/alpaka-8mm',
  '6267aaad545a9039009ecfbc_861b564468609a3b664a424593fe9687.jpg': 'modelle/leinen',
  '6a67296c0f692c9e7866858b_bd655b3762513def894be365ae704c57.webp': 'modelle/leinen-sonderedition',
  '65e57a82f77036da3db54732_82476a31b64c32ed5ba38161d78f09e6.webp': 'modelle/leinen-1mm',
  '665feb50ec629b96593a0db4_1495f16ca374d9fc48099dfe3d923c8b.webp': 'modelle/wollfaeden',
  '63a2bf2d0a748dc502848735_image1.webp': 'modelle/merino',
  '6a706c07601d6d4a6a50a022_f5fdcc6ad7beb5a3279eb70666ebb0c8_result.webp': 'modelle/merino-schwarz',
  '6656e12520d93a87ccf8ea76_attachment_1_image0.webp': 'modelle/merino-schwarz-2',
  '6662dd7c355718f76915657e_e611fbfcdaa5961a853cc65478aca91c.webp': 'modelle/merino-walnuss',
  '640ac88097b40fbfd55e46b4_ed78d4e4545ea58131f38a53480acd9d.webp': 'modelle/schnallenschutz',
};

// Galerie: Reihenfolge wie auf der alten Seite, Doppelte entfernt
const galerie = `688dbd0e146a7b795448aae5_Englisch3.webp
688dbd0a95c8dca30a59179d_Englisch1.webp
688dbd052ce52119112ad759_Englisch.webp
688dbd023f79e133d6d61a81_Westerngurt.webp
688dbd02c76067d79d7b0ed9_Westerngurt1.webp
688dbd0602c1aaa19bb97ba7_Westerngurt2.webp
688dbd18a2c26923a1bfbd96_Anatomisch3.webp
688dbd13164bf084f51ac85c_Anatomisch2.webp
688dbd0ea1a07e32fbc1edc9_Anatomisch.webp
688dbd0e373079e6fc7f7d30_Anatomisch1.webp
688dbd05eba9abb3d7fa418c_Anatomisch4.webp
688dbd045eaef5011d08d972_Anatomisch5.webp
67d3a5cf1d99b6075839a43c_eac1563a028c710cfa005689f45e226d.webp
6711cfc0216cf3489134749f_9b0f94a7ba71e42b7346406d114ff3fe.webp
6711cfc03f91ee2edac0b0d7_fe7241f29e25ab3b8124ad1615eb28ac.webp
668636cded309d222f82c150_c01ef2c748f74669a3c915bd26ffe31d.webp
6656e55c3a2ca4a4f33ffdd3_attachment_4_image3.webp
6656e556c6985916635809a0_attachment_1_image0.webp
6656e5540370437b41208b53_attachment_2_image1.webp
6656e5535ffd080b5d3a2e4a_attachment_3_image2.webp
6656e1876022056c4edda93e_attachment_5_image4.webp
6656e18722ff1c1f28183e1a_attachment_2_image1.webp
6656e187f0cf4a1cff908908_attachment_4_image3.webp
6656e187b1ea0092a14733a7_attachment_3_image2.webp
65d44a21284089e5169d408b_e27155c8214dcae397a2339d95836ad1.webp
65d44a21cdeb99e6434449ee_467fe37e6ab392025c224476d592ad64.webp
65d44994adcc787a2243f7e3_35e28f965ed568c1c78c9357663967f4.webp
65d44994fd1f245d084c02d7_dab64d8ee3d8edfc47718f5300b1575f.webp
639fe5efde939440aa40110f_65453b687f2a4d5e28f9cf037702d922.webp
63987572613a27c97c80aeef_e988fba13198d34fffa2a47fefd3d334.webp
6281d573d51b903b5cd8addc_0d532667a5abba50ecd990c1152cf8c5.jpg
6281d58b1f774b30cab2c957_dbad0d19f5c4f75ac23c6eb3ed1bb2fe.jpg
622eef0d4dde553cb6129fb6_d93817369d9993f2bb51679324ab0593.jpg
622eeee960f8f5c831ee5d11_89c6f02f6fece8728fe85d8411500ae3.jpg
6242bbe1955ccbe21e300a49_49ea7a9655d7819bcb77b102e0a85e00.jpg
627b3cbd3e354e8b941b87dd_6242bd89bc230c6c41ae2527_82EC7292-4243-40C2-BB32-5A29876F3C78_11zon.jpg
627b3cbe9aa1fc9d17a2e28b_6242bd89e99900ea9c51c179_458C2CD3-BE69-4EE2-AE14-D689DE1752D1_11zon.jpg
627b3cbd3504b926dd1a593c_6242bd89c64a97fdb3e72fff_650C9305-DB21-4AAA-A051-B05B956851A4_11zon.jpg
62550ec536259f1100e3fbf2_46a99b21861a20943a9404f405495370.jpg
62550ec8a3e085cc0a280f0c_3e24550aaf117e346bc922dee5f9fb37.jpg
6424fcedc7e05483036e9f29_c6e6ba99403e7cf622503b63671e27ef.webp
633ada4a27322b59ceb552e0_b72d720419502e7cb169797d48aa345e.webp
62c429c5da2b6dcefedf4358_6605c1c20ba04f189ba1de0a68a6bfd3.jpg
6880d9e255f13458836f4671_attachment_9_image9.webp
6880d9e1f1aae9cff1c41123_attachment_8_image8.webp
65d44993221e8ffa00a17c24_41ef3863bf7b1f44da0cc3287cea5eeb.webp
6424fceca127ac0219ec3e97_1b11c26e928c5fda3becde114d802356.webp
63c4d92d29588d34509f1ba6_b24322364c0cb77731abc594ec9b9639.webp
640ac9fb546bd5c3e203a914_62908841f1e6bd377ee35f753850df64.webp
640aca46fd388cb94911f9fd_0f4b1869d11086729fe8a8074c1dc043.webp
622eef0cda4a6ef467353e70_c24503e4acc68368255cb65710e58b80.jpg
622eef0c05f8ce47b5f98271_6f171e471c8f1db2e2f180f05849cc54.jpg
68d3a381b24dbc8f59db2762_1f8123769d7d6b5e2314d08a8810fb42_result.webp
68d3a381e1e86a125daed9e7_5fa838b322764e6d10804cb386bf9645_result.webp
62bf0406870dba3c964acbdd_15ee9ef91aa1fe3d7347efec8032d673 (1).jpg
62550ec877da4042d415e359_4478931d60f04256bfbe69be1ce8b52d.jpg
62550ec30623fa678b6c813b_6ab88905b7382655b3d5541ae752eedc.jpg
62550ec164d8fe80d6e8e91a_9fac27ccf1a59742cb61f79a0f71a0c1.jpg
62860e3e98366b95e206ffc7_f32f56b367ff315b4c0619770f853f0c.jpg
62ebebb91feae8049125ed7a_b64ac73e0867113f740133824dbf3fe7.webp
62bf036b7b23d71a014a52a3_c9205b56cfe1366c7bde7e644a41c3a5.jpg
629989fc00380716b17025aa_1e25df2d2cb1365dd04cd82c26a793b3.jpeg
6281d597f5a7b2fd9b19b46e_f5f8e0728dcfa102ae4c622cded9ec68.jpg
64219eebeec8b6f49f12e908_ac129f0554ca2b6484d27b5e9f23a071.jpeg
64219eee53db926d2a4c285b_d7b612429029bd5d64579f3e6e16e1c9.jpeg`
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

galerie.forEach((datei, i) => {
  bilder[datei] ??= `galerie/galerie-${String(i + 1).padStart(2, '0')}`;
});

async function vorhanden(pfad) {
  try {
    await access(pfad);
    return true;
  } catch {
    return false;
  }
}

async function laden(url) {
  const antwort = await fetch(url);
  if (!antwort.ok) throw new Error(`${antwort.status} ${url}`);
  return Buffer.from(await antwort.arrayBuffer());
}

let neu = 0;
for (const [datei, ziel] of Object.entries(bilder)) {
  const endung = extname(datei).toLowerCase().replace('.jpeg', '.jpg');
  const pfad = join(ZIEL, ziel + endung);
  if (await vorhanden(pfad)) continue;
  const daten = await laden(BASIS + encodeURIComponent(datei));
  await mkdir(dirname(pfad), { recursive: true });
  await writeFile(pfad, daten);
  neu++;
  console.log(`✓ ${ziel}${endung} (${Math.round(daten.length / 1024)} KB)`);
}

// Pflegeanleitung als PDF
const pdfZiel = fileURLToPath(new URL('../public/downloads/pflegeanleitung-schnurengurt.pdf', import.meta.url));
if (!(await vorhanden(pdfZiel))) {
  const pdf = await laden(
    'https://cdn.prod.website-files.com/62146b2062a8f08b5a9ebef9/627b5f7bebfe73712c5c1101_Pflege.pdf',
  );
  await mkdir(dirname(pdfZiel), { recursive: true });
  await writeFile(pdfZiel, pdf);
  console.log(`✓ Pflegeanleitung (${Math.round(pdf.length / 1024)} KB)`);
}

console.log(`Fertig: ${neu} neue Bilder, ${Object.keys(bilder).length} insgesamt.`);
