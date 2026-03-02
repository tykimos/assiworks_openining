/**
 * Slide Renderer Module
 *
 * Pure-JS rendering pipeline for the presentation markdown format.
 * Extracted from db/preview-slides.js for reuse in server-side APIs.
 */

const escapeHtml = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const safeUrl = (url) => {
  const decoded = url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  if (/^https?:\/\//i.test(decoded) || /^\//.test(decoded) || /^data:image\//i.test(decoded)) return url;
  return '';
};

const parseMetadata = (slideText) => {
  const trimmed = (slideText || '').trim();
  const match = trimmed.match(/^<!--\s*([\s\S]*?)\s*-->/);
  if (!match) return { meta: { layout: 'default' }, body: trimmed };
  const meta = { layout: 'default' };
  match[1].split(',').forEach((pair) => {
    const [k, ...vParts] = pair.split(':');
    if (k && vParts.length) meta[k.trim()] = vParts.join(':').trim();
  });
  const body = trimmed.slice(match[0].length).trim();
  return { meta, body };
};

const parseDirectives = (bodyText) => {
  const lines = (bodyText || '').split('\n');
  const tokenMap = {};
  const stack = [];
  let tokenCounter = 0;
  const result = [];
  const directiveRe = /^\[(cols-3|cols|col|left|right|center|bottom|box)(?:\s+([^\]]*))?\]$/;

  for (const line of lines) {
    if (!line.trim()) {
      result.push('');
      continue;
    }

    const leadingSpaces = line.match(/^( *)/)[1].length;
    const indent = Math.floor(leadingSpaces / 2);
    const stripped = line.trim();

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
      const token = `__DIR_${tokenCounter++}__`;
      tokenMap[token] = '</div>';
      result.push(token);
    }

    const m = stripped.match(directiveRe);
    if (m) {
      const directive = m[1];
      const args = (m[2] || '').trim();
      let html = '';
      if (directive === 'cols') {
        const ratioMatch = args.match(/^(\d+):(\d+)$/);
        html = ratioMatch
          ? `<div class="slide-cols" style="grid-template-columns: ${ratioMatch[1]}fr ${ratioMatch[2]}fr;">`
          : '<div class="slide-cols">';
      } else if (directive === 'cols-3') {
        html = '<div class="slide-cols-3">';
      } else if (directive === 'left' || directive === 'right' || directive === 'col') {
        const parent = stack.length ? stack[stack.length - 1].directive : null;
        if (directive === 'left') html = '<div class="slide-col-left">';
        else if (directive === 'right')
          html =
            parent === 'cols' || parent === 'cols-3'
              ? '<div class="slide-col-right">'
              : '<div class="slide-align-right">';
        else html = '<div class="slide-col">';
      } else if (directive === 'center') {
        html = '<div class="slide-align-center">';
      } else if (directive === 'bottom') {
        const modifiers = args ? args.split(/\s+/) : [];
        const classes = ['slide-align-bottom'];
        modifiers.forEach((mod) => {
          if (mod === 'right') classes.push('slide-align-right');
        });
        html = `<div class="${classes.join(' ')}">`;
      } else if (directive === 'box') {
        const modifiers = args ? args.split(/\s+/).filter(Boolean) : [];
        const classes = ['slide-box', ...modifiers.map((mod) => `slide-box-${mod}`)];
        html = `<div class="${classes.join(' ')}">`;
      }
      const token = `__DIR_${tokenCounter++}__`;
      tokenMap[token] = html;
      result.push(token);
      stack.push({ directive, indent });
    } else {
      result.push(stripped);
    }
  }

  while (stack.length > 0) {
    stack.pop();
    const token = `__DIR_${tokenCounter++}__`;
    tokenMap[token] = '</div>';
    result.push(token);
  }

  return { text: result.join('\n'), tokenMap };
};

const slideClassMap = {
  '.large': 'slide-text-large',
  '.small': 'slide-text-small',
  '.muted': 'slide-text-muted',
  '.accent': 'slide-text-accent',
  '.orange': 'slide-text-orange',
  '.center': 'slide-text-center',
  '.gradient': 'slide-text-gradient',
  '.glow': 'slide-text-glow',
  '.xl': 'slide-text-xl',
  '.xxl': 'slide-text-xxl',
  '.bold': 'slide-text-bold',
  '.light': 'slide-text-light',
  '.spacer': 'slide-spacer',
  '.spacer-lg': 'slide-spacer-lg',
  '.spacer-xl': 'slide-spacer-xl',
  '.spacer-sm': 'slide-spacer-sm',
  '.fade-in': 'slide-frag',
  '.fade-up': 'slide-fade-up',
  '.scale-in': 'slide-scale-in',
  '.white': 'slide-text-white',
  '.blue': 'slide-text-blue',
  '.sub': 'slide-text-sub',
};

