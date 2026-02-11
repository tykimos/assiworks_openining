const parseMarkdownSections = (markdown) => {
  const data = {};
  const lines = markdown.split(/\r?\n/);
  let currentKey = null;
  let buffer = [];

  const interpretSection = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { type: 'text', value: '' };
    }
    const lines = trimmed.split(/\r?\n/);
    const normalized = lines.map((line) => line.trim()).filter((line) => line.length > 0);
    const isList = normalized.length > 0 && normalized.every((line) => line.startsWith('- '));

    if (isList) {
      const items = normalized.map((line) => line.replace(/^-+\s*/, '').trim());
      return { type: 'list', value: items };
    }

    return { type: 'text', value: trimmed };
  };

  const flush = () => {
    if (!currentKey) return;
    data[currentKey] = interpretSection(buffer.join('\n'));
    currentKey = null;
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentKey = headingMatch[1].trim();
      continue;
    }

    if (line.match(/^#\s+/) && !currentKey) {
      continue;
    }

    if (currentKey !== null) {
      buffer.push(line);
    }
  }

  flush();
  return data;
};

const entryToText = (entry) => {
  if (!entry) return '';
  if (entry.type === 'list') {
    return entry.value.join(' ');
  }
  return entry.value;
};

const applyCopyDeck = (copy) => {
  const textForKey = (key) => entryToText(copy[key]);

  document.querySelectorAll('[data-md-key]').forEach((el) => {
    const text = textForKey(el.dataset.mdKey);
    if (text) {
      el.textContent = text;
    }
  });

  document.querySelectorAll('[data-md-placeholder]').forEach((el) => {
    const text = textForKey(el.dataset.mdPlaceholder);
    if (text) {
      el.setAttribute('placeholder', text);
    }
  });

  const sessionDetails = document.querySelector('[data-md-list="session-details"]');
  const sessionEntry = copy['session-details'];
  if (sessionDetails && sessionEntry?.type === 'list') {
    sessionDetails.innerHTML = '';
    sessionEntry.value.forEach((line) => {
      const [label = '', value = ''] = line.split('|').map((part) => part?.trim() ?? '');
      if (!label && !value) return;
      const item = document.createElement('div');
      const labelEl = document.createElement('p');
      labelEl.className = 'label';
      labelEl.textContent = label;
      const valueEl = document.createElement('p');
      valueEl.className = 'value';
      valueEl.textContent = value;
      item.append(labelEl, valueEl);
      sessionDetails.appendChild(item);
    });
  }

  document.querySelectorAll('[data-md-list]').forEach((el) => {
    const key = el.dataset.mdList;
    if (key === 'session-details') return;
    const entry = copy[key];
    if (!entry || entry.type !== 'list') return;
    el.innerHTML = '';
    entry.value.forEach((value) => {
      if (!value) return;
      const listItem = document.createElement('li');
      listItem.textContent = value;
      el.appendChild(listItem);
    });
  });

  document.querySelectorAll('[data-md-tiles]').forEach((el) => {
    const key = el.dataset.mdTiles;
    const entry = copy[key];
    if (!entry || entry.type !== 'list') return;
    el.innerHTML = '';
    entry.value.forEach((line) => {
      const [title = '', body = ''] = line.split('|').map((part) => part?.trim() ?? '');
      if (!title && !body) return;
      const article = document.createElement('article');
      const heading = document.createElement('h3');
      heading.textContent = title;
      const paragraph = document.createElement('p');
      paragraph.textContent = body;
      article.append(heading, paragraph);
      el.appendChild(article);
    });
  });
};

const loadCopyDeck = async () => {
  try {
    const cacheBustedUrl = `content.md?v=${Date.now()}`;
    const response = await fetch(cacheBustedUrl, { cache: 'no-cache', credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`Failed to load copy deck: ${response.status}`);
    }
    const markdown = await response.text();
    const copy = parseMarkdownSections(markdown);
    applyCopyDeck(copy);
  } catch (error) {
    const notice = document.createElement('p');
    notice.className = 'copy-error';
    notice.textContent = '콘텐츠를 불러오는 중 문제가 발생했습니다.';
    document.querySelector('.intro-panel')?.prepend(notice);
    console.error(error);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadCopyDeck();

  const form = document.querySelector('.register-form');
  const status = document.querySelector('.form-status');
  const countdown = document.getElementById('countdown');
  const countdownTimeEl = countdown?.querySelector('.countdown__time');
  const targetDate = countdown?.dataset.target ? new Date(countdown.dataset.target) : null;

  const formatTime = (value) => value.toString().padStart(2, '0');

  let countdownInterval;

  const updateCountdown = () => {
    if (!countdownTimeEl || !targetDate) return;

    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      countdownTimeEl.textContent = 'LIVE NOW';
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownTimeEl.textContent = `D-${days} ${formatTime(hours)}:${formatTime(
      minutes
    )}:${formatTime(seconds)}`;
  };

  updateCountdown();
  if (targetDate) {
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name') || '게스트';

    status.textContent = `${name}님, 사전 등록 요청을 완료했습니다.`;
    form.reset();
  });
});
