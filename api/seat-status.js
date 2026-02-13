const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

const MAX_SEATS = 100;

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  try {
    const supabase = await getSupabaseClient();
    const { count, error } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .is('cancelled_at', null);

    if (error) {
      throw error;
    }

    const activeCount = Number(count) || 0;
    const remaining = Math.max(0, MAX_SEATS - activeCount);

    return res.status(200).json({
      ok: true,
      capacity: MAX_SEATS,
      activeCount,
      remaining,
      full: remaining === 0,
    });
  } catch (error) {
    console.error('Seat status API error', error);
    return res.status(500).json({ ok: false, message: '좌석 현황을 조회하지 못했습니다.' });
  }
};
