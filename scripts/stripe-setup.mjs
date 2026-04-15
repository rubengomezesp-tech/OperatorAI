#!/usr/bin/env node
/* eslint-disable no-console */
import { config } from 'dotenv'; config({ path: '.env.local' });
import Stripe from 'stripe';
import { readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error('STRIPE_SECRET_KEY missing in env');
  process.exit(1);
}
const stripe = new Stripe(KEY, { apiVersion: '2025-09-30.clover' });

const PLANS = [
  { id: 'starter', name: 'Operator AI - Starter', priceCents: 2900 },
  { id: 'pro',     name: 'Operator AI - Pro',     priceCents: 9900 },
  { id: 'agency',  name: 'Operator AI - Agency',  priceCents: 29900 },
];

async function ensureProductAndPrice(plan) {
  const existing = await stripe.products.search({
    query: 'metadata[\'operator_plan_id\']:\'' + plan.id + '\'',
  });

  let product;
  if (existing.data.length > 0) {
    product = existing.data[0];
    console.log('[' + plan.id + '] product exists: ' + product.id);
  } else {
    product = await stripe.products.create({
      name: plan.name,
      metadata: { operator_plan_id: plan.id },
    });
    console.log('[' + plan.id + '] created product: ' + product.id);
  }

  const prices = await stripe.prices.list({ product: product.id, limit: 100, active: true });
  let price = prices.data.find(
    (p) => p.unit_amount === plan.priceCents && p.recurring?.interval === 'month' && p.currency === 'usd',
  );

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceCents,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { operator_plan_id: plan.id },
    });
    console.log('[' + plan.id + '] created price: ' + price.id);
  } else {
    console.log('[' + plan.id + '] price exists: ' + price.id);
  }

  return { planId: plan.id, productId: product.id, priceId: price.id };
}

const results = [];
for (const plan of PLANS) {
  const r = await ensureProductAndPrice(plan);
  results.push(r);
}

console.log('\n=== Summary ===');
for (const r of results) {
  console.log(r.planId.padEnd(10) + ' price_id=' + r.priceId);
}

const envPath = '.env.local';
let current = '';
try { current = readFileSync(envPath, 'utf8'); } catch {}

for (const r of results) {
  const varName = 'STRIPE_PRICE_' + r.planId.toUpperCase();
  const line = varName + '=' + r.priceId;
  const re = new RegExp('^' + varName + '=.*$', 'm');
  if (re.test(current)) {
    current = current.replace(re, line);
  } else {
    current = current.trimEnd() + '\n' + line + '\n';
  }
}

writeFileSync(envPath, current);
console.log('\n.env.local updated with STRIPE_PRICE_* vars.');

console.log('\nNow run in Supabase SQL editor:\n');
for (const r of results) {
  console.log('update public.plans set stripe_price_id = \'' + r.priceId + '\' where id = \'' + r.planId + '\';');
}
