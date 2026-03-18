// ──────────────────────────────────────────────────────────────────────────────
// ForestGuard AI — Community Data Service (Supabase)
// All community CRUD operations for posts, comments, and votes.
// ──────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * Get a unique voter identifier (fingerprint) for anonymous voting.
 */
function getVoterIdentifier() {
  let id = localStorage.getItem('fg_voter_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('fg_voter_id', id);
  }
  return id;
}

// ── Posts ────────────────────────────────────────────────────────────────────

/**
 * Fetch community posts with pagination and filters.
 */
export async function fetchPosts({ page = 1, limit = 12, type, tag, forestId, search, sort = 'newest' } = {}) {
  if (!isSupabaseConfigured()) return { data: [], count: 0 };

  let query = supabase
    .from('community_posts')
    .select('*', { count: 'exact' });

  if (type && type !== 'all') query = query.eq('post_type', type);
  if (forestId) query = query.eq('forest_id', forestId);
  if (tag) query = query.contains('tags', [tag]);
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

  // Sorting
  if (sort === 'newest') query = query.order('created_at', { ascending: false });
  else if (sort === 'popular') query = query.order('upvotes', { ascending: false });
  else if (sort === 'discussed') query = query.order('comment_count', { ascending: false });

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error('fetchPosts error:', error);
    return { data: [], count: 0 };
  }
  return { data: data || [], count: count || 0 };
}

/**
 * Fetch a single post by ID.
 */
export async function fetchPost(postId) {
  if (!isSupabaseConfigured()) return null;

  // Increment view count
  await supabase.rpc('increment_view_count', { post_id: postId }).catch(() => {});

  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('fetchPost error:', error);
    return null;
  }
  return data;
}

/**
 * Create a new community post.
 */
export async function createPost(postData) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_name: postData.authorName || 'Anonymous',
      post_type: postData.postType || 'discussion',
      title: postData.title,
      content: postData.content,
      forest_id: postData.forestId || null,
      tags: postData.tags || [],
      latitude: postData.latitude || null,
      longitude: postData.longitude || null,
      location_name: postData.locationName || null,
      image_urls: postData.imageUrls || [],
    })
    .select()
    .single();

  if (error) {
    console.error('createPost error:', error);
    return null;
  }

  // Update tag usage counts
  if (postData.tags?.length) {
    for (const tag of postData.tags) {
      await supabase
        .from('community_tags')
        .upsert({ name: tag, usage_count: 1 }, { onConflict: 'name' })
        .then(() =>
          supabase.rpc('increment_tag_usage', { tag_name: tag }).catch(() => {})
        );
    }
  }

  return data;
}

// ── Comments ────────────────────────────────────────────────────────────────

/**
 * Fetch comments for a post.
 */
export async function fetchComments(postId) {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchComments error:', error);
    return [];
  }
  return data || [];
}

/**
 * Add a comment to a post.
 */
export async function addComment({ postId, content, authorName, parentCommentId }) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      content,
      author_name: authorName || 'Anonymous',
      parent_comment_id: parentCommentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('addComment error:', error);
    return null;
  }

  // Increment comment count on the post
  await supabase.rpc('increment_comment_count', { p_post_id: postId }).catch(() => {
    // Fallback: manual increment
    supabase
      .from('community_posts')
      .select('comment_count')
      .eq('id', postId)
      .single()
      .then(({ data: post }) => {
        if (post) {
          supabase
            .from('community_posts')
            .update({ comment_count: (post.comment_count || 0) + 1 })
            .eq('id', postId)
            .then(() => {});
        }
      });
  });

  return data;
}

// ── Votes ───────────────────────────────────────────────────────────────────

/**
 * Vote on a post or comment.
 */
export async function vote({ targetType, targetId, voteType }) {
  if (!isSupabaseConfigured()) return null;

  const voterId = getVoterIdentifier();

  // Check existing vote
  const { data: existing } = await supabase
    .from('community_votes')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('voter_identifier', voterId)
    .single();

  const table = targetType === 'post' ? 'community_posts' : 'community_comments';

  if (existing) {
    if (existing.vote_type === voteType) {
      // Remove vote (toggle off)
      await supabase.from('community_votes').delete().eq('id', existing.id);
      const field = voteType === 'up' ? 'upvotes' : 'downvotes';
      const { data: item } = await supabase.from(table).select(field).eq('id', targetId).single();
      if (item) {
        await supabase.from(table).update({ [field]: Math.max(0, (item[field] || 0) - 1) }).eq('id', targetId);
      }
      return { action: 'removed' };
    } else {
      // Switch vote direction
      await supabase.from('community_votes').update({ vote_type: voteType }).eq('id', existing.id);
      const addField = voteType === 'up' ? 'upvotes' : 'downvotes';
      const removeField = voteType === 'up' ? 'downvotes' : 'upvotes';
      const { data: item } = await supabase.from(table).select(`${addField}, ${removeField}`).eq('id', targetId).single();
      if (item) {
        await supabase.from(table).update({
          [addField]: (item[addField] || 0) + 1,
          [removeField]: Math.max(0, (item[removeField] || 0) - 1),
        }).eq('id', targetId);
      }
      return { action: 'switched', voteType };
    }
  }

  // New vote
  const { error } = await supabase.from('community_votes').insert({
    target_type: targetType,
    target_id: targetId,
    voter_identifier: voterId,
    vote_type: voteType,
  });

  if (error) {
    console.error('vote error:', error);
    return null;
  }

  const field = voteType === 'up' ? 'upvotes' : 'downvotes';
  const { data: item } = await supabase.from(table).select(field).eq('id', targetId).single();
  if (item) {
    await supabase.from(table).update({ [field]: (item[field] || 0) + 1 }).eq('id', targetId);
  }

  return { action: 'voted', voteType };
}

/**
 * Get user's existing vote for a target.
 */
export async function getUserVote(targetType, targetId) {
  if (!isSupabaseConfigured()) return null;
  const voterId = getVoterIdentifier();
  const { data } = await supabase
    .from('community_votes')
    .select('vote_type')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('voter_identifier', voterId)
    .single();
  return data?.vote_type || null;
}

// ── Tags ────────────────────────────────────────────────────────────────────

/**
 * Fetch popular tags.
 */
export async function fetchTags(limit = 20) {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('community_tags')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchTags error:', error);
    return [];
  }
  return data || [];
}

// ── Trending ────────────────────────────────────────────────────────────────

/**
 * Fetch trending posts (most upvoted in last 7 days).
 */
export async function fetchTrending(limit = 5) {
  if (!isSupabaseConfigured()) return [];

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .gte('created_at', weekAgo)
    .order('upvotes', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchTrending error:', error);
    return [];
  }
  return data || [];
}

// ── Real-time Subscriptions ─────────────────────────────────────────────────

/**
 * Subscribe to new posts in real-time.
 */
export function subscribeToNewPosts(callback) {
  if (!isSupabaseConfigured()) return { unsubscribe: () => {} };

  const subscription = supabase
    .channel('community_posts_changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
      callback(payload.new);
    })
    .subscribe();

  return {
    unsubscribe: () => subscription.unsubscribe(),
  };
}

/**
 * Subscribe to new comments on a specific post.
 */
export function subscribeToComments(postId, callback) {
  if (!isSupabaseConfigured()) return { unsubscribe: () => {} };

  const subscription = supabase
    .channel(`comments_${postId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'community_comments',
      filter: `post_id=eq.${postId}`,
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();

  return {
    unsubscribe: () => subscription.unsubscribe(),
  };
}
