const DEFAULT_SEND_MAIL_BASE_URL =
  'https://send-mail.nicedune-dfc430a8.westus2.azurecontainerapps.io';
const DEFAULT_SENDER_EMAIL = 'se@aifactory.page';

const SEND_MAIL_PATH_CANDIDATES = ['/email/aws-send', '/emails/aws-send', '/api/v1/emails/aws-send'];

const EVENT_TITLE = 'AssiWorks Opening';
const EVENT_DESCRIPTION =
  'AssiWorks Opening 행사 일정입니다. 등록 취소는 메일에 포함된 링크를 이용해주세요.';
const EVENT_LOCATION = '서울 종로구 광화문 한국Microsoft 본사 13층';
const EVENT_DATES = '20260303T050000Z/20260303T080000Z';
const EVENT_TIMEZONE = 'Asia/Seoul';

const buildGoogleCalendarLink = () => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    details: EVENT_DESCRIPTION,
    location: EVENT_LOCATION,
    dates: EVENT_DATES,
    ctz: EVENT_TIMEZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildRegistrationBody = ({ name, cancelLink }) => {
  const safeName = name?.trim() || '게스트';
  const googleCalendarLink = buildGoogleCalendarLink();
  return [
    `${safeName}님, AssiWorks Opening 사전 등록이 완료되었습니다.`,
    '',
    '아래 링크를 통해 구글 캘린더에 일정을 등록하실 수 있습니다.',
    googleCalendarLink,
    '',
    '일정에 변동이 있을 경우 아래 링크를 통해 등록을 취소하실 수 있습니다.',
    cancelLink,
    '',
    '감사합니다.',
  ].join('\n');
};

const isSenderVerificationError = (error) => {
  const message = error?.message || '';
  return message.includes('Email address is not verified');
};

const sendWithPath = async (baseUrl, path, payload) => {
  const endpoint = `${baseUrl.replace(/\/$/, '')}${path}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.text().catch(() => '');
  if (!response.ok) {
    const error = new Error(`메일 API 호출 실패(${response.status}): ${responseBody || '응답 본문 없음'}`);
    error.statusCode = response.status;
    error.endpoint = endpoint;
    throw error;
  }

  let parsed = null;
  try {
    parsed = responseBody ? JSON.parse(responseBody) : null;
  } catch (_error) {
    parsed = null;
  }

  if (Array.isArray(parsed)) {
    const failed = parsed.filter((item) => item && item.isSuccess === false);
    if (failed.length > 0) {
      const reason = failed
        .map((item) => `${item.email || 'unknown'}:${item.errorMessage || 'unknown error'}`)
        .join(', ');
      const error = new Error(`메일 API 내부 전송 실패: ${reason}`);
      error.endpoint = endpoint;
      error.mailResults = parsed;
      throw error;
    }
  }

  return { endpoint, mailResults: Array.isArray(parsed) ? parsed : [] };
};

const sendRegistrationEmail = async ({ to, name, cancelLink }) => {
  const baseUrl = process.env.SEND_MAIL_BASE_URL || DEFAULT_SEND_MAIL_BASE_URL;
  const preferredSender = process.env.REGISTRATION_FROM_EMAIL || DEFAULT_SENDER_EMAIL;
  const senderCandidates = Array.from(new Set([preferredSender, DEFAULT_SENDER_EMAIL]));
  let lastError = null;

  for (const senderEmail of senderCandidates) {
    const payload = {
      senderEmail,
      recipientEmails: [to],
      subject: 'AssiWorks Opening 등록이 완료되었습니다',
      body: buildRegistrationBody({ name, cancelLink }),
    };

    let lastNotFoundError = null;
    for (const path of SEND_MAIL_PATH_CANDIDATES) {
      try {
        const result = await sendWithPath(baseUrl, path, payload);
        return { ...result, senderEmail };
      } catch (error) {
        if (error?.statusCode === 404) {
          lastNotFoundError = error;
          continue;
        }
        lastError = error;
        break;
      }
    }

    if (lastNotFoundError && !lastError) {
      lastError = lastNotFoundError;
    }

    // 등록용 발신자 이메일이 SES 미검증일 때는 기본 발신자로 한 번 더 시도합니다.
    if (!isSenderVerificationError(lastError)) {
      break;
    }
  }

  throw lastError || new Error('메일 API 호출 중 알 수 없는 오류가 발생했습니다.');
};

module.exports = { sendRegistrationEmail };
