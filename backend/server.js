const express = require('express');
const cors = require('cors');
const perfumes = require('./perfumes.json');

const app = express();
app.use(cors());

app.get('/api/perfumes', (req, res) => {
  res.json(perfumes);
});

app.listen(3000, () => console.log('API server ready on http://localhost:3000'));
