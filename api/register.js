const crypto = require('crypto');
const { getSupabaseClient } = require('./_supabase');
const { sendRegistrationEmail } = require('./_mailer');

const getOrigin = (req) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const protocolHeader = req.headers['x-forwarded-proto'];
  const protocol =
    protocolHeader || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${protocol}://${host}`;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  const { email, name, company, message } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ ok: false, message: '이름과 이메일을 모두 입력해주세요.' });
  }

  try {
    const supabase = await getSupabaseClient();
    const cancelToken = crypto.randomBytes(24).toString('hex');

    const { error } = await supabase
      .from('registrations')
      .insert({
        email,
        name,
        company: company || null,
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
      await sendRegistrationEmail({ to: email, name, cancelLink });
    } catch (emailError) {
      console.error('Email send error', emailError);
    }

    return res.status(200).json({ ok: true, cancelToken, cancelLink });
  } catch (error) {
    console.error('Registration error', error);
    return res.status(500).json({ ok: false, message: '서버 오류가 발생했습니다.' });
  }
};
