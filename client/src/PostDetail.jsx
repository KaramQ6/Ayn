import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Eye, Tag, Clock, Send,
  MapPin, TreePine, CheckCircle, X, Users, Star, HelpCircle, Camera, Compass
} from 'lucide-react';
import { fetchPost, fetchComments, addComment, vote, getUserVote, subscribeToComments } from './lib/communityService';
import { isSupabaseConfigured } from './lib/supabase';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const postTypeIcons = {
  discussion: MessageSquare,
  question: HelpCircle,
  recommendation: Star,
  trip_report: Compass,
  photo: Camera,
};

// ── Vote Buttons ─────────────────────────────────────────────────────────────
function VoteButtons({ targetType, targetId, upvotes = 0, downvotes = 0, vertical = false }) {
  const [userVote, setUserVote] = useState(null);
  const [counts, setCounts] = useState({ up: upvotes, down: downvotes });

  useEffect(() => {
    getUserVote(targetType, targetId).then(v => setUserVote(v));
  }, [targetType, targetId]);

  useEffect(() => {
    setCounts({ up: upvotes, down: downvotes });
  }, [upvotes, downvotes]);

  const handleVote = async (voteType) => {
    const result = await vote({ targetType, targetId, voteType });
    if (result) {
      if (result.action === 'removed') {
        setCounts(prev => ({ ...prev, [voteType === 'up' ? 'up' : 'down']: Math.max(0, prev[voteType === 'up' ? 'up' : 'down'] - 1) }));
        setUserVote(null);
      } else if (result.action === 'switched') {
        setCounts(prev => ({ up: voteType === 'up' ? prev.up + 1 : Math.max(0, prev.up - 1), down: voteType === 'down' ? prev.down + 1 : Math.max(0, prev.down - 1) }));
        setUserVote(voteType);
      } else {
        setCounts(prev => ({ ...prev, [voteType === 'up' ? 'up' : 'down']: prev[voteType === 'up' ? 'up' : 'down'] + 1 }));
        setUserVote(voteType);
      }
    }
  };

  const score = counts.up - counts.down;

  return (
    <div className={`flex items-center gap-1 ${vertical ? 'flex-col' : ''}`}>
      <button onClick={() => handleVote('up')} className={`p-2 rounded-lg transition-colors ${userVote === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
        <ThumbsUp className="w-4 h-4" />
      </button>
      <span className={`text-sm font-data font-bold ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-white/30'}`}>{score}</span>
      <button onClick={() => handleVote('down')} className={`p-2 rounded-lg transition-colors ${userVote === 'down' ? 'bg-red-500/20 text-red-400' : 'text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}>
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Comment Component ────────────────────────────────────────────────────────
function Comment({ comment, postId, allComments, onReply, onCommentAdded, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState(localStorage.getItem('fg_author_name') || '');
  const [submitting, setSubmitting] = useState(false);

  const replies = allComments.filter(c => c.parent_comment_id === comment.id);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    localStorage.setItem('fg_author_name', replyAuthor);
    const result = await addComment({
      postId,
      content: replyContent.trim(),
      authorName: replyAuthor.trim() || 'Anonymous',
      parentCommentId: comment.id,
    });
    setSubmitting(false);
    if (result) {
      onCommentAdded(result);
      setReplyContent('');
      setReplying(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ms-6 border-s border-white/5 ps-4' : ''}`}>
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-emerald-500/30 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">
            {comment.author_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="text-xs font-medium text-white/70">{comment.author_name || 'Anonymous'}</span>
          <span className="text-[9px] font-data text-white/30">{timeAgo(comment.created_at)}</span>
          {comment.is_answer && (
            <span className="flex items-center gap-1 text-[9px] font-data text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-2.5 h-2.5" /> Best Answer
            </span>
          )}
        </div>
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        <div className="flex items-center gap-3 mt-3">
          <VoteButtons targetType="comment" targetId={comment.id} upvotes={comment.upvotes || 0} downvotes={0} />
          {depth < 3 && (
            <button onClick={() => setReplying(!replying)} className="text-[10px] font-data text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest">
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {replying && (
        <div className="ms-6 mb-3 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
          <input
            type="text"
            value={replyAuthor}
            onChange={(e) => setReplyAuthor(e.target.value)}
            placeholder="Your name..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30 mb-2"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleReply(); }}
              placeholder="Write a reply..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30"
            />
            <button onClick={handleReply} disabled={submitting || !replyContent.trim()} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30 disabled:opacity-30 transition-colors">
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {replies.map(reply => (
        <Comment key={reply.id} comment={reply} postId={postId} allComments={allComments} onReply={onReply} onCommentAdded={onCommentAdded} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Post Detail Page ─────────────────────────────────────────────────────────
export default function PostDetail() {
  const { postId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(localStorage.getItem('fg_author_name') || '');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [postData, commentsData] = await Promise.all([fetchPost(postId), fetchComments(postId)]);
    setPost(postData);
    setComments(commentsData);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time comments
  useEffect(() => {
    const sub = subscribeToComments(postId, (newComment) => {
      setComments(prev => [...prev, newComment]);
    });
    return () => sub.unsubscribe();
  }, [postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    localStorage.setItem('fg_author_name', commentAuthor);
    const result = await addComment({
      postId,
      content: newComment.trim(),
      authorName: commentAuthor.trim() || 'Anonymous',
    });
    setSubmitting(false);
    if (result) {
      setComments(prev => [...prev, result]);
      setNewComment('');
    }
  };

  const handleCommentAdded = (comment) => {
    setComments(prev => [...prev, comment]);
  };

  const TypeIcon = post ? (postTypeIcons[post.post_type] || MessageSquare) : MessageSquare;
  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  if (loading) {
    return (
      <div className="bg-[#050A07] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-white/40 font-data uppercase tracking-widest">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-[#050A07] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-white/10 mx-auto" />
          <h2 className="text-xl font-bold text-white/50">Post not found</h2>
          <Link to="/community" className="text-emerald-400 text-sm hover:underline">← Back to Community</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050A07] min-h-screen text-white/80 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A140E]/80 backdrop-blur-xl border-b border-white/5 py-3 px-4 md:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/community')} className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-data text-white/50 uppercase tracking-widest">{post.post_type?.replace('_', ' ')}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Post */}
        <article className="mb-8">
          {/* Author */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-sm font-bold text-white/90">
              {post.author_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <span className="text-sm font-medium text-white/80">{post.author_name || 'Anonymous'}</span>
              <div className="flex items-center gap-2 text-[10px] font-data text-white/30">
                <Clock className="w-3 h-3" />
                <span>{timeAgo(post.created_at)}</span>
                <span>·</span>
                <Eye className="w-3 h-3" />
                <span>{post.view_count || 0} views</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white/95 mb-4 leading-tight">{post.title}</h1>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map(tag => (
                <span key={tag} className="text-[10px] font-data px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Location */}
          {post.location_name && (
            <div className="flex items-center gap-2 mb-5 text-xs font-data text-emerald-400/70">
              <MapPin className="w-3.5 h-3.5" />
              {post.location_name}
              {post.forest_id && <span className="text-white/20">· {post.forest_id}</span>}
            </div>
          )}

          {/* Content */}
          <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap mb-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            {post.content}
          </div>

          {/* Post Actions */}
          <div className="flex items-center gap-4 border-t border-white/5 pt-4">
            <VoteButtons targetType="post" targetId={post.id} upvotes={post.upvotes || 0} downvotes={post.downvotes || 0} />
            <span className="flex items-center gap-1.5 text-white/30 text-xs font-data">
              <MessageSquare className="w-3.5 h-3.5" /> {comments.length} comments
            </span>
          </div>
        </article>

        {/* Comment Form */}
        <div className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
          <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {t('community.addComment', 'Add a Comment')}
          </h3>
          <input
            type="text"
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            placeholder="Your name (optional)..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30 mb-2"
          />
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              rows={3}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30 resize-none"
            />
          </div>
          <button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/30 disabled:opacity-30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest font-data mb-4">
            {comments.length} {t('community.comments', 'Comments')}
          </h3>
          {topLevelComments.length === 0 ? (
            <div className="text-center py-12 text-white/15">
              <MessageSquare className="w-8 h-8 mx-auto mb-3" />
              <p className="text-sm">No comments yet. Start the conversation!</p>
            </div>
          ) : topLevelComments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              postId={postId}
              allComments={comments}
              onReply={() => {}}
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
