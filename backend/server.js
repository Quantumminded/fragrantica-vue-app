const express = require('express');
const cors = require('cors');
const { scrapeBrandDetails, scrapePerfumeDetails } = require('./scraper');

const perfumes = require('./perfumes.json');
const brands = require('./brands.json');

const app = express();
app.use(cors());

app.get('/api/perfumes', (req, res) => {
  res.json(perfumes);
});

app.get('/api/brands', (req, res) => {
  res.json(brands);
});

// API endpoint to get details for a single perfume by url (encoded)
app.get('/api/perfume', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  try {
    const details = await scrapePerfumeDetails(url);
    res.json(details);
  } catch (e) {
    res.status(500).json({ error: 'Failed to scrape perfume details', details: e.message });
  }
});

// API endpoint to get details for a specific brand by name
app.get('/api/brand/:name', async (req, res) => {
  const brandName = decodeURIComponent(req.params.name);
  const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }
  try {
    const details = await scrapeBrandDetails(brand.url);
    res.json(details);
  } catch (e) {
    res.status(500).json({ error: 'Failed to scrape brand details', details: e.message });
  }
});

app.listen(3000, () => console.log('API server ready on http://localhost:3000'));
