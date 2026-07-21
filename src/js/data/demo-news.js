// Bundled market headlines (global: DemoData.news) — used when offline or when
// live RSS is unavailable. `hoursAgo` is converted to timestamps at load.
(function () {
  'use strict';

  const N = (title, source, hoursAgo, sentiment, tags, summary, link) =>
    ({ title, source, ts: Date.now() - hoursAgo * 3600 * 1000, sentiment, tags, summary, link, demo: true });

  window.DemoData = window.DemoData || {};
  window.DemoData.news = [
    N('Amazon lowers FBA fulfillment fees for items under $10 in latest rate card update', 'Marketplace Pulse', 3, 'opp', ['Fees', 'FBA'],
      'The new rate card trims fulfillment fees on low-price items, improving unit economics for budget product lines.', 'https://www.marketplacepulse.com'),
    N('Pickleball equipment sales climb for the third straight quarter', 'Retail Dive', 7, 'opp', ['Sports', 'Trends'],
      'Participation keeps rising across age groups, with paddle sets and court accessories leading category growth.', 'https://www.retaildive.com'),
    N('New tariff schedule adds 10% duty to select houseware imports', 'CNBC Retail', 11, 'risk', ['Tariffs', 'Sourcing'],
      'Importers of kitchen and household goods face higher landed costs; review supplier quotes before reordering.', 'https://www.cnbc.com'),
    N('Pet care spending projected to reach record levels this year', 'Practical Ecommerce', 16, 'opp', ['Pets', 'Trends'],
      'Premium accessories and health-adjacent pet products continue to outpace overall e-commerce growth.', 'https://www.practicalecommerce.com'),
    N('Amazon tightens listing requirements for magnetic toys', 'Marketplace Pulse', 22, 'risk', ['Compliance', 'Toys'],
      'Sellers must provide updated safety documentation for magnetic building sets or risk listing suppression.', 'https://www.marketplacepulse.com'),
    N('Ocean freight rates from Asia ease back toward seasonal norms', 'Retail Dive', 28, 'opp', ['Logistics', 'Sourcing'],
      'Container spot rates fell for a fourth week, lowering landed costs for sea-freight replenishment.', 'https://www.retaildive.com'),
    N('Home organization category sees sustained post-holiday demand', 'Practical Ecommerce', 34, 'neutral', ['Home', 'Trends'],
      'Drawer organizers and storage systems keep converting well beyond the January reset spike.', 'https://www.practicalecommerce.com'),
    N('LED beauty devices face new FDA scrutiny over marketing claims', 'CNBC Retail', 41, 'risk', ['Beauty', 'Compliance'],
      'Light-therapy device sellers should audit listing claims; enforcement letters cite overreaching benefit statements.', 'https://www.cnbc.com'),
    N('Amazon expands placement fee discounts for minimal shipment splits', 'Marketplace Pulse', 47, 'neutral', ['Fees', 'FBA'],
      'Inbound placement options continue to reward consolidated shipments with lower per-unit fees.', 'https://www.marketplacepulse.com'),
    N('Solar garden lighting demand expected to peak earlier this season', 'Retail Dive', 53, 'opp', ['Garden', 'Seasonal'],
      'Retailers are pulling outdoor-living resets forward; stock spring inventory ahead of the usual calendar.', 'https://www.retaildive.com'),
    N('Counterfeit crackdown expands to kitchen brands on major marketplaces', 'CNBC Retail', 60, 'risk', ['IP', 'Compliance'],
      'Brand-registry takedowns rose sharply; resellers of branded tumblers and cookware should verify authorization.', 'https://www.cnbc.com'),
    N('Wireless charging accessories keep double-digit growth as standards converge', 'Practical Ecommerce', 68, 'opp', ['Electronics', 'Trends'],
      'Multi-device charging stations benefit from the Qi2 rollout across flagship phones.', 'https://www.practicalecommerce.com'),
    N('Return rates decline for apparel but rise for small electronics', 'Retail Dive', 75, 'neutral', ['Returns', 'Operations'],
      'Category return-rate shifts change net margin math; small-electronics sellers should re-check assumptions.', 'https://www.retaildive.com'),
    N('Temu and low-cost imports pressure entry-level product pricing', 'Marketplace Pulse', 82, 'risk', ['Competition', 'Pricing'],
      'Commodity products without differentiation face steeper price competition from direct-from-factory channels.', 'https://www.marketplacepulse.com'),
    N('Holiday toy preorders open earlier as brands chase Q4 shelf space', 'CNBC Retail', 90, 'neutral', ['Toys', 'Seasonal'],
      'Toy sellers are locking Q4 inventory now; late sourcing risks missing the October inbound window.', 'https://www.cnbc.com')
  ];
})();
