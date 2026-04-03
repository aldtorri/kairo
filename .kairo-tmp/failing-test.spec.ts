import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4321' });

// Este test pasa
test('GET /health returns 200', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status()).toBe(200);
});

// Este test falla — esperamos 404 que no existe
test('GET /api/nonexistent returns 404', async ({ request }) => {
  const res = await request.get('/api/nonexistent');
  expect(res.status()).toBe(200); // bug intencional: el endpoint no existe
});

// Este test falla por auth — security
test('Auth bypass: GET /api/private without token should return 401 but got 200', async ({ request }) => {
  const res = await request.get('/api/private');
  // Aserción incorrecta intencional para simular security finding
  expect(res.status()).toBe(200);
});
