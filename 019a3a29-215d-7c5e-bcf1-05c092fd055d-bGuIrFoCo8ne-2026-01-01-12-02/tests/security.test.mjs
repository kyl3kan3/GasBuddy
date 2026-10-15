import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { publicRegistrationRole, requireJwtSecret } from '../src/lib/security-policy.ts';
import { quoteFuel } from '../src/lib/fuel-pricing.ts';

async function route(path, mocks) {
  const source = await readFile(new URL('../src/app/api/' + path, import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source), {
    context: vm.createContext({ console, process }),
  });
  await module.link(async name => {
    const exports = mocks[name];
    assert.ok(exports, `Unexpected dependency: ${name}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context: module.context });
  });
  await module.evaluate();
  return module.namespace;
}
const next = { NextRequest: class {}, NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } };
const request = body => ({ json: async () => body, headers: { get: () => 'Bearer test-session' } });

test('public role policy excludes administrators in every letter case', () => {
  for (const value of ['ADMIN', 'admin', 'AdMiN', null, {}, ['admin']]) assert.equal(publicRegistrationRole(value), null);
  assert.equal(publicRegistrationRole('customer'), 'CUSTOMER');
  assert.equal(publicRegistrationRole('DRIVER'), 'DRIVER');
});
test('missing, documented wrong variable, and known fallback secrets fail closed', () => {
  for (const env of [{}, { JWT_SECRET: 'x'.repeat(64) }, { NEXTAUTH_SECRET: 'short' },
    { NEXTAUTH_SECRET: 'your-secret-key-change-in-production' }]) assert.throws(() => requireJwtSecret(env));
  assert.equal(requireJwtSecret({ NEXTAUTH_SECRET: 'A'.repeat(40) }), 'A'.repeat(40));
});
test('catalog calculates cents and rejects malformed quantity/product', () => {
  assert.deepEqual(quoteFuel('regular', 10), { pricePerUnit: 3.45, totalAmount: 39.49, totalCents: 3949 });
  for (const value of [NaN, Infinity, -1, 0, 4, 51, 5.5, '10']) assert.throws(() => quoteFuel('regular', value));
  assert.throws(() => quoteFuel('__proto__', 10));
});
test('registration rejects ADMIN before database access or token issuance', async () => {
  const { POST } = await route('auth/register/route.ts', {
    'next/server': next, 'bcryptjs': { default: {} }, '@/lib/prisma': { prisma: {} },
    '@/lib/jwt': { signToken: () => assert.fail('must not issue token') },
    '@/lib/security-policy': { publicRegistrationRole },
  });
  assert.equal((await POST(request({ email: 'a@example.test', password: 'secret', name: 'A', phone: '1', role: 'admin' }))).status, 400);
});
test('order route ignores client-selected price and total', async () => {
  let stored;
  const { POST } = await route('orders/route.ts', {
    'next/server': next, '@/lib/jwt': { verifyToken: () => ({ userId: 'customer' }) },
    '@/lib/fuel-pricing': { quoteFuel }, '@/lib/prisma': { prisma: {
      user: { findUnique: async () => ({ id: 'customer', role: 'CUSTOMER' }) },
      order: { create: async ({ data }) => { stored = data; return data; } },
    } },
  });
  const response = await POST(request({ gasType: 'regular', quantity: 10, deliveryLat: 38, deliveryLng: -90,
    deliveryAddress: 'Test', pricePerUnit: 0.01, totalAmount: 0.01 }));
  assert.equal(response.status, 201);
  assert.equal(stored.totalAmount, 39.49);
  assert.equal(stored.pricePerUnit, 3.45);
});
test('checkout rejects a legacy underpriced order before calling Stripe', async () => {
  const { POST } = await route('payments/checkout/route.ts', {
    'next/server': next, '@/lib/jwt': { verifyToken: () => ({ userId: 'customer' }) },
    '@/lib/fuel-pricing': { quoteFuel },
    stripe: { default: class { checkout = { sessions: { create: () => assert.fail('must not charge') } }; } },
    '@/lib/prisma': { prisma: { order: { findUnique: async () => ({
      id: 'order', customerId: 'customer', gasType: 'regular', quantity: 10, pricePerUnit: 0.01, totalAmount: 0.10,
    }) } } },
  });
  assert.equal((await POST(request({ orderId: 'order' }))).status, 409);
});

test('customer signup still creates an ordinary user and signs the stored role', async () => {
  let created, signed;
  const { POST } = await route('auth/register/route.ts', {
    'next/server': next, 'bcryptjs': { default: { hash: async () => 'hashed-test-password' } },
    '@/lib/prisma': { prisma: { user: {
      findUnique: async () => null,
      create: async ({ data }) => { created = data; return { ...data, id: 'customer' }; },
    } } },
    '@/lib/jwt': { signToken: (data) => { signed = data; return 'test-token'; } },
    '@/lib/security-policy': { publicRegistrationRole },
  });
  const response = await POST(request({ email: 'c@example.test', password: 'test-password', name: 'C', phone: '1', role: 'customer' }));
  assert.equal(response.status, 201); assert.equal(created.role, 'CUSTOMER'); assert.equal(signed.role, 'customer');
});
test('legitimate checkout charges the trusted quote in cents', async () => {
  let charge, payment;
  const { POST } = await route('payments/checkout/route.ts', {
    'next/server': next, '@/lib/jwt': { verifyToken: () => ({ userId: 'customer' }) },
    '@/lib/fuel-pricing': { quoteFuel },
    stripe: { default: class { checkout = { sessions: { create: async (data) => { charge = data; return { id: 'checkout', url: 'https://checkout.example.test' }; } } }; } },
    '@/lib/prisma': { prisma: {
      order: { findUnique: async () => ({ id: 'order', customerId: 'customer', customer: { email: 'c@example.test' },
        gasType: 'regular', quantity: 10, pricePerUnit: 3.45, totalAmount: 39.49 }) },
      payment: { create: async ({ data }) => { payment = data; } },
    } },
  });
  const response = await POST(request({ orderId: 'order' }));
  assert.equal(response.status, 200); assert.equal(charge.line_items[0].price_data.unit_amount, 3949);
  assert.equal(payment.amount, 39.49);
});
