// --- PATCH: Remove proxy usage, keep user-agent rotation and stealth ---
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const userAgents = require('./user_agents');
puppeteer.use(StealthPlugin());
// --- END PATCH ---

// Scrape details for a single perfume page
async function scrapePerfumeDetails(url) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        timeout: 60000
      });
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('h1', { timeout: 15000 });
      // CAPTCHA/block detection
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (/captcha|verify you are human|access denied|blocked/i.test(bodyText)) {
        throw new Error('Blocked or CAPTCHA detected');
      }
      const data = await page.evaluate(() => {
        // Title and brand extraction
        const title = document.querySelector('[itemprop="name"]')?.innerText.trim() || '';
        const brand = document.querySelector('[itemprop="brand"] a span')?.innerText.trim() || '';
        // Main image
        const imgEl = document.querySelector('picture img[itemprop="image"]');
        const image = imgEl?.getAttribute('src') || '';
        // Description (if available)
        let description = '';
        const descEl = document.querySelector('.cell.medium-8 .text, .cell.medium-8 .text-content, .cell.medium-8 .text_block');
        if (descEl) description = descEl.innerText.trim();

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
            // Get note name
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

        // If no top/middle/base notes, try to get generic notes
        let notes = [];
        if (!topNotes.length && !middleNotes.length && !baseNotes.length) {
          // Look for generic notes section (notes-box or similar)
          const notesBox = document.querySelector('.notes-box');
          if (notesBox) {
            notes = Array.from(notesBox.parentElement?.querySelectorAll('div[style*="flex-direction: column"]') || []).map(div => {
              const img = div.querySelector('img');
              const image = img?.getAttribute('src') || '';
              const name = div.textContent.trim();
              return { name, image };
            }).filter(n => n.name);
          }
        }

        // Extract accords
        const accordEls = document.querySelectorAll('.accord-box .accord-bar');
        const accords = Array.from(accordEls).map(el => el.innerText.trim()).filter(Boolean);

        return { title, brand, image, description, topNotes, middleNotes, baseNotes, notes, accords };
      });
      await browser.close();
      return data;
    } catch (e) {
      lastError = e;
      if (browser) await browser.close();
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }
  }
  throw new Error('Failed after user-agent rotation: ' + (lastError?.message || 'Unknown error'));
}

