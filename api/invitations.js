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

  const allowed = ['GET', 'POST', 'PUT', 'DELETE'];
  if (!allowed.includes(req.method)) {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  if (!authorize(req, res)) return;

  try {
    const supabase = await getSupabaseClient();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return res.status(200).json({ ok: true, invitations: data });
    }

    if (req.method === 'POST') {
      const { name, email, phone, affiliation, position, category, attendance, memo,
              email_sent_at, sms_sent_at, sns_sent_at, call_at } = req.body || {};
      if (!name) {
        return res.status(400).json({ ok: false, message: '이름은 필수입니다.' });
      }
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          name,
          email: email || null,
          phone: phone || null,
          affiliation: affiliation || null,
          position: position || null,
          category: category || '일반',
          attendance: attendance || 'undecided',
          memo: memo || null,
          email_sent_at: email_sent_at || null,
          sms_sent_at: sms_sent_at || null,
          sns_sent_at: sns_sent_at || null,
          call_at: call_at || null,
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ ok: true, invitation: data });
    }

    if (req.method === 'PUT') {
      const { id, ...fields } = req.body || {};
      if (!id) {
        return res.status(400).json({ ok: false, message: '수정할 항목 id가 필요합니다.' });
      }
      const allowedFields = [
        'name', 'email', 'phone', 'affiliation', 'position', 'category',
        'attendance', 'memo', 'email_sent_at', 'sms_sent_at', 'sns_sent_at',
        'call_at', 'registration_id',
      ];
      const safeFields = Object.fromEntries(
        Object.entries(fields).filter(([k]) => allowedFields.includes(k)),
      );
      if (!Object.keys(safeFields).length) {
        return res.status(400).json({ ok: false, message: '수정할 필드가 없습니다.' });
      }
      const { data, error } = await supabase
        .from('invitations')
        .update(safeFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ ok: true, invitation: data });
    }

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

      const { error } = await supabase.from('invitations').delete().in('id', targetIds);
      if (error) throw error;

      return res.status(200).json({ ok: true, deletedIds: targetIds });
    }
  } catch (error) {
    console.error('Invitations API error', error);
    return res.status(500).json({ ok: false, message: '초대 관리 요청을 처리하지 못했습니다.' });
  }
};
