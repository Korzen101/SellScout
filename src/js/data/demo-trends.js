// Category trend + seasonal planning demo data (global: DemoData.trends)
(function () {
  'use strict';

  const T = (name, growthPct, spark, note) => ({ name, growthPct, spark, note });

  window.DemoData = window.DemoData || {};

  window.DemoData.trends = {
    rising: [
      T('Pickleball & racquet sports', 42, [60,64,70,76,84,92,100,108,116,124,132,142],
        'Participation growth keeps pulling accessories, sets and court gear upward.'),
      T('Home espresso & coffee gear', 31, [70,73,77,82,87,92,97,103,109,115,121,127],
        'Café-at-home habit is sticky; tampers, scales and frothers all rising.'),
      T('Cooling sleep products', 27, [74,76,79,83,87,92,96,101,106,111,116,120],
        'Cooling blankets, pillows and mattress toppers trend with heat waves.'),
      T('Pet enrichment toys', 24, [78,80,83,86,89,93,96,100,104,108,112,116],
        'Puzzle feeders and lick mats ride the pet-wellness wave.'),
      T('Desk ergonomics', 19, [82,84,86,89,91,94,97,100,103,106,109,112],
        'Foot rests, monitor risers and wrist supports grow with hybrid work.'),
      T('Garden lighting', 17, [70,74,82,92,102,112,118,114,104,94,84,78],
        'Seasonal but expanding YoY; solar path lights lead searches.'),
      T('Travel organization', 15, [84,86,88,91,93,96,98,101,104,106,109,111],
        'Packing cubes and tech pouches track the travel rebound.'),
      T('Kids STEM & craft kits', 12, [86,84,82,81,82,85,88,94,102,116,132,146],
        'Q4-weighted but building a stronger baseline every year.')
    ],
    fading: [
      T('Gua sha & face rollers', -18, [140,132,124,117,111,106,101,97,94,91,89,87],
        'Post-viral normalization; deep review moats remain from the boom.'),
      T('Weighted jump ropes', -22, [150,140,128,118,110,104,99,95,92,90,88,86],
        'Home-fitness spike continues to unwind toward baseline.'),
      T('Posture correctors', -15, [130,124,118,113,108,104,101,98,96,94,92,90],
        'Demand steady-to-down; heavy ad spend required to rank.')
    ],
    seasonal: [
      { m: 'Jan', t: 'Organization & fitness resets ship now' },
      { m: 'Feb', t: 'Source spring garden; Valentine’s last calls' },
      { m: 'Mar', t: 'Garden & outdoor listings live; Easter prep' },
      { m: 'Apr', t: 'Summer goods ordered (fans, coolers, hydration)' },
      { m: 'May', t: 'Summer inventory inbound; Father’s Day angle' },
      { m: 'Jun', t: 'Prime Day prep: deals, stock depth, PPC plans' },
      { m: 'Jul', t: 'Back-to-school inbound; source Q4 toys NOW' },
      { m: 'Aug', t: 'Q4 orders placed; Halloween goods inbound' },
      { m: 'Sep', t: 'Q4 inventory ships; holiday listings polished' },
      { m: 'Oct', t: 'Final Q4 inbound window; BFCM deal setup' },
      { m: 'Nov', t: 'BFCM execution; watch stock velocity daily' },
      { m: 'Dec', t: 'Holiday sell-through; plan January resets' }
    ]
  };
})();
