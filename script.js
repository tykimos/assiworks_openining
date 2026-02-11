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

const postJSON = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    const message = data?.message || data?.error || '요청 처리 중 오류가 발생했습니다.';
    throw new Error(message);
  }
  return data;
};

document.addEventListener('DOMContentLoaded', () => {
  loadCopyDeck();

  const registerForm = document.getElementById('register-form');
  const registerStatus = document.querySelector('.form-status');
  const cancelForm = document.getElementById('cancel-form');
  const cancelStatus = document.querySelector('.cancel-status');
  const cancelPageForm = document.getElementById('cancel-page-form');
  const cancelPageStatus = document.getElementById('cancel-page-status');
  const cancelPanel = document.querySelector('.cancel-helper');
  const cancelToggle = document.getElementById('toggle-cancel');
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

  const setStatus = (element, message, isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('form-error', Boolean(isError));
  };

  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    if (!registerForm || !registerStatus) return;
    setStatus(registerStatus, '등록 요청을 처리 중입니다...');

    const formData = new FormData(registerForm);
    const payload = {
      email: formData.get('email'),
      name: formData.get('name'),
      company: formData.get('company'),
      message: formData.get('message'),
    };

    try {
      const result = await postJSON('/api/register', payload);
      const nameValue = payload.name?.toString().trim() || '게스트';
      setStatus(registerStatus, `${nameValue}님, 등록 요청을 완료했습니다. 이메일을 확인해주세요.`);
      if (cancelStatus) {
        cancelStatus.textContent = `취소 링크: ${result.cancelLink}`;
      }
      registerForm.reset();
    } catch (error) {
      setStatus(registerStatus, error.message || '등록에 실패했습니다.', true);
    }
  };

  const performCancel = async (email, token, statusElement) => {
    if (!email || !token) {
      setStatus(statusElement, '이메일과 취소 코드를 모두 입력해주세요.', true);
      return;
    }
    setStatus(statusElement, '취소 요청을 처리 중입니다...');
    try {
      await postJSON('/api/cancel', { email, token });
      setStatus(statusElement, '등록 취소가 완료되었습니다.');
    } catch (error) {
      setStatus(statusElement, error.message || '취소 요청을 처리하지 못했습니다.', true);
    }
  };

  const handleInlineCancel = async (event) => {
    event.preventDefault();
    if (!cancelForm || !cancelStatus) return;
    const formData = new FormData(cancelForm);
    const email = formData.get('email');
    const token = formData.get('token');
    await performCancel(email, token, cancelStatus);
  };

  const handlePageCancel = async (event) => {
    event?.preventDefault();
    if (!cancelPageForm || !cancelPageStatus) return;
    const formData = new FormData(cancelPageForm);
    const email = formData.get('email');
    const token = formData.get('token');
    await performCancel(email, token, cancelPageStatus);
  };

  registerForm?.addEventListener('submit', handleRegistrationSubmit);
  cancelForm?.addEventListener('submit', handleInlineCancel);
  cancelPageForm?.addEventListener('submit', handlePageCancel);

  cancelToggle?.addEventListener('click', () => {
    if (!cancelPanel) return;
    const isHidden = cancelPanel.hasAttribute('hidden');
    if (isHidden) {
      cancelPanel.removeAttribute('hidden');
      cancelToggle.textContent = '취소 폼 닫기';
    } else {
      cancelPanel.setAttribute('hidden', '');
      cancelToggle.textContent = '등록 취소하기';
    }
  });

  if (document.body.dataset.page === 'cancel') {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');
    if (email && token && cancelPageForm) {
      cancelPageForm.email.value = email;
      cancelPageForm.token.value = token;
      performCancel(email, token, cancelPageStatus);
    }
  }
});
