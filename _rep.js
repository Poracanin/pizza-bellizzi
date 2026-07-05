const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://127.0.0.1:8099/admin/Pizza%20Bellizzi%20Panel.dc.html';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function shot(page, name){ await page.screenshot({ path: name }); }

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=2'] });

  for (const vp of [ {w:1024,h:768,t:'land'}, {w:768,h:1024,t:'port'} ]) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('.mega-order-btn', { timeout: 15000 });
    // orders scroll
    await page.evaluate(() => { const v = document.querySelector('.view-scroll'); if (v) v.scrollTop = 380; });
    await sleep(300);
    await shot(page, `_r_orders_${vp.t}.png`);
    // open modal
    await page.evaluate(() => { const v = document.querySelector('.view-scroll'); if (v) v.scrollTop = 0; });
    await page.click('.mega-order-btn');
    await page.waitForSelector('.no-tile', { timeout: 8000 });
    await sleep(400);
    await shot(page, `_r_modal_${vp.t}.png`);
    // diagnostics
    const info = await page.evaluate(() => {
      const g = document.querySelector('.no-tile-grid');
      const m = document.querySelector('.no-tile-media');
      const cs = g ? getComputedStyle(g) : null;
      const csm = m ? getComputedStyle(m) : null;
      return {
        gridDisplay: cs && cs.display,
        gridCols: cs && cs.gridTemplateColumns,
        gridW: g && g.getBoundingClientRect().width,
        mediaW: m && m.getBoundingClientRect().width,
        mediaH: m && m.getBoundingClientRect().height,
        tileCount: document.querySelectorAll('.no-tile').length,
      };
    });
    console.log(vp.t, JSON.stringify(info));
    await page.close();
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('ERR', e); process.exit(1); });
