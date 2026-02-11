let supabaseClientPromise = null;

const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase 환경 변수가 올바르게 설정되지 않았습니다.');
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    );
  }

  return supabaseClientPromise;
};

module.exports = { getSupabaseClient };
