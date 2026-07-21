// Curated demo product catalog (global: DemoData.products).
// Numbers are modeled on realistic marketplace ranges (price, velocity, review
// depth, sourcing costs) so scoring behaves like it would on live data.
(function () {
  'use strict';

  // Source option
  function S(marketplace, unitCost, shipPerUnit, moq, leadDays, rating) {
    return { marketplace, unitCost, shipPerUnit, moq, leadDays, rating };
  }

  // Product row
  function P(id, name, category, emoji, hue, price, sizeTier, fbaFee, estMonthlySales,
             sellers, reviewsTop10, rating, amazonOnListing, trend12, seasonal, flags, sources) {
    return { id, name, category, emoji, hue, price, sizeTier, fbaFee, estMonthlySales,
             sellers, reviewsTop10, rating, amazonOnListing, trend12, seasonal, flags, sources };
  }

  const products = [
    // --- Pet Supplies ---
    P('pet-dogbowl', 'Collapsible Silicone Dog Bowl, 2-Pack', 'Pet Supplies', '🐶', 30, 13.99, 'small-std', 3.35, 920, 12, 410, 4.5, false,
      [82,85,88,90,94,97,100,104,108,112,118,124], null, [],
      [S('Alibaba', 1.85, 0.55, 200, 32, 4.7), S('AliExpress', 3.2, 0.9, 1, 16, 4.4)]),
    P('pet-groom', 'Self-Cleaning Pet Grooming Glove Set', 'Pet Supplies', '🐱', 200, 12.49, 'small-std', 3.22, 640, 18, 260, 4.3, false,
      [95,96,98,97,99,100,101,103,102,104,105,107], null, [],
      [S('Alibaba', 1.4, 0.5, 300, 30, 4.6), S('DHgate', 2.1, 0.7, 20, 21, 4.3)]),
    P('pet-fountain', 'Stainless Cat Water Fountain 84oz', 'Pet Supplies', '💧', 190, 32.99, 'large-std-3', 5.68, 1350, 26, 3100, 4.4, true,
      [90,92,95,96,98,100,103,105,104,107,109,111], null, ['electric'],
      [S('Alibaba', 8.9, 2.1, 100, 38, 4.5), S('AliExpress', 13.5, 2.6, 1, 18, 4.2)]),
    P('pet-slowfeed', 'Slow-Feeder Dog Bowl Maze Insert', 'Pet Supplies', '🦴', 20, 11.99, 'small-std', 3.28, 780, 15, 520, 4.6, false,
      [88,90,93,95,96,99,102,104,107,109,113,116], null, [],
      [S('Alibaba', 1.55, 0.5, 200, 30, 4.8), S('AliExpress', 2.9, 0.8, 1, 15, 4.5)]),

    // --- Home & Kitchen ---
    P('kit-spicejars', 'Magnetic Spice Jars with Labels, 12-Set', 'Kitchen & Dining', '🧂', 15, 25.99, 'large-std-2', 4.9, 1450, 22, 2900, 4.6, false,
      [86,88,91,94,96,99,102,105,109,112,116,120], null, ['fragile'],
      [S('Alibaba', 6.8, 1.6, 100, 35, 4.6), S('AliExpress', 9.9, 2.1, 1, 17, 4.3)]),
    P('kit-scrubber', 'Cordless Electric Spin Scrubber, 4 Heads', 'Home & Kitchen', '🧽', 210, 39.99, 'large-std-h', 7.1, 2600, 34, 4800, 4.3, true,
      [92,94,97,99,100,102,104,105,107,108,110,112], null, ['electric'],
      [S('Alibaba', 11.2, 2.8, 100, 40, 4.5), S('DHgate', 14.8, 3.2, 10, 24, 4.2)]),
    P('kit-drawer', 'Bamboo Expandable Drawer Organizer', 'Home & Kitchen', '🍴', 90, 21.99, 'large-std-2', 4.86, 1050, 28, 3400, 4.5, true,
      [97,97,98,99,100,100,101,101,102,103,103,104], null, [],
      [S('Alibaba', 6.1, 1.9, 100, 36, 4.7), S('AliExpress', 9.4, 2.4, 1, 19, 4.4)]),
    P('kit-icemold', 'Large Sphere Ice Molds, 6-Cavity 2-Pack', 'Kitchen & Dining', '🧊', 195, 14.99, 'small-std', 3.42, 1120, 19, 860, 4.4, false,
      [70,74,80,88,97,110,124,130,118,100,88,80], 'Summer', ['seasonal'],
      [S('Alibaba', 2.2, 0.7, 200, 33, 4.6), S('AliExpress', 3.9, 1.0, 1, 16, 4.3)]),
    P('kit-oilspray', 'Glass Olive Oil Sprayer & Dispenser Set', 'Kitchen & Dining', '🫒', 110, 16.99, 'small-std', 3.55, 890, 16, 640, 4.2, false,
      [90,92,94,95,97,99,101,102,104,106,107,109], null, ['fragile'],
      [S('Alibaba', 2.9, 0.9, 150, 34, 4.5), S('DHgate', 4.2, 1.1, 12, 22, 4.2)]),
    P('home-doorstop', 'Decorative Weighted Fabric Door Stopper', 'Home & Kitchen', '🚪', 40, 18.99, 'large-std-2', 4.75, 460, 9, 190, 4.4, false,
      [93,94,95,96,97,99,100,101,103,104,106,108], null, [],
      [S('Alibaba', 3.4, 1.2, 200, 36, 4.4), S('Faire', 6.5, 1.0, 12, 8, 4.6)]),
    P('home-blanket', 'Cooling Bamboo Weighted Blanket 15lb', 'Home & Kitchen', '🛏️', 250, 59.99, 'large-bulky', 10.4, 980, 31, 5200, 4.4, true,
      [85,84,82,80,82,86,90,96,102,110,118,124], 'Q4', ['oversize','seasonal'],
      [S('Alibaba', 19.5, 6.8, 100, 42, 4.5), S('AliExpress', 28.9, 8.2, 1, 21, 4.1)]),

    // --- Sports & Outdoors ---
    P('spt-footmat', 'Acupressure Foot Mat & Pillow Set', 'Sports & Outdoors', '🦶', 280, 22.99, 'large-std-1', 4.16, 740, 11, 330, 4.3, false,
      [84,87,90,93,96,100,103,107,110,114,117,121], null, [],
      [S('Alibaba', 4.1, 1.3, 150, 33, 4.6), S('AliExpress', 6.8, 1.7, 1, 17, 4.3)]),
    P('spt-jumprope', 'Weighted Jump Rope with Counter', 'Sports & Outdoors', '🏋️', 140, 15.99, 'small-std', 3.48, 1300, 29, 2200, 4.3, false,
      [130,122,112,104,98,94,92,90,89,88,87,86], null, [],
      [S('Alibaba', 2.6, 0.8, 200, 31, 4.5), S('DHgate', 3.9, 1.0, 20, 22, 4.2)]),
    P('spt-resistband', 'Fabric Resistance Bands, Set of 3 + Guide', 'Sports & Outdoors', '💪', 340, 19.99, 'small-std', 3.52, 2100, 38, 6100, 4.5, true,
      [118,112,106,102,99,97,96,95,94,93,93,92], null, [],
      [S('Alibaba', 3.1, 0.9, 200, 30, 4.7), S('AliExpress', 5.2, 1.2, 1, 15, 4.4)]),
    P('spt-pickle', 'Pickleball Paddle Set with Cover, 2-Player', 'Sports & Outdoors', '🎾', 100, 44.99, 'large-std-3', 5.72, 1850, 24, 1400, 4.6, false,
      [72,76,82,88,95,102,110,117,124,130,136,142], null, [],
      [S('Alibaba', 12.4, 3.1, 100, 36, 4.6), S('DHgate', 16.8, 3.6, 10, 23, 4.3)]),
    P('spt-hydration', 'Insulated Hydration Backpack 2L', 'Sports & Outdoors', '🎒', 60, 34.99, 'large-std-3', 5.8, 880, 17, 950, 4.4, false,
      [76,80,86,94,102,112,120,126,118,106,94,86], 'Summer', ['seasonal'],
      [S('Alibaba', 9.2, 2.4, 100, 38, 4.5), S('AliExpress', 14.1, 3.0, 1, 19, 4.2)]),

    // --- Beauty & Personal Care ---
    P('bty-gua', 'Rose Quartz Gua Sha & Roller Set', 'Beauty & Personal Care', '🌸', 330, 17.99, 'small-std', 3.3, 1500, 42, 5400, 4.4, false,
      [125,118,110,105,100,97,95,93,92,90,89,88], null, ['volatile'],
      [S('Alibaba', 2.3, 0.7, 200, 32, 4.4), S('AliExpress', 4.1, 1.0, 1, 16, 4.1)]),
    P('bty-scalp', 'Scalp Massager Shampoo Brush 2-Pack', 'Beauty & Personal Care', '🧴', 175, 10.99, 'small-std', 3.16, 1900, 33, 4100, 4.5, true,
      [96,97,98,99,100,101,102,102,103,104,105,106], null, [],
      [S('Alibaba', 1.1, 0.4, 300, 29, 4.7), S('DHgate', 1.9, 0.6, 24, 20, 4.4)]),
    P('bty-heatless', 'Heatless Curling Rod Headband Set', 'Beauty & Personal Care', '💇', 310, 13.99, 'small-std', 3.4, 1150, 27, 1800, 4.2, false,
      [108,104,101,99,98,97,96,96,95,95,94,94], null, [],
      [S('Alibaba', 1.7, 0.6, 200, 31, 4.5), S('AliExpress', 3.0, 0.9, 1, 15, 4.2)]),
    P('bty-ledmask', 'LED Light Therapy Face Mask', 'Beauty & Personal Care', '🎭', 260, 89.99, 'large-std-2', 5.1, 720, 21, 1600, 4.1, false,
      [78,82,87,92,97,103,109,114,119,123,128,132], null, ['electric','gated','volatile'],
      [S('Alibaba', 26.5, 4.2, 50, 40, 4.3), S('DHgate', 34.9, 5.1, 5, 25, 4.0)]),

    // --- Office ---
    P('off-deskpad', 'Vegan Leather Desk Pad 31.5"', 'Office Products', '🖥️', 220, 18.99, 'large-std-1', 4.3, 1600, 25, 2700, 4.6, true,
      [94,95,96,97,98,100,101,102,104,105,106,108], null, [],
      [S('Alibaba', 4.2, 1.4, 100, 33, 4.7), S('AliExpress', 6.9, 1.8, 1, 17, 4.4)]),
    P('off-footrest', 'Adjustable Under-Desk Foot Rest', 'Office Products', '🪑', 45, 27.99, 'large-std-3', 5.75, 950, 14, 780, 4.4, false,
      [88,90,92,94,96,99,101,103,106,108,110,113], null, [],
      [S('Alibaba', 7.1, 2.2, 100, 35, 4.5), S('DHgate', 9.8, 2.6, 10, 24, 4.2)]),
    P('off-standlap', 'Portable Foldable Laptop Stand, Aluminum', 'Office Products', '💻', 205, 25.99, 'large-std-1', 4.4, 2400, 45, 7800, 4.5, true,
      [112,108,105,102,100,99,98,97,96,95,95,94], null, [],
      [S('Alibaba', 6.4, 1.6, 100, 32, 4.6), S('AliExpress', 9.8, 2.0, 1, 16, 4.3)]),
    P('off-whiteboard', 'Glass Desktop Whiteboard with Storage', 'Office Products', '📝', 185, 32.99, 'large-std-3', 5.9, 520, 8, 240, 4.5, false,
      [85,88,90,93,96,99,102,106,109,112,116,119], null, ['fragile'],
      [S('Alibaba', 8.8, 2.8, 100, 37, 4.5), S('Faire', 14.2, 2.2, 6, 9, 4.6)]),

    // --- Baby ---
    P('bab-siliplate', 'Suction Silicone Baby Plate & Spoon Set', 'Baby', '🍼', 165, 16.99, 'small-std', 3.5, 1250, 20, 1500, 4.7, false,
      [90,92,94,96,98,100,102,104,106,108,110,112], null, ['gated'],
      [S('Alibaba', 2.8, 0.8, 200, 33, 4.7), S('AliExpress', 4.9, 1.1, 1, 16, 4.4)]),
    P('bab-hooded', 'Bamboo Hooded Baby Towel & Washcloth', 'Baby', '🛁', 150, 24.99, 'large-std-1', 4.35, 830, 13, 690, 4.8, false,
      [92,93,95,96,98,99,101,102,104,105,107,108], null, [],
      [S('Alibaba', 5.6, 1.5, 100, 36, 4.8), S('Faire', 9.8, 1.4, 12, 8, 4.7)]),
    P('bab-nightlight', 'Portable Silicone Nursery Night Light', 'Baby', '🌙', 55, 19.99, 'small-std', 3.6, 1000, 23, 2100, 4.6, true,
      [95,96,97,98,99,100,101,101,102,103,104,105], null, ['electric'],
      [S('Alibaba', 4.3, 1.1, 150, 34, 4.6), S('DHgate', 6.2, 1.4, 12, 22, 4.3)]),

    // --- Patio & Garden ---
    P('gdn-herbkit', 'Indoor Herb Garden Starter Kit (Soil-Based)', 'Patio & Garden', '🌿', 120, 29.99, 'large-std-3', 5.85, 900, 12, 480, 4.2, false,
      [70,76,86,98,112,120,116,104,94,84,76,72], 'Spring', ['seasonal'],
      [S('Alibaba', 7.4, 2.3, 100, 38, 4.4), S('Faire', 12.9, 2.0, 8, 10, 4.5)]),
    P('gdn-solar', 'Solar Pathway Lights, 8-Pack Warm White', 'Patio & Garden', '☀️', 50, 36.99, 'large-std-h', 7.3, 1700, 36, 4400, 4.1, true,
      [68,74,84,96,108,120,128,124,112,98,84,74], 'Summer', ['seasonal','electric','volatile'],
      [S('Alibaba', 10.8, 3.4, 100, 40, 4.3), S('AliExpress', 16.4, 4.1, 1, 20, 4.0)]),
    P('gdn-kneeler', 'Foldable Garden Kneeler & Seat with Pouch', 'Patio & Garden', '🧤', 95, 39.99, 'large-bulky', 9.9, 760, 10, 520, 4.5, false,
      [66,72,84,98,112,122,118,106,94,82,72,66], 'Spring', ['seasonal','oversize'],
      [S('Alibaba', 11.6, 4.2, 100, 39, 4.5), S('DHgate', 15.9, 4.9, 6, 26, 4.2)]),

    // --- Toys & Games ---
    P('toy-buildstem', 'STEM Magnetic Building Tiles, 64-Piece', 'Toys & Games', '🧲', 240, 34.99, 'large-std-3', 5.78, 2100, 30, 3900, 4.7, true,
      [72,68,64,62,64,68,74,84,98,122,152,178], 'Q4', ['seasonal','ip-risk'],
      [S('Alibaba', 9.6, 2.9, 100, 37, 4.6), S('AliExpress', 15.2, 3.5, 1, 18, 4.3)]),
    P('toy-dino', 'Pull-Back Dinosaur Cars, 6-Pack', 'Toys & Games', '🦖', 130, 15.99, 'large-std-1', 4.2, 1400, 26, 2400, 4.6, false,
      [76,72,68,66,68,72,78,86,100,124,150,172], 'Q4', ['seasonal'],
      [S('Alibaba', 3.2, 1.0, 200, 34, 4.6), S('DHgate', 4.8, 1.3, 20, 23, 4.3)]),
    P('toy-crafts', 'Kids Craft Kit: Bracelet Making Set', 'Toys & Games', '📿', 320, 24.99, 'large-std-1', 4.3, 1150, 18, 1300, 4.5, false,
      [80,77,74,72,72,75,79,86,98,118,142,160], 'Q4', ['seasonal'],
      [S('Alibaba', 5.4, 1.4, 150, 33, 4.5), S('AliExpress', 8.7, 1.8, 1, 16, 4.2)]),

    // --- Electronics & Accessories ---
    P('ele-tracker', 'Bluetooth Item Tracker Tag, 4-Pack', 'Electronics', '📍', 215, 27.99, 'small-std', 3.45, 2900, 48, 9200, 4.2, true,
      [98,99,100,100,101,102,102,103,103,104,104,105], null, ['electric'],
      [S('Alibaba', 7.8, 1.2, 200, 35, 4.4), S('AliExpress', 11.9, 1.6, 1, 17, 4.1)]),
    P('ele-deskcharge', '3-in-1 Foldable Wireless Charging Station', 'Electronics', '🔌', 265, 32.99, 'small-std', 3.6, 1900, 39, 5100, 4.3, false,
      [88,90,93,95,97,100,102,105,107,110,112,115], null, ['electric','volatile'],
      [S('Alibaba', 8.9, 1.5, 100, 34, 4.5), S('DHgate', 12.4, 1.9, 10, 22, 4.2)]),
    P('ele-cleankit', 'Electronics Cleaning Kit 10-in-1', 'Electronics Accessories', '🧹', 170, 14.99, 'small-std', 3.32, 2300, 41, 6800, 4.4, false,
      [104,102,101,100,99,99,98,98,97,97,96,96], null, [],
      [S('Alibaba', 2.4, 0.7, 200, 30, 4.6), S('AliExpress', 4.2, 1.0, 1, 15, 4.3)]),
    P('ele-cablemgmt', 'Cable Management Box Set, 2 Sizes', 'Electronics Accessories', '🔋', 60, 21.99, 'large-std-2', 4.95, 980, 16, 870, 4.4, false,
      [91,93,94,96,97,99,100,102,103,105,106,108], null, [],
      [S('Alibaba', 4.6, 1.5, 100, 33, 4.6), S('DHgate', 6.8, 1.9, 12, 21, 4.3)]),

    // --- Health & Household ---
    P('hlt-pillbox', 'Weekly Pill Organizer, Large 2×/Day', 'Health & Household', '💊', 355, 12.99, 'small-std', 3.25, 1600, 24, 3300, 4.6, true,
      [95,96,97,98,99,100,100,101,102,103,103,104], null, [],
      [S('Alibaba', 1.6, 0.5, 300, 30, 4.7), S('AliExpress', 2.8, 0.8, 1, 15, 4.4)]),
    P('hlt-posture', 'Posture Corrector Back Brace, Breathable', 'Health & Household', '🩺', 200, 19.99, 'small-std', 3.5, 1250, 37, 4600, 4.0, false,
      [116,110,106,102,100,98,96,95,94,92,91,90], null, ['gated','volatile'],
      [S('Alibaba', 3.3, 0.9, 200, 32, 4.3), S('DHgate', 4.9, 1.2, 15, 22, 4.0)]),
    P('hlt-shower', 'Filtered Shower Head, High Pressure 15-Stage', 'Health & Household', '🚿', 195, 29.99, 'large-std-1', 4.45, 2050, 33, 5600, 4.3, true,
      [86,88,91,93,96,98,101,104,106,109,112,114], null, [],
      [S('Alibaba', 6.7, 1.8, 100, 34, 4.5), S('AliExpress', 10.4, 2.3, 1, 17, 4.2)]),

    // --- Automotive ---
    P('aut-trunk', 'Collapsible Trunk Organizer with Cooler Bag', 'Automotive', '🚗', 25, 34.99, 'large-std-h', 7.2, 1050, 19, 1700, 4.5, false,
      [90,91,93,95,97,99,101,103,105,106,108,110], null, [],
      [S('Alibaba', 8.4, 2.9, 100, 36, 4.6), S('DHgate', 11.9, 3.4, 8, 24, 4.3)]),
    P('aut-vacuum', 'Cordless Handheld Car Vacuum 9kPa', 'Automotive', '🧯', 10, 39.99, 'large-std-2', 5.15, 1750, 41, 7200, 4.1, true,
      [108,105,103,101,100,99,98,97,96,95,94,93], null, ['electric','volatile'],
      [S('Alibaba', 12.6, 2.6, 100, 38, 4.3), S('AliExpress', 18.2, 3.2, 1, 19, 4.0)]),

    // --- Retail arbitrage style (domestic sourcing, thin margins) ---
    P('arb-airfryer', 'Compact 4Qt Air Fryer (Clearance Flip)', 'Home & Kitchen', '🍟', 18, 49.99, 'large-bulky', 10.6, 3100, 52, 11200, 4.4, true,
      [96,97,98,99,100,101,101,102,103,104,105,106], null, ['electric','volatile','oversize'],
      [S('Walmart Clearance', 29.0, 0, 1, 2, 4.9), S('eBay Lots', 24.5, 2.5, 6, 7, 4.1)]),
    P('arb-lego', 'Retired Building Set (Collectible Flip)', 'Toys & Games', '🧱', 5, 79.99, 'large-std-h', 7.4, 850, 44, 2100, 4.8, false,
      [88,90,92,95,97,100,103,106,110,118,130,140], 'Q4', ['seasonal','ip-risk','volatile'],
      [S('Walmart Clearance', 48.0, 0, 1, 2, 4.9), S('Target Clearance', 52.0, 0, 1, 2, 4.8)]),
    P('arb-thermos', 'Insulated 40oz Tumbler w/ Handle (Brand Flip)', 'Kitchen & Dining', '🥤', 180, 34.99, 'large-std-2', 5.05, 2700, 61, 9800, 4.6, true,
      [140,132,124,116,110,104,100,96,93,90,88,86], null, ['volatile','ip-risk'],
      [S('Costco', 19.9, 0, 1, 2, 4.9), S('eBay Lots', 17.5, 1.8, 4, 8, 4.2)])
  ];

  window.DemoData = window.DemoData || {};
  window.DemoData.products = products;
})();
