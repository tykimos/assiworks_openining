const { getSupabaseClient } = require('./_supabase');
const { sendReminderEmail } = require('./_mailer');
const { applyCors } = require('./_cors');

module.exports = async (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: '허용되지 않은 메서드입니다.' });
  }

  const { registrationId } = req.body || {};
  if (!registrationId) {
    return res.status(400).json({ ok: false, message: '등록 ID가 필요합니다.' });
  }

  try {
    const supabase = getSupabaseClient();
    const { data: registration, error: findError } = await supabase
      .from('registrations')
      .select('id,email,name,cancelled_at')
      .eq('id', registrationId)
      .maybeSingle();

    if (findError || !registration) {
      return res.status(404).json({ ok: false, message: '등록 정보를 찾을 수 없습니다.' });
    }

    if (registration.cancelled_at) {
      return res.status(400).json({ ok: false, message: '취소된 등록에는 리마인드를 보낼 수 없습니다.' });
    }

    await sendReminderEmail({ to: registration.email, name: registration.name });

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ reminded_at: now })
      .eq('id', registration.id);

    if (updateError) {
      console.error('Remind update error', updateError);
    }

    return res.status(200).json({ ok: true, reminded_at: now });
  } catch (error) {
    console.error('Remind error', error);
    return res.status(500).json({ ok: false, message: error.message || '리마인드 발송 중 오류가 발생했습니다.' });
  }
};
