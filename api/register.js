const crypto = require('crypto');
const { getSupabaseClient } = require('./_supabase');
const { sendRegistrationEmail } = require('./_mailer');
const { applyCors } = require('./_cors');

const getOrigin = (req) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const protocolHeader = req.headers['x-forwarded-proto'];
  const protocol =
    protocolHeader || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${protocol}://${host}`;
};

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  const { email, name, affiliation, position, company, message } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ ok: false, message: '이름과 이메일을 모두 입력해주세요.' });
  }

  try {
    const supabase = await getSupabaseClient();
    const cancelToken = crypto.randomBytes(24).toString('hex');
    const normalizedAffiliation = affiliation || company || null;
    const normalizedPosition = position || null;

    const { error } = await supabase
      .from('registrations')
      .insert({
        email,
        name,
        affiliation: normalizedAffiliation,
        position: normalizedPosition,
        note: message || null,
        cancel_token: cancelToken,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error', error);
      return res.status(500).json({ ok: false, message: '등록 정보를 저장하지 못했습니다.' });
    }

    const origin = getOrigin(req);
    const cancelLink = `${origin.replace(/\/$/, '')}/cancel.html?token=${cancelToken}&email=${encodeURIComponent(
      email
    )}`;

    try {
      const emailResult = await sendRegistrationEmail({ to: email, name, cancelLink });
      return res.status(200).json({
        ok: true,
        registered: true,
        cancelToken,
        cancelLink,
        email: {
          success: true,
          endpoint: emailResult?.endpoint || null,
          results: emailResult?.mailResults || [],
        },
      });
    } catch (emailError) {
      console.error('Email send error', emailError);
      return res.status(502).json({
        ok: false,
        registered: true,
        cancelToken,
        cancelLink,
        email: {
          success: false,
          endpoint: emailError?.endpoint || null,
          results: emailError?.mailResults || [],
          error: emailError?.message || null,
        },
        message: '등록은 완료됐지만 확인 이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
    }
  } catch (error) {
    console.error('Registration error', error);
    return res.status(500).json({ ok: false, message: '서버 오류가 발생했습니다.' });
  }
};
