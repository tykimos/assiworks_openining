const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

const DEFAULT_MAX_SEATS = 100;

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  try {
    const supabase = getSupabaseClient();

    const [countResult, settingResult] = await Promise.all([
      supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .is('cancelled_at', null),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'seat_capacity')
        .single(),
    ]);

    if (countResult.error) throw countResult.error;

    const maxSeats = (settingResult.data && Number(settingResult.data.value) > 0)
      ? Number(settingResult.data.value)
      : DEFAULT_MAX_SEATS;

    const activeCount = Number(countResult.count) || 0;
    const remaining = Math.max(0, maxSeats - activeCount);

    return res.status(200).json({
      ok: true,
      capacity: maxSeats,
      activeCount,
      remaining,
      full: remaining === 0,
    });
  } catch (error) {
    console.error('Seat status API error', error);
    return res.status(500).json({ ok: false, message: '좌석 현황을 조회하지 못했습니다.' });
  }
};
