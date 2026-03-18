import { createClient } from '@supabase/supabase-js';

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function assertNoSupabaseError(error, label) {
  if (error) {
    throw new Error(`Supabase ${label} failed: ${error.message}`);
  }
}

export async function deleteCommunityDataForUser(user) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { skipped: true };
  }

  const voterIdentifiers = [String(user.id), user.email].filter(Boolean);

  if (voterIdentifiers.length > 0) {
    const { error: votesError } = await supabase
      .from('community_votes')
      .delete()
      .in('voter_identifier', voterIdentifiers);
    assertNoSupabaseError(votesError, 'votes delete');
  }

  if (user.name) {
    const { error: commentsError } = await supabase
      .from('community_comments')
      .delete()
      .eq('author_name', user.name);
    assertNoSupabaseError(commentsError, 'comments delete');

    const { error: postsError } = await supabase
      .from('community_posts')
      .delete()
      .eq('author_name', user.name);
    assertNoSupabaseError(postsError, 'posts delete');
  }

  return { skipped: false };
}
