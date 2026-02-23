const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

const ADMIN_PASSWORD = 'assiworks2020!@';

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  const incoming = req.headers['x-admin-token'];
  if (incoming !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: '인증되지 않았습니다.' });
  }

  try {
    const supabase = getSupabaseClient();
    const [regResult, invResult] = await Promise.all([
      supabase
        .from('registrations')
        .select('id,name,email,affiliation,position,note,cancelled_at,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    if (regResult.error) throw regResult.error;
    if (invResult.error) throw invResult.error;

    return res.status(200).json({
      ok: true,
      registrations: regResult.data,
      invitations: invResult.data,
    });
  } catch (error) {
    console.error('Admin data API error', error);
    return res.status(500).json({ ok: false, message: '데이터를 불러오지 못했습니다.' });
  }
};
