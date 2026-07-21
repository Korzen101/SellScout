// Simulated seller-account data (global: DemoData.business).
// Deterministic (seeded PRNG) so the demo dashboard is stable between launches.
(function () {
  'use strict';

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rnd = mulberry32(20260721);

  // --- 90 days of daily sales with weekly rhythm + gentle growth ---
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 1.18 : 1;      // weekend lift
    const growth = 1 + (89 - i) * 0.0022;                    // slow upward drift
    const noise = 0.78 + rnd() * 0.5;
    const revenue = Math.round(420 * weekend * growth * noise);
    const units = Math.max(3, Math.round(revenue / 24 + (rnd() - 0.5) * 4));
    const profit = Math.round(revenue * (0.21 + (rnd() - 0.5) * 0.05));
    days.push({ date: d, revenue, units, profit });
  }

  // --- SKUs tied to the demo catalog ---
  const skus = [
    { sku: 'SS-DOGBOWL-2PK', name: 'Collapsible Silicone Dog Bowl, 2-Pack', emoji: '🐶', hue: 30,  stock: 1180, daily: 29, cost: 2.4 },
    { sku: 'SS-SPICE-12',    name: 'Magnetic Spice Jars, 12-Set',           emoji: '🧂', hue: 15,  stock: 620,  daily: 44, cost: 8.4 },
    { sku: 'SS-DESKPAD-XL',  name: 'Vegan Leather Desk Pad 31.5"',          emoji: '🖥️', hue: 220, stock: 710,  daily: 18, cost: 5.6 },
    { sku: 'SS-FOOTMAT-01',  name: 'Acupressure Foot Mat & Pillow Set',     emoji: '🦶', hue: 280, stock: 160,  daily: 21, cost: 5.4 },
    { sku: 'SS-PICKLE-2P',   name: 'Pickleball Paddle Set, 2-Player',       emoji: '🎾', hue: 100, stock: 940,  daily: 26, cost: 15.5 },
    { sku: 'SS-ICEMOLD-2',   name: 'Sphere Ice Molds, 2-Pack',              emoji: '🧊', hue: 195, stock: 210,  daily: 16, cost: 2.9 },
    { sku: 'SS-PILLBOX-L',   name: 'Weekly Pill Organizer, Large',          emoji: '💊', hue: 355, stock: 1400, daily: 33, cost: 2.1 },
    { sku: 'SS-TOWEL-BAB',   name: 'Bamboo Hooded Baby Towel',              emoji: '🛁', hue: 150, stock: 310,  daily: 9,  cost: 7.1 }
  ];

  // --- Recent orders ---
  const cities = ['Austin, TX', 'Denver, CO', 'Columbus, OH', 'Phoenix, AZ', 'Raleigh, NC',
                  'Portland, OR', 'Tampa, FL', 'Madison, WI', 'Reno, NV', 'Albany, NY', 'Boise, ID', 'Tucson, AZ'];
  const statuses = ['Shipped', 'Shipped', 'Shipped', 'Pending', 'Delivered', 'Delivered', 'Delivered'];
  const orders = [];
  for (let i = 0; i < 12; i++) {
    const sku = skus[Math.floor(rnd() * skus.length)];
    const qty = rnd() < 0.82 ? 1 : 2;
    const price = { 'SS-DOGBOWL-2PK': 13.99, 'SS-SPICE-12': 25.99, 'SS-DESKPAD-XL': 18.99, 'SS-FOOTMAT-01': 22.99,
                    'SS-PICKLE-2P': 44.99, 'SS-ICEMOLD-2': 14.99, 'SS-PILLBOX-L': 12.99, 'SS-TOWEL-BAB': 24.99 }[sku.sku];
    orders.push({
      id: '114-' + String(Math.floor(rnd() * 9000000) + 1000000) + '-' + String(Math.floor(rnd() * 9000000) + 1000000),
      name: sku.name, emoji: sku.emoji, hue: sku.hue, qty,
      total: +(price * qty).toFixed(2),
      city: cities[i % cities.length],
      status: statuses[Math.floor(rnd() * statuses.length)],
      hoursAgo: Math.round(1 + i * 6.5 + rnd() * 4)
    });
  }

  // --- Revenue by category (30d) ---
  const categorySplit = [
    { label: 'Home & Kitchen', value: 4180 },
    { label: 'Sports & Outdoors', value: 3260 },
    { label: 'Pet Supplies', value: 2440 },
    { label: 'Office', value: 1690 },
    { label: 'Other', value: 1210 }
  ];

  window.DemoData = window.DemoData || {};
  window.DemoData.business = { days, skus, orders, categorySplit };
})();
