const fs = require('fs');
const path = require('path');
const { scrapeBrandDetails } = require('./scraper');
const brands = require('./brands.json');

async function main() {
  const results = [];
  for (const brand of brands) {
    console.log(`Scraping: ${brand.name}`);
    try {
      const details = await scrapeBrandDetails(brand.url);
      results.push({ ...brand, ...details });
    } catch (e) {
      console.error(`Failed to scrape ${brand.name}:`, e.message);
      results.push({ ...brand, error: e.message });
    }
    // Optional: delay between requests to avoid being blocked
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
  }
  fs.writeFileSync(path.join(__dirname, 'brands_details.json'), JSON.stringify(results, null, 2));
  console.log('✅ All brand details saved to brands_details.json');
}

main();
