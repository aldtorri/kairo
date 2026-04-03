import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4321' });

test('GET /health returns 200 and ok status', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('GET /api/items returns items array', async ({ request }) => {
  const res = await request.get('/api/items');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.items).toBeDefined();
  expect(Array.isArray(body.items)).toBe(true);
});

test('POST /api/items creates item', async ({ request }) => {
  const res = await request.post('/api/items', {
    data: { name: 'New item' },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.name).toBe('New item');
});

test('GET /api/private returns 401 without auth', async ({ request }) => {
  const res = await request.get('/api/private');
  expect(res.status()).toBe(401);
});

test('POST /api/items without name returns 400', async ({ request }) => {
  const res = await request.post('/api/items', { data: {} });
  expect(res.status()).toBe(400);
});
