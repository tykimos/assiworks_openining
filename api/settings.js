const { getSupabaseClient } = require('./_supabase');
const { applyCors } = require('./_cors');

const ADMIN_PASSWORD = 'assiworks2020!@';

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const settings = {};
      (data || []).forEach((row) => {
        settings[row.key] = row.value;
      });

      return res.status(200).json({ ok: true, settings });
    } catch (error) {
      console.error('Settings GET error', error);
      return res.status(500).json({ ok: false, message: '설정을 불러오지 못했습니다.' });
    }
  }

  if (req.method === 'PUT') {
    const incoming = (req.headers['x-admin-token'] || '').trim();
    if (incoming !== ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, message: '관리 권한이 없습니다.' });
    }

    const { key, value } = req.body || {};
    if (!key || value == null) {
      return res.status(400).json({ ok: false, message: 'key와 value를 입력해주세요.' });
    }

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });

      if (error) throw error;

      return res.status(200).json({ ok: true, key, value: String(value) });
    } catch (error) {
      console.error('Settings PUT error', error);
      return res.status(500).json({ ok: false, message: '설정 저장에 실패했습니다.' });
    }
  }

  return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
};
