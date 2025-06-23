const puppeteer = require('puppeteer');
const fs = require('fs');

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
            const a = div.querySelector('a');
            if (a && a.nextSibling && a.nextSibling.nodeType === Node.TEXT_NODE) {
              return a.nextSibling.textContent.trim();
            }
            return div.textContent.trim();
          }).filter(Boolean);
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
