const { getSupabaseClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  const { email, token } = req.body || {};
  if (!email || !token) {
    return res.status(400).json({ ok: false, message: '이메일과 취소 코드를 입력해주세요.' });
  }

  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('registrations')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('email', email)
      .eq('cancel_token', token)
      .is('cancelled_at', null)
      .select('id')
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ ok: false, message: '해당 정보를 찾을 수 없거나 이미 취소되었습니다.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Cancellation error', error);
    return res.status(500).json({ ok: false, message: '취소 처리 중 오류가 발생했습니다.' });
  }
};
