
const puppeteer = require('puppeteer');
const fs = require('fs');

// Funzione per estrarre la lista dei brand da Fragrantica
async function scrapeBrands() {
  const url = 'https://www.fragrantica.com/designers/';
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36');

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  // Attendi che almeno un link brand sia presente
  await page.waitForSelector('a[href^="/designers/"][href$=".html"]', { timeout: 15000 });

  const brands = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href^="/designers/"][href$=".html"]'));
    const seen = new Set();
    return anchors
      .filter(a => a.textContent.trim() && !seen.has(a.textContent.trim()) && (seen.add(a.textContent.trim()) || true))
      .map(a => ({
        name: a.textContent.trim(),
        url: a.href.startsWith('http') ? a.href : `https://www.fragrantica.com${a.getAttribute('href')}`
      }));
  });

  // Lista brand di nicchia
  const nicheBrands = [
    "Amouage",
    "Creed",
    "Byredo",
    "Serge Lutens",
    "Nasomatto",
    "Xerjoff",
    "Parfums de Marly",
    "Maison Francis Kurkdjian",
    "Frederic Malle",
    "Orto Parisi",
    "Montale",
    "Mancera",
    "Diptyque",
    "By Kilian",
    "Tiziana Terenzi",
    "Clive Christian",
    "Nishane",
    "Initio Parfums Prives",
    "Penhaligon's",
    "Etat Libre d’Orange",
    "Memo Paris",
    "Juliette Has A Gun",
    "BDK Parfums",
    "Ex Nihilo",
    "Maison Crivelli",
    "Ormonde Jayne",
    "Masque Milano",
    "HFC (Haute Fragrance Company)",
    "Atelier Cologne",
    "Laboratorio Olfattivo",
    "Francesca Bianchi",
    // Nuovi brand di nicchia
    "Bond No 9",
    "BORNTOSTANDOUT®",
    "Comme des Garcons",
    "DS&Durga",
    "Escentric Molecules",
    "Essential Parfums",
    "Goldfield & Banks Australia",
    "Imaginary Authors",
    "L'Artisan Parfumeur",
    "Le Labo",
    "Les Liquides Imaginaires",
    "Lorenzo Pazzaglia",
    "Marc-Antoine Barrois",
    "Matiere Premiere",
    "Maison Martin Margiela",
    "Phlur",
    "Roja Dove",
    "Stéphane Humbert Lucas 777",
    "Vilhelm Parfumerie",
    "Zoologist Perfumes"
  ];

  // Filtra solo i brand di nicchia
  const filtered = brands.filter(b => nicheBrands.some(n => b.name.toLowerCase() === n.toLowerCase()));

  fs.writeFileSync('brands.json', JSON.stringify(filtered, null, 2));
  console.log('✅ Lista brand di nicchia salvata in brands.json');
  await browser.close();
}

// Per eseguire lo scraping dei brand: node scraper.js brands
if (process.argv[2] === 'brands') {
  scrapeBrands();
}

const perfumeUrls = [
  "https://www.fragrantica.it/perfume/Mind-Games/J-adoube-76713.html",
  "https://www.fragrantica.com/perfume/Rubino-Cosmetics/Cosmo-15375.html"
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Impostazione user agent per sembrare un browser reale
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36');

  const results = [];

  for (const url of perfumeUrls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('h1', { timeout: 10000 }); // aspetta il titolo


      const data = await page.evaluate(() => {
        // Title and brand extraction (update selectors as needed)
        const title = document.querySelector('[itemprop="name"]')?.innerText.trim() || '';
        const brand = document.querySelector('[itemprop="brand"] a span')?.innerText.trim() || '';


        // Helper to extract notes by section (supports English and Italian)
        const getNotes = (sectionTitles) => {
          const h4 = Array.from(document.querySelectorAll('h4')).find(
            el => sectionTitles.some(title => el.textContent.trim().toLowerCase().includes(title))
          );
          if (!h4) return [];
          const notesDiv = h4.nextElementSibling?.querySelectorAll('div[style*="flex-direction: column"]');
          if (!notesDiv) return [];
          return Array.from(notesDiv).map(div => {
            // Get image src
            const img = div.querySelector('img');
            const image = img?.getAttribute('src') || '';
            // Get note name (as before)
            const a = div.querySelector('a');
            let name = '';
            if (a && a.nextSibling && a.nextSibling.nodeType === Node.TEXT_NODE) {
              name = a.nextSibling.textContent.trim();
            } else {
              name = div.textContent.trim();
            }
            return { name, image };
          }).filter(n => n.name);
        };

        const topNotes = getNotes(['top notes', 'note di apertura']);
        const middleNotes = getNotes(['middle notes', 'note centrali']);
        const baseNotes = getNotes(['base notes', 'note di base']);

        // Extract accords
        const accordEls = document.querySelectorAll('.accord-box .accord-bar');
        const accords = Array.from(accordEls).map(el => el.innerText.trim()).filter(Boolean);

        // Extract main image (from <img itemprop="image"> inside <picture>)
        const imgEl = document.querySelector('picture img[itemprop="image"]');
        const image = imgEl?.getAttribute('src') || '';

        return { title, brand, topNotes, middleNotes, baseNotes, accords, image };
      });

      results.push({ url, ...data });
    } catch (error) {
      console.error(`Errore su ${url}:`, error.message);
      results.push({ url, title: 'ERROR', brand: '', notes: [] });
    }

    await new Promise(r => setTimeout(r, 2000)); // piccolo delay
  }

  fs.writeFileSync('perfumes.json', JSON.stringify(results, null, 2));
  console.log("✅ Dati salvati in perfumes.json");

  await browser.close();
})();
