const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

const authorize = (req, res) => {
  const adminToken = process.env.REGISTRATIONS_ADMIN_TOKEN;
  if (!adminToken) {
    res.status(500).json({ ok: false, message: '관리자 토큰이 설정되지 않았습니다.' });
    return false;
  }

  const incoming = req.headers['x-admin-token'];
  if (incoming !== adminToken) {
    res.status(401).json({ ok: false, message: '인증되지 않았습니다.' });
    return false;
  }
  return true;
};

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  if (!authorize(req, res)) return;

  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('registrations')
      .select('id,name,email,company,created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    return res.status(200).json({ ok: true, registrations: data });
  } catch (error) {
    console.error('Registrations fetch error', error);
    return res.status(500).json({ ok: false, message: '데이터를 불러오지 못했습니다.' });
  }
};