module.exports.scrapePerfumeDetails = scrapePerfumeDetails;
// Scrape details for a single brand page: name, logo, country
async function scrapeBrandDetails(url) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        timeout: 60000
      });
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('h1, h2', { timeout: 15000 });
      // CAPTCHA/block detection
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (/captcha|verify you are human|access denied|blocked/i.test(bodyText)) {
        throw new Error('Blocked or CAPTCHA detected');
      }
      const data = await page.evaluate(() => {
        // Brand name
        const name = document.querySelector('h1, h2')?.innerText.trim() || '';
        // Brand logo
        const logo = document.querySelector('.cell.small-4.medium-12 img')?.getAttribute('src') || '';
        // Country name
        let country = '';
        let website = '';
        const countryLabel = Array.from(document.querySelectorAll('.cell.small-7.small-offset-1.medium-12, .cell.medium-12')).find(div => div.innerHTML.includes('Country:'));
        if (countryLabel) {
          const match = countryLabel.innerHTML.match(/Country:\s*<a [^>]*><b>([^<]+)<\/b><\/a>/);
          if (match) country = match[1].trim();
          const websiteMatch = countryLabel.innerHTML.match(/Brand website:\s*<a [^>]*href=["']([^"']+)["']/);
          if (websiteMatch) website = websiteMatch[1].trim();
        }
        // Brand description
        let description = '';
        const descDiv = document.querySelector('.cell.small-12.medium-8 #descAAA');
        if (descDiv) {
          // Get all <p> inside the description div and join them
          description = Array.from(descDiv.querySelectorAll('p')).map(p => p.innerText.trim()).join('\n\n');
        }

        // Perfumes grouped by collection from #brands
        let collections = {};
        const brandsSection = document.getElementById('brands');
        if (brandsSection) {
          let currentCollection = '';
          let collectionPerfumes = [];
          const children = Array.from(brandsSection.children);
          for (let i = 0; i < children.length; i++) {
            const el = children[i];
            // Detect collection header
            if (el.tagName === 'DIV' && el.classList.contains('cell') && el.querySelector('h2')) {
              // Save previous collection if any
              if (currentCollection && collectionPerfumes.length) {
                collections[currentCollection] = collectionPerfumes;
              }
              currentCollection = el.querySelector('h2').innerText.trim();
              collectionPerfumes = [];
            }
            // Detect perfume entry
            if (el.classList.contains('cell') && el.classList.contains('text-left') && el.classList.contains('prefumeHbox')) {
              const div = el;
              const a = div.querySelector('h3 a');
              const name = a?.innerText.trim() || '';
              const url = a ? (a.href.startsWith('http') ? a.href : `https://www.fragrantica.com${a.getAttribute('href')}`) : '';
              let image = div.querySelector('.show-for-medium img')?.getAttribute('src') || '';
              if (!image) image = div.querySelector('.hide-for-medium img')?.getAttribute('src') || '';
              let gender = '', year = '';
              const infoSpans = div.querySelectorAll('.flex-container.align-justify:last-of-type span');
              if (infoSpans.length) {
                gender = infoSpans[0]?.innerText.trim() || '';
                year = infoSpans[1]?.innerText.trim() || '';
              }
              if (name && url) {
                collectionPerfumes.push({ name, url, image, gender, year });
              }
            }
          }
          // Save last collection
          if (currentCollection && collectionPerfumes.length) {
            collections[currentCollection] = collectionPerfumes;
          }
        }

        return { name, logo, country, website, description, collections };
      });
      await browser.close();
      return data;
    } catch (e) {
      lastError = e;
      if (browser) await browser.close();
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }
  }
  throw new Error('Failed after user-agent rotation: ' + (lastError?.message || 'Unknown error'));
}

module.exports.scrapeBrandDetails = scrapeBrandDetails;

const fs = require('fs');

// Funzione per estrarre la lista dei brand da Fragrantica
async function scrapeBrands() {
  const url = 'https://www.fragrantica.com/designers/';
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        timeout: 60000
      });
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
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
      console.log('✅ Lista brand salvata in brands.json');
      await browser.close();
      return;
    } catch (e) {
      lastError = e;
      if (browser) await browser.close();
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }
  }
  throw new Error('Failed after user-agent rotation: ' + (lastError?.message || 'Unknown error'));
}


// Per eseguire lo scraping dei brand: node scraper.js brands
if (process.argv[2] === 'brands') {
  scrapeBrands();
}

// Per eseguire lo scraping dei dettagli di tutti i profumi: node scraper.js perfumes
if (process.argv[2] === 'perfumes') {
  (async () => {
    const fs = require('fs');
    const path = require('path');
    const { scrapePerfumeDetails } = require('./scraper');
    const brandsDetails = require('./brands_details.json');
    const allPerfumeUrls = [];
    for (const brand of brandsDetails) {
      if (brand.collections) {
        for (const collectionName in brand.collections) {
          for (const perfume of brand.collections[collectionName]) {
            if (perfume.url) allPerfumeUrls.push(perfume.url);
          }
        }
      }
    }
    const results = [];
    for (const url of allPerfumeUrls) {
      try {
        console.log('Scraping:', url);
        const details = await scrapePerfumeDetails(url);
        results.push({ url, ...details });
      } catch (e) {
        console.error('Failed to scrape', url, e.message);
        results.push({ url, error: e.message });
      }
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
    }
    fs.writeFileSync(path.join(__dirname, 'perfumes_details.json'), JSON.stringify(results, null, 2));
    console.log('✅ All perfume details saved to perfumes_details.json');
  })();
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