const mapClasses = (rawClasses) =>
  rawClasses.map((cls) => slideClassMap[cls] || (!cls.startsWith('.') ? cls : '')).filter(Boolean);

const parseStyleClasses = (text, tokenMap) => {
  const lines = (text || '').split('\n');
  let tokenCounter = 0;
  while (tokenMap[`__STYLE_${tokenCounter}__`]) tokenCounter++;
  const result = [];
  let pendingClose = null;

  for (const line of lines) {
    let remaining = line;
    const allRawClasses = [];
    const classBlockRe = /^\{((?:\.[a-zA-Z0-9_-]+(?:\s+)?)+(?:\s+[a-zA-Z0-9_-]+)*)\}\s*/;
    let cm;
    while ((cm = remaining.match(classBlockRe))) {
      allRawClasses.push(...cm[1].trim().split(/\s+/));
      remaining = remaining.slice(cm[0].length);
    }
    if (allRawClasses.length === 0) {
      if (pendingClose && (!line.trim() || /^__DIR_\d+__$/.test(line.trim()))) {
        result.push(pendingClose);
        pendingClose = null;
      }
      result.push(line);
      continue;
    }
    if (pendingClose) {
      result.push(pendingClose);
      pendingClose = null;
    }

    const cssClasses = [];
    let isSpacer = false;
    for (const cls of allRawClasses) {
      if (cls === '.spacer' || cls === '.spacer-lg' || cls === '.spacer-xl' || cls === '.spacer-sm') {
        isSpacer = true;
        cssClasses.push(slideClassMap[cls]);
      } else if (slideClassMap[cls]) {
        cssClasses.push(slideClassMap[cls]);
      } else if (!cls.startsWith('.')) {
        cssClasses.push(cls);
      }
    }
    const classStr = cssClasses.join(' ');
    if (isSpacer) {
      const token = `__STYLE_${tokenCounter++}__`;
      tokenMap[token] = `<div class="${classStr}"></div>`;
      result.push(token);
    } else if (!remaining) {
      const openToken = `__STYLE_${tokenCounter++}__`;
      const closeToken = `__STYLE_${tokenCounter++}__`;
      tokenMap[openToken] = `<div class="${classStr}">`;
      tokenMap[closeToken] = '</div>';
      result.push(openToken);
      pendingClose = closeToken;
    } else {
      const openToken = `__STYLE_${tokenCounter++}__`;
      const closeToken = `__STYLE_${tokenCounter++}__`;
      tokenMap[openToken] = `<div class="${classStr}">`;
      tokenMap[closeToken] = '</div>';
      result.push(`${openToken}${remaining}${closeToken}`);
    }
  }
  if (pendingClose) {
    result.push(pendingClose);
    pendingClose = null;
  }
  return { text: result.join('\n'), tokenMap };
};

const restorePlaceholders = (html, tokenMap) => {
  for (const [token, replacement] of Object.entries(tokenMap)) {
    html = html.split(token).join(replacement);
  }
  html = html.replace(/<p>\s*(<div[\s>])/g, '$1');
  html = html.replace(/(<\/div>)\s*<\/p>/g, '$1');
  html = html.replace(/<br\/>\s*(<div[\s>])/g, '$1');
  html = html.replace(/(<\/div>)\s*<br\/>/g, '$1');
  return html;
};

