import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.PREVIEW_URL || 'http://localhost:4337';
const output = 'artifacts/on-development';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const errors = [];
const cases = [];
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [route, label] of [
    ['/about/', 'About Us'],
    ['/hall-of-frames/', 'Hall of Frames'],
  ]) {
    for (const [width, height] of [
      [320, 740],
      [390, 844],
      [768, 1024],
      [1440, 903],
      [2560, 1440],
      [390, 480],
      [1440, 480],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page
        .locator('.chamber-background img')
        .evaluate((img) => img.decode());
      assert.equal(
        await page.locator('h1').textContent(),
        'Page Under Development',
      );
      assert.equal(await page.locator('.chamber-page').textContent(), label);
      assert.equal(await page.locator('.footer').count(), 0);
      assert.deepEqual(
        await page
          .locator('.chamber-actions a')
          .evaluateAll((links) =>
            links.map((link) => link.getAttribute('href')),
          ),
        ['/', '/recruitment/', '/partners/', '/contact/'],
      );
      const metrics = await page.evaluate(() => {
        const content = document.querySelector('.chamber-copy');
        const section = document.querySelector('.arcane-chamber');
        const heading = document.querySelector('h1');
        const image = document.querySelector('.chamber-background img');
        const nodes = [...content.querySelectorAll('h1, p, a')];
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          sectionHeight: section.getBoundingClientRect().height,
          contentTop: content.getBoundingClientRect().top,
          navbarBottom: document
            .querySelector('.navbar')
            .getBoundingClientRect().bottom,
          clipped: nodes.some((node) => {
            const box = node.getBoundingClientRect();
            return (
              box.left < 0 ||
              box.right > innerWidth + 1 ||
              node.scrollWidth > node.clientWidth + 1
            );
          }),
          font: getComputedStyle(heading).fontFamily,
          weight: getComputedStyle(heading).fontWeight,
          bodyFont: getComputedStyle(content).fontFamily,
          animation: getComputedStyle(content).animationName,
          image: image.currentSrc,
          decoded: image.naturalWidth > 0,
          active: [
            ...document.querySelectorAll('.navbar a[aria-current="page"]'),
          ].map((a) => a.textContent.trim()),
        };
      });
      assert.equal(metrics.overflow, false);
      assert.equal(metrics.clipped, false);
      assert.ok(metrics.sectionHeight >= height);
      assert.ok(metrics.contentTop >= metrics.navbarBottom);
      assert.match(metrics.font, /Bluu Next/);
      assert.match(metrics.bodyFont, /Manrope/);
      assert.equal(metrics.weight, '700');
      assert.equal(metrics.animation, 'none');
      assert.ok(metrics.decoded);
      assert.ok(metrics.active.includes(label));
      assert.equal(metrics.image.includes('mobile'), width <= 600);
      cases.push({ route, width, height, metrics });
      if (
        (width === 390 && height === 844) ||
        (width === 1440 && height === 903)
      ) {
        await page.screenshot({
          path: `${output}/${route.split('/')[1]}-${width}.png`,
          fullPage: true,
        });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto(`${base}/about/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content:
      '.chamber-copy { font-size: 200%; } .chamber-copy h1 { font-size: 64px; } .chamber-copy p { font-size: 32px; } .chamber-actions .button { height: auto; min-height: 48px; white-space: normal; }',
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.ok(
    await page
      .locator('.arcane-chamber')
      .evaluate((el) => el.getBoundingClientRect().height > innerHeight),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/about/`, { waitUntil: 'networkidle' });
  await page.locator('.mobile-menu summary').click();
  await page.waitForFunction(() => document.querySelector('.mobile-menu').open);
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => !document.querySelector('.mobile-menu').open,
  );
  await page.waitForFunction(() => !document.querySelector('main').inert);
  await page.locator('.chamber-actions a').first().focus();
  await page.keyboard.press('Tab');
  assert.equal(
    await page
      .locator('.chamber-actions a')
      .nth(1)
      .evaluate((el) => el.matches(':focus-visible')),
    true,
  );
  for (const [label, route] of [
    ['Back to Home', '/'],
    ['Recruitment', '/recruitment/'],
    ['Partners', '/partners/'],
    ['Contact', '/contact/'],
  ]) {
    await page.goto(`${base}/about/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => (window.__chamberNavigationProof = true));
    await page
      .locator('.chamber-actions')
      .getByRole('link', { name: label, exact: true })
      .click();
    await page.waitForURL(`${base}${route}`);
    assert.equal(
      await page.evaluate(() => window.__chamberNavigationProof),
      true,
      'Astro client navigation must preserve the window',
    );
    assert.equal(await page.locator('.arcane-chamber').count(), 0);
    await page.goBack({ waitUntil: 'networkidle' });
    await page.locator('.arcane-chamber').waitFor();
    assert.equal(await page.locator('.chamber-actions a').count(), 4);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`${base}/hall-of-frames/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.chamber-copy')).opacity === '1',
  );
  assert.notEqual(
    await page
      .locator('.chamber-copy')
      .evaluate((el) => getComputedStyle(el).animationName),
    'none',
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/verification.json`,
    JSON.stringify(
      { cases, interactions: 'PASS', browserErrors: errors },
      null,
      2,
    ),
  );
  console.log(
    `On Development PASS: ${cases.length} layouts, enlarged text, keyboard, menu, 4 client links/back, motion; browserErrors: []`,
  );
} finally {
  await browser.close();
}
