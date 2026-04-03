import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/items', (_req, res) => {
  res.json({ items: [{ id: 1, name: 'Test item' }] });
});

app.post('/api/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  res.status(201).json({ id: 2, name });
});

app.get('/api/private', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ secret: 'data' });
});

const PORT = process.env.PORT ?? 4321;
app.listen(PORT, () => {
  console.log(`Sample app running on port ${PORT}`);
});
