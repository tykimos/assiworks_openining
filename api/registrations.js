const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

const ADMIN_PASSWORD = 'assiworks2020!@';

const authorize = (req, res) => {
  const incoming = req.headers['x-admin-token'];
  if (incoming !== ADMIN_PASSWORD) {
    res.status(401).json({ ok: false, message: '인증되지 않았습니다.' });
    return false;
  }
  return true;
};

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  if (!authorize(req, res)) return;

  try {
    const supabase = await getSupabaseClient();

    if (req.method === 'DELETE') {
      const { id, ids } = req.body || {};
      const targetIds = Array.isArray(ids)
        ? ids.map((value) => String(value).trim()).filter(Boolean)
        : id
          ? [String(id).trim()]
          : [];

      if (!targetIds.length) {
        return res.status(400).json({ ok: false, message: '삭제할 항목 id 또는 ids가 필요합니다.' });
      }

      const { error: deleteError } = await supabase.from('registrations').delete().in('id', targetIds);
      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({ ok: true, deletedIds: targetIds });
    }

    const { data, error } = await supabase
      .from('registrations')
      .select('id,name,email,affiliation,position,note,cancelled_at,created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return res.status(200).json({ ok: true, registrations: data });
  } catch (error) {
    console.error('Registrations API error', error);
    return res.status(500).json({ ok: false, message: '관리자 요청을 처리하지 못했습니다.' });
  }
};