const renderMarkdown = (text) => {
  let html = escapeHtml(text);
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, _lang, code) => `<pre><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const safe = safeUrl(src);
    return safe ? `<img src="${safe}" alt="${alt}" class="slide-img" />` : alt;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safe = safeUrl(href);
    return safe ? `<a href="${safe}" target="_blank" rel="noopener">${label}</a>` : label;
  });
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^(\*{3,}|_{3,})\s*$/gm, '<hr/>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(
    /\{((?:\.[a-zA-Z0-9_-]+(?:\s+)?)+(?:\s+[a-zA-Z0-9_-]+)*)\}\(([^)]+)\)/g,
    (_, rawCls, content) => {
      const cssClasses = mapClasses(rawCls.trim().split(/\s+/));
      return `<span class="slide-inline-styled ${cssClasses.join(' ')}">${content}</span>`;
    }
  );
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = html.replace(/<\/li>\s*<br\/>\s*<li>/g, '</li><li>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<h[123]>)/g, '$1');
  html = html.replace(/(<\/h[123]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<hr\/>)/g, '$1');
  html = html.replace(/(<hr\/>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<img )/g, '$1');
  html = html.replace(
    /(<img\s[^>]*class="slide-img"[^>]*\/?>)\s*(?:<br\s*\/?>)?\s*(<img\s[^>]*class="slide-img"[^>]*\/?>)/g,
    '<div class="slide-images-row">$1$2</div>'
  );
  return html;
};

const splitSlides = (text) => (text || '').split(/^-{3,}\s*$/m).map((s) => s.trim());

const renderSlide = (slideText) => {
  const { meta, body } = parseMetadata(slideText);
  const dir = parseDirectives(body);
  const sty = parseStyleClasses(dir.text, dir.tokenMap);
  let html = renderMarkdown(sty.text);
  html = restorePlaceholders(html, sty.tokenMap);
  return { meta, html };
};

const buildFullHTML = (markdown, cssContent) => {
  const slides = splitSlides(markdown);
  const slideCards = slides
    .map((slideText, i) => {
      const { meta, html } = renderSlide(slideText);
      const layoutClass = meta.layout !== 'default' ? ` slide-layout-${meta.layout}` : '';
      const bgStyle = meta.bg ? ` style="background-color: ${escapeHtml(meta.bg)};"` : '';
      const extraClass = meta.class ? ` ${escapeHtml(meta.class)}` : '';
      return `<div class="pres-viewer-slide${layoutClass}${extraClass}"${bgStyle}>
      <div class="pres-viewer-content">${html}</div>
    </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${cssContent}

/* PDF export overrides */
body { margin: 0 !important; padding: 0 !important; background: transparent !important; }
.slides-container { display: block !important; margin: 0 !important; padding: 0 !important; }
.pres-viewer-slide {
  position: relative !important;
  width: 960px !important;
  max-width: 960px !important;
  height: 540px !important;
  max-height: 540px !important;
  min-height: 540px !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: stretch !important;
  justify-content: center !important;
  padding: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  page-break-after: always;
  background:
    radial-gradient(120% 75% at 50% 12%, rgba(209, 224, 236, 0.86) 0%, rgba(209, 224, 236, 0) 64%),
    linear-gradient(180deg, #d9dced 0%, #d8e1ec 42%, #e5e4f0 100%) !important;
}
.pres-viewer-content {
  width: 100% !important;
  height: 100% !important;
  padding: 2rem 2.5rem !important;
  overflow: hidden !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  color: #111532;
  font-family: 'Pretendard', 'Inter', system-ui, -apple-system, sans-serif;
}
.pres-viewer-content h1 { font-size: 1.8em !important; margin: 0 0 0.3em !important; }
.pres-viewer-content h2 { font-size: 1.4em !important; margin: 0 0 0.3em !important; }
.pres-viewer-content p { margin: 0 0 0.4em !important; }
.pres-viewer-content ul { margin: 0 0 0.4em !important; padding-left: 1.2em !important; }
.pres-viewer-content li { margin-bottom: 0.1em !important; font-size: 0.9em !important; }
.slide-box { padding: 0.8rem 1rem !important; margin: 0.3rem 0 !important; }
.slide-spacer { height: 0.5rem !important; }
.slide-spacer-sm { height: 0.3rem !important; }
.slide-spacer-lg { height: 1rem !important; }
.slide-spacer-xl { height: 1.5rem !important; }
.slide-text-xl { font-size: 1.5em !important; }
.slide-text-xxl { font-size: 2.2em !important; }
.slide-text-large { font-size: 1.2em !important; }
.slide-text-small { font-size: 0.8em !important; }

/* Fragments: show all (no animation) */
.slide-frag, .slide-fade-up, .slide-scale-in { opacity: 1 !important; transform: none !important; animation: none !important; }

@page { size: 960px 540px; margin: 0; }
</style>
</head>
<body>
<div class="slides-container">
${slideCards}
</div>
</body>
</html>`;
};

module.exports = { splitSlides, renderSlide, buildFullHTML };
