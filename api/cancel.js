const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  const source = req.method === 'GET' ? req.query || {} : req.body || {};
  const { token } = source;
  if (!token) {
    return res.status(400).json({ ok: false, message: '취소 코드를 입력해주세요.' });
  }

  try {
    const supabase = await getSupabaseClient();
    const { data: registration, error: findError } = await supabase
      .from('registrations')
      .select('id,cancelled_at')
      .eq('cancel_token', token)
      .maybeSingle();

    if (findError || !registration) {
      return res.status(404).json({ ok: false, message: '해당 정보를 찾을 수 없습니다.' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        cancelled: Boolean(registration.cancelled_at),
        cancelledAt: registration.cancelled_at || null,
      });
    }

    if (registration.cancelled_at) {
      return res.status(200).json({
        ok: true,
        alreadyCancelled: true,
        cancelled: true,
        cancelledAt: registration.cancelled_at,
      });
    }

    const { error: updateError } = await supabase
      .from('registrations')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('id', registration.id);

    if (updateError) {
      return res
        .status(500)
        .json({ ok: false, message: '취소 상태를 반영하지 못했습니다. 잠시 후 다시 시도해주세요.' });
    }

    return res.status(200).json({
      ok: true,
      alreadyCancelled: false,
      cancelled: true,
      cancelledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cancellation error', error);
    return res.status(500).json({ ok: false, message: '취소 처리 중 오류가 발생했습니다.' });
  }
};
