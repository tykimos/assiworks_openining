const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { buildFullHTML } = require('./_slide-renderer');
const { applyCors } = require('./_cors');

// Vercel serverless function configuration
module.exports.config = { maxDuration: 60 };

// Read CSS once at cold start
const cssPath = path.join(__dirname, '..', 'styles.css');
let cssContent = '';
try {
  cssContent = fs.readFileSync(cssPath, 'utf-8');
} catch (_err) {
  // In Vercel, styles.css is in dist/ which is served statically.
  // Try the dist path as fallback.
  try {
    cssContent = fs.readFileSync(path.join(__dirname, '..', 'dist', 'styles.css'), 'utf-8');
  } catch (_err2) {
    console.error('styles.css not found');
  }
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'POST 메서드만 허용됩니다.' });
  }

  const { markdown } = req.body || {};
  if (!markdown || typeof markdown !== 'string') {
    return res.status(400).json({ ok: false, message: 'markdown 필드가 필요합니다.' });
  }

  const MAX_MARKDOWN_LENGTH = 500_000;
  if (markdown.length > MAX_MARKDOWN_LENGTH) {
    return res.status(400).json({ ok: false, message: `마크다운이 너무 깁니다. (최대 ${MAX_MARKDOWN_LENGTH}자)` });
  }

  let browser = null;
  try {
    const html = buildFullHTML(markdown, cssContent);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 960, height: 540 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      width: '960px',
      height: '540px',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="presentation.pdf"');
    res.send(pdf);
  } catch (error) {
    console.error('PDF export error', error);
    res.status(500).json({ ok: false, message: error.message || 'PDF 생성 중 오류가 발생했습니다.' });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
};
