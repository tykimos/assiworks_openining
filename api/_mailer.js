let resendClientPromise = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClientPromise) {
    resendClientPromise = import('resend').then(({ Resend }) => new Resend(process.env.RESEND_API_KEY));
  }

  return resendClientPromise;
};

const sendRegistrationEmail = async ({ to, name, cancelLink }) => {
  const resend = await getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY가 설정되어 있지 않아 이메일을 전송하지 않았습니다.');
    return;
  }

  const fromAddress = process.env.REGISTRATION_FROM_EMAIL || 'events@assiworks.ai';
  const safeName = name?.trim() || '게스트';
  const html = `
    <div style="font-family: Pretendard, Arial, sans-serif; line-height: 1.6; color: #10132c;">
      <p>${safeName}님, AssiWorks Opening 사전 등록을 완료했습니다.</p>
      <p>일정에 변동이 있을 경우 아래 버튼 또는 링크를 통해 언제든지 취소하실 수 있습니다.</p>
      <p style="margin: 24px 0;">
        <a href="${cancelLink}" style="display: inline-block; background: #636bff; color: #fff; padding: 12px 20px; border-radius: 32px; text-decoration: none;">등록 취소하기</a>
      </p>
      <p style="font-size: 14px; color: #5f648d;">또는 다음 링크를 복사하여 브라우저에 붙여넣어 주세요:</p>
      <p style="word-break: break-all; font-size: 14px;">${cancelLink}</p>
    </div>
  `;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: 'AssiWorks Opening 등록이 완료되었습니다',
    html,
  });
};

module.exports = { sendRegistrationEmail };
