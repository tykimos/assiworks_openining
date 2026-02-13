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
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      article.classList.add('tile-card');
      if (slug) {
        article.classList.add(`tile-${slug}`);
      }
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

const API_FALLBACK_HOST = 'https://assiworks-openining.vercel.app';

const sendJson = async (baseUrl, path, method, payload) => {
  const endpoint = `${baseUrl}${path}`;
  const options = { method, headers: { 'content-type': 'application/json' } };
  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
  }
  const response = await fetch(endpoint, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
};

const requestJSON = async ({ path, method = 'POST', payload }) => {
  const bases = [''];
  const fallbackHost = API_FALLBACK_HOST;
  const currentHost = window.location.origin;
  if (!currentHost.startsWith(fallbackHost)) {
    bases.push(fallbackHost);
  }

  let lastError;
  for (const base of bases) {
    try {
      const { response, data } = await sendJson(base, path, method, payload);
      if (response.ok && data?.ok !== false) {
        return data;
      }
      const message = data?.message || data?.error || `요청 처리 중 오류가 발생했습니다. (${response.status})`;
      const enrichedError = new Error(message);
      enrichedError.payload = data;
      enrichedError.statusCode = response.status;
      lastError = enrichedError;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('요청 처리 중 오류가 발생했습니다.');
};

const postJSON = (path, payload) => requestJSON({ path, method: 'POST', payload });
const getJSON = (path) => requestJSON({ path, method: 'GET' });

document.addEventListener('DOMContentLoaded', async () => {
  loadCopyDeck();

  const registerForm = document.getElementById('register-form');
  const registerStatus = document.querySelector('.form-status');
  const cancelPageForm = document.getElementById('cancel-page-form');
  const cancelPageStatus = document.getElementById('cancel-page-status');
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

  const formatCancelDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const setCancelButtonState = (form, { disabled, label }) => {
    const cancelButton = form?.querySelector('button[type="submit"]');
    if (!cancelButton) return;
    if (typeof disabled === 'boolean') {
      cancelButton.disabled = disabled;
    }
    if (label) {
      cancelButton.textContent = label;
    }
  };

  const createRegisterProgress = (form) => {
    if (!form) return null;

    const steps = [
      '입력 정보 확인',
      '등록 정보 저장',
      '확인 이메일 전송',
      '등록 완료',
    ];
    const stateLabels = {
      pending: '대기',
      active: '진행 중',
      success: '완료',
      error: '오류',
    };
    const stateClassMap = {
      pending: '',
      active: 'is-active',
      success: 'is-success',
      error: 'is-error',
    };

    const card = document.createElement('section');
    card.className = 'progress-card';
    card.setAttribute('aria-live', 'polite');
    card.hidden = true;

    const list = document.createElement('ol');
    list.className = 'progress-list';
    const nodes = steps.map((label) => {
      const item = document.createElement('li');
      item.className = 'progress-item';

      const icon = document.createElement('span');
      icon.className = 'progress-icon';
      icon.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      text.className = 'progress-text';
      text.textContent = label;

      const state = document.createElement('span');
      state.className = 'progress-state';
      state.textContent = stateLabels.pending;

      item.append(icon, text, state);
      list.appendChild(item);

      return { item, state };
    });
    card.appendChild(list);
    registerStatus?.insertAdjacentElement('beforebegin', card);

    const setStep = (index, status) => {
      const node = nodes[index];
      if (!node) return;
      node.item.classList.remove('is-active', 'is-success', 'is-error');
      const className = stateClassMap[status];
      if (className) {
        node.item.classList.add(className);
      }
      node.state.textContent = stateLabels[status] || stateLabels.pending;
    };

    const reset = () => {
      nodes.forEach((_, idx) => setStep(idx, 'pending'));
      card.hidden = true;
    };

    return { setStep, reset, show: () => (card.hidden = false), count: steps.length };
  };

  const registerProgress = createRegisterProgress(registerForm);
  let registerInFlight = false;

  const startRegisterProgress = () => {
    registerProgress?.reset();
    registerProgress?.show();
    registerProgress?.setStep(0, 'success');
    registerProgress?.setStep(1, 'active');
  };

  const setRegisterProgressByResult = ({ registered, emailSuccess, completed }) => {
    registerProgress?.setStep(0, 'success');
    registerProgress?.setStep(1, registered ? 'success' : 'error');

    if (registered) {
      registerProgress?.setStep(2, emailSuccess ? 'success' : 'error');
      registerProgress?.setStep(3, completed ? 'success' : 'error');
      return;
    }

    registerProgress?.setStep(2, 'pending');
    registerProgress?.setStep(3, 'pending');
  };

  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    if (!registerForm || !registerStatus) return;
    if (registerInFlight) return;
    registerInFlight = true;
    startRegisterProgress();
    const submitButton = registerForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }
    setStatus(registerStatus, '등록 요청을 처리 중입니다...');

    const formData = new FormData(registerForm);
    const payload = {
      email: formData.get('email'),
      name: formData.get('name'),
      affiliation: formData.get('affiliation'),
      position: formData.get('position'),
      message: formData.get('message'),
    };

    try {
      const result = await postJSON('/api/register', payload);
      const isRegistered = Boolean(result?.registered);
      const isEmailSuccess = result?.email?.success !== false;
      setRegisterProgressByResult({ registered: isRegistered, emailSuccess: isEmailSuccess, completed: true });
      const nameValue = payload.name?.toString().trim() || '게스트';
      setStatus(registerStatus, `${nameValue}님, 등록 요청을 완료했습니다. 이메일을 확인해주세요.`);
      // 등록 페이지에는 취소 상태 노드가 없어도 성공 처리되도록 안전하게 동작시킵니다.
      if (cancelPageStatus && document.body.dataset.page === 'cancel') {
        cancelPageStatus.textContent = `취소 링크: ${result.cancelLink}`;
      }
      registerForm.reset();
    } catch (error) {
      const responsePayload = error?.payload || {};
      const isRegistered = Boolean(responsePayload?.registered);
      const isEmailSuccess = responsePayload?.email?.success === true;
      const detailedEmailError =
        responsePayload?.email?.results?.[0]?.errorMessage || responsePayload?.email?.error || null;
      setRegisterProgressByResult({
        registered: isRegistered,
        emailSuccess: isEmailSuccess,
        completed: false,
      });
      const errorMessage =
        detailedEmailError ||
        responsePayload?.message ||
        error.message ||
        '등록에 실패했습니다.';
      setStatus(registerStatus, errorMessage, true);
    } finally {
      registerInFlight = false;
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  };

  const performCancel = async (email, token, form, statusElement) => {
    if (!email || !token) {
      setStatus(statusElement, '이메일과 취소 코드를 모두 입력해주세요.', true);
      return;
    }

    setCancelButtonState(form, { disabled: true, label: '처리 중...' });
    setStatus(statusElement, '취소 요청을 처리 중입니다...');
    try {
      const result = await postJSON('/api/cancel', { email, token });
      const cancelledAtText = formatCancelDateTime(result?.cancelledAt);
      if (result?.alreadyCancelled) {
        setStatus(
          statusElement,
          cancelledAtText
            ? `이미 취소된 신청입니다. ${cancelledAtText}에 취소되었습니다.`
            : '이미 취소된 신청입니다.'
        );
        setCancelButtonState(form, { disabled: true, label: '이미 취소됨' });
        return;
      }
      setStatus(
        statusElement,
        cancelledAtText
          ? `등록 취소가 완료되었습니다. ${cancelledAtText}에 취소되었습니다.`
          : '등록 취소가 완료되었습니다.'
      );
      setCancelButtonState(form, { disabled: true, label: '취소 완료' });
    } catch (error) {
      setStatus(statusElement, error.message || '취소 요청을 처리하지 못했습니다.', true);
      setCancelButtonState(form, { disabled: false, label: '등록 취소' });
    }
  };

  const handlePageCancel = async (event) => {
    event?.preventDefault();
    if (!cancelPageForm || !cancelPageStatus) return;
    const formData = new FormData(cancelPageForm);
    const email = formData.get('email');
    const token = formData.get('token');
    await performCancel(email, token, cancelPageForm, cancelPageStatus);
  };

  registerForm?.addEventListener('submit', handleRegistrationSubmit);
  cancelPageForm?.addEventListener('submit', handlePageCancel);

  if (document.body.dataset.page === 'cancel') {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');
    if (email && token && cancelPageForm) {
      cancelPageForm.email.value = email;
      cancelPageForm.token.value = token;
      setCancelButtonState(cancelPageForm, { disabled: true, label: '확인 중...' });
      setStatus(cancelPageStatus, '취소 상태를 확인하는 중입니다...');
      try {
        const status = await getJSON(
          `/api/cancel?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
        );
        if (status?.cancelled) {
          const cancelledAtText = formatCancelDateTime(status?.cancelledAt);
          setStatus(
            cancelPageStatus,
            cancelledAtText
              ? `이미 취소된 신청입니다. ${cancelledAtText}에 취소되었습니다.`
              : '이미 취소된 신청입니다.'
          );
          setCancelButtonState(cancelPageForm, { disabled: true, label: '이미 취소됨' });
          return;
        }
        setStatus(cancelPageStatus, '정보를 확인한 뒤 "등록 취소" 버튼을 눌러주세요.');
        setCancelButtonState(cancelPageForm, { disabled: false, label: '등록 취소' });
      } catch (error) {
        if (error?.statusCode === 404) {
          setStatus(cancelPageStatus, '취소 가능한 등록 정보를 찾지 못했습니다. 이메일/취소 코드를 확인해주세요.');
          setCancelButtonState(cancelPageForm, { disabled: false, label: '등록 취소' });
          return;
        }
        // 링크 진입 시 자동 점검 실패는 치명 오류로 보이지 않게 안내만 노출합니다.
        setStatus(cancelPageStatus, '자동 확인에 실패했습니다. "등록 취소" 버튼을 눌러 다시 시도해주세요.');
        setCancelButtonState(cancelPageForm, { disabled: false, label: '등록 취소' });
        console.warn('Cancel status precheck failed', error);
      }
    }
  }
});
