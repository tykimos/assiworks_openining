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

      const index = entry.value.indexOf(line);
      console.log(index);

      // 마지막 카드(어시벅스와 루프팩토리)에 애니메이션 배경 클래스 적용
      if (index === entry.value.length - 2) {
        article.classList.add('tile-loop');
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

/* global sb, sendRegistrationEmail */
const DEFAULT_SEAT_CAPACITY = 100;

const generateCancelToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  loadCopyDeck();

  const registerForm = document.getElementById('register-form');
  const registerStatus = document.querySelector('.form-status');
  const cancelPageForm = document.getElementById('cancel-page-form');
  const cancelPageStatus = document.getElementById('cancel-page-status');
  const countdown = document.getElementById('countdown');
  const countdownTimeEl = countdown?.querySelector('.countdown__time');
  const targetDate = countdown?.dataset.target ? new Date(countdown.dataset.target) : null;
  const seatProgress = document.querySelector('.seat-progress');
  const seatProgressFill = document.getElementById('seat-progress-fill');
  const seatProgressTrack = document.getElementById('seat-progress-track');
  const seatProgressCount = document.getElementById('seat-progress-count');

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

  const clampPercent = (value) => Math.max(0, Math.min(100, value));

  const updateSeatProgress = ({ capacity = DEFAULT_SEAT_CAPACITY, activeCount = 0 } = {}) => {
    if (!seatProgress || !seatProgressFill || !seatProgressTrack || !seatProgressCount) return;
    const safeCapacity = Number(capacity) > 0 ? Number(capacity) : DEFAULT_SEAT_CAPACITY;
    const safeActiveCount = Math.max(0, Number(activeCount) || 0);
    const usedSeats = Math.min(safeActiveCount, safeCapacity);
    const remainingSeats = Math.max(0, safeCapacity - usedSeats);
    const usedPercent = clampPercent((usedSeats / safeCapacity) * 100);

    seatProgressFill.style.width = `${usedPercent}%`;
    seatProgressTrack.setAttribute('aria-valuemax', String(safeCapacity));
    seatProgressTrack.setAttribute('aria-valuenow', String(usedSeats));
    seatProgressCount.textContent = `${remainingSeats}자리 남음 · ${usedSeats}/${safeCapacity}`;
    seatProgress.classList.toggle('is-near-full', usedPercent >= 80);
  };

  const setSeatProgressFallback = () => {
    if (!seatProgressCount) return;
    seatProgressCount.textContent = '좌석 현황을 확인 중입니다.';
  };

  const refreshSeatProgress = async () => {
    if (!seatProgress) return;
    try {
      const { count, error } = await sb
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .is('cancelled_at', null);
      if (error) throw error;
      updateSeatProgress({ capacity: DEFAULT_SEAT_CAPACITY, activeCount: count || 0 });
    } catch (error) {
      console.warn('Seat status fetch failed', error);
      setSeatProgressFallback();
    }
  };

  setSeatProgressFallback();
  refreshSeatProgress();

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
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!result.registered) {
        throw new Error(result.message || '등록에 실패했습니다.');
      }

      registerProgress?.setStep(1, 'success');
      registerProgress?.setStep(2, 'active');

      const emailSuccess = result.email?.success === true;

      setRegisterProgressByResult({ registered: true, emailSuccess, completed: true });
      const nameValue = payload.name?.toString().trim() || '게스트';
      if (emailSuccess) {
        setStatus(registerStatus, `${nameValue}님, 등록이 완료되었습니다. 확인 이메일을 발송했으니 메일함을 확인해주세요.`);
      } else {
        setStatus(registerStatus, `${nameValue}님, 등록은 완료되었지만 확인 이메일 전송에 실패했습니다. 이메일을 받지 못하셔도 등록은 정상 처리되었습니다.`, true);
      }
      registerForm.reset();
      refreshSeatProgress();
    } catch (error) {
      setRegisterProgressByResult({ registered: false, emailSuccess: false, completed: false });
      setStatus(registerStatus, error.message || '등록에 실패했습니다.', true);
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
      const { data: reg, error: findError } = await sb
        .from('registrations')
        .select('id, cancelled_at')
        .eq('cancel_token', token)
        .maybeSingle();
      if (findError || !reg) {
        setStatus(statusElement, '해당 정보를 찾을 수 없습니다.', true);
        setCancelButtonState(form, { disabled: false, label: '등록 취소' });
        return;
      }
      if (reg.cancelled_at) {
        const cancelledAtText = formatCancelDateTime(reg.cancelled_at);
        setStatus(statusElement, cancelledAtText
          ? `이미 취소된 신청입니다. ${cancelledAtText}에 취소되었습니다.`
          : '이미 취소된 신청입니다.');
        setCancelButtonState(form, { disabled: true, label: '이미 취소됨' });
        return;
      }
      const now = new Date().toISOString();
      const { error: updateError } = await sb
        .from('registrations')
        .update({ cancelled_at: now })
        .eq('id', reg.id);
      if (updateError) throw updateError;
      setStatus(statusElement, `등록 취소가 완료되었습니다. ${formatCancelDateTime(now)}에 취소되었습니다.`);
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
        const { data: reg, error: findError } = await sb
          .from('registrations')
          .select('id, cancelled_at')
          .eq('cancel_token', token)
          .maybeSingle();
        if (findError || !reg) {
          setStatus(cancelPageStatus, '취소 가능한 등록 정보를 찾지 못했습니다. 이메일/취소 코드를 확인해주세요.');
          setCancelButtonState(cancelPageForm, { disabled: false, label: '등록 취소' });
          return;
        }
        if (reg.cancelled_at) {
          const cancelledAtText = formatCancelDateTime(reg.cancelled_at);
          setStatus(cancelPageStatus, cancelledAtText
            ? `이미 취소된 신청입니다. ${cancelledAtText}에 취소되었습니다.`
            : '이미 취소된 신청입니다.');
          setCancelButtonState(cancelPageForm, { disabled: true, label: '이미 취소됨' });
          return;
        }
        setStatus(cancelPageStatus, '정보를 확인한 뒤 "등록 취소" 버튼을 눌러주세요.');
        setCancelButtonState(cancelPageForm, { disabled: false, label: '등록 취소' });
      } catch (error) {
        setStatus(cancelPageStatus, '자동 확인에 실패했습니다. "등록 취소" 버튼을 눌러 다시 시도해주세요.');
        setCancelButtonState(cancelPageForm, { disabled: false, label: '등록 취소' });
        console.warn('Cancel status precheck failed', error);
      }
    }
  }
});
