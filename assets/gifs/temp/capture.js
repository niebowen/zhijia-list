
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const name = process.argv[2];
  const seqDir = process.argv[3];
  const baseUrl = process.argv[4];

  if (!fs.existsSync(seqDir)) fs.mkdirSync(seqDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark'
  });
  const page = await context.newPage();

  let frameIndex = 0;
  const snap = async () => {
    const p = path.join(seqDir, `f${String(frameIndex).padStart(3, '0')}.png`);
    await page.screenshot({ path: p, type: 'png' });
    frameIndex++;
  };

  try {
    if (name === '01-homepage') {
      await page.goto(`${baseUrl}/#/quiz`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600); await snap();
      await page.evaluate(() => window.scrollTo(0, 280));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 520));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 280));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500); await snap();
    }
    else if (name === '02-quiz') {
      await page.goto(`${baseUrl}/#/quiz`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        localStorage.removeItem('zhijia_quiz_completed');
        localStorage.removeItem('zhijia_quiz_result');
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(600); await snap();

      const btn = await page.$('button:has-text("开始智能测评")') || await page.$('button:has-text("重新测评")');
      if (btn) await btn.click();
      await page.waitForTimeout(700); await snap();

      const opt1 = await page.$('.quiz-option:has-text("米家")');
      if (opt1) await opt1.click();
      await page.waitForTimeout(500); await snap();

      const opt2 = await page.$('.quiz-option:has-text("租房")');
      if (opt2) await opt2.click();
      await page.waitForTimeout(500); await snap();

      const next1 = await page.$('button:has-text("下一步")');
      if (next1) await next1.click();
      await page.waitForTimeout(500); await snap();

      const opt3 = await page.$('.quiz-option:has-text("自住")');
      if (opt3) await opt3.click();
      await page.waitForTimeout(300); await snap();

      const opt4 = await page.$('.quiz-option:has-text("有宠物")');
      if (opt4) await opt4.click();
      await page.waitForTimeout(400); await snap();

      const next2 = await page.$('button:has-text("下一步")');
      if (next2) await next2.click();
      await page.waitForTimeout(600); await snap();
    }
    else if (name === '03-recommend') {
      await page.evaluate(() => {
        localStorage.setItem('zhijia_quiz_result', JSON.stringify({
          platform: 'mijia', houseType: 'rent',
          rooms: { bedrooms: 2, livingRooms: 1 },
          members: ['self', 'pet'],
          scenarios: ['home', 'security'],
          painPoints: ['forget-light', 'pet-monitor']
        }));
        localStorage.setItem('zhijia_quiz_completed', 'true');
      });
      await page.goto(`${baseUrl}/#/recommend`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(700); await snap();
      await page.evaluate(() => window.scrollTo(0, 350));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 700));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 350));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500); await snap();
    }
    else if (name === '04-square') {
      await page.goto(`${baseUrl}/#/square`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(700); await snap();
      await page.evaluate(() => window.scrollTo(0, 350));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 700));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 350));
      await page.waitForTimeout(400); await snap();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500); await snap();
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  await page.close();
  await context.close();
  await browser.close();
  console.log(`Captured ${frameIndex} frames for ${name}`);
}

run();
