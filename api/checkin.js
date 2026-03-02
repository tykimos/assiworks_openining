const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ ok: false, message: '토큰이 필요합니다.' });
  }

  try {
    const supabase = getSupabaseClient();
    const { data: registration, error: findError } = await supabase
      .from('registrations')
      .select('id,name,email,affiliation,position,cancelled_at,checked_in_at')
      .eq('reg_token', token)
      .maybeSingle();

    if (findError || !registration) {
      return res.status(404).json({ ok: false, message: '등록 정보를 찾을 수 없습니다.' });
    }

    if (registration.cancelled_at) {
      return res.status(400).json({
        ok: false,
        message: '취소된 등록입니다. 체크인할 수 없습니다.',
        cancelled: true,
      });
    }

    if (registration.checked_in_at) {
      return res.status(200).json({
        ok: true,
        already_checked_in: true,
        checked_in_at: registration.checked_in_at,
        registration: {
          name: registration.name,
          email: registration.email,
          affiliation: registration.affiliation,
          position: registration.position,
        },
      });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ checked_in_at: now })
      .eq('id', registration.id);

    if (updateError) {
      return res.status(500).json({ ok: false, message: '체크인 처리에 실패했습니다.' });
    }

    return res.status(200).json({
      ok: true,
      already_checked_in: false,
      checked_in_at: now,
      registration: {
        name: registration.name,
        email: registration.email,
        affiliation: registration.affiliation,
        position: registration.position,
      },
    });
  } catch (error) {
    console.error('Checkin error', error);
    return res.status(500).json({ ok: false, message: '체크인 처리 중 오류가 발생했습니다.' });
  }
};
