const SEND_MAIL_BASE_URL =
  'https://send-mail.nicedune-dfc430a8.westus2.azurecontainerapps.io';
const SENDER_EMAIL = 'se@aifactory.page';
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

const sendRegistrationEmail = async ({ to, name, cancelLink }) => {
  const payload = {
    senderEmail: SENDER_EMAIL,
    recipientEmails: [to],
    subject: 'AssiWorks Opening 등록이 완료되었습니다',
    body: buildRegistrationBody({ name, cancelLink }),
  };

  for (const path of SEND_MAIL_PATH_CANDIDATES) {
    const endpoint = `${SEND_MAIL_BASE_URL}${path}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status === 404) continue;
      if (!response.ok) {
        throw new Error(`메일 전송 실패 (${response.status})`);
      }
      return { success: true, endpoint };
    } catch (error) {
      if (error.message.includes('메일 전송 실패')) throw error;
      continue;
    }
  }
  throw new Error('메일 API 호출에 실패했습니다.');
};
