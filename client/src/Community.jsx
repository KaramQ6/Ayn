import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Eye, Tag, Clock, Search, Plus,
  Filter, TrendingUp, MapPin, Camera, HelpCircle, Compass, FileText, Users,
  Star, ChevronDown, X, TreePine, Mountain, Send, Heart
} from 'lucide-react';
import { fetchPosts, fetchTags, fetchTrending, createPost, vote, getUserVote, subscribeToNewPosts } from './lib/communityService';
import { isSupabaseConfigured } from './lib/supabase';

const POST_TYPES = [
  { id: 'all', icon: MessageSquare, label: 'All' },
  { id: 'discussion', icon: MessageSquare, label: 'Discussions' },
  { id: 'question', icon: HelpCircle, label: 'Questions' },
  { id: 'recommendation', icon: Star, label: 'Recommendations' },
  { id: 'trip_report', icon: Compass, label: 'Trip Reports' },
  { id: 'photo', icon: Camera, label: 'Photos' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'discussed', label: 'Most Discussed' },
];

// ── Post Type Badge ──────────────────────────────────────────────────────────
function PostTypeBadge({ type }) {
  const colors = {
    discussion: 'border-blue-500/20 text-blue-400 bg-blue-500/10',
    question: 'border-purple-500/20 text-purple-400 bg-purple-500/10',
    recommendation: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
    trip_report: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
    photo: 'border-pink-500/20 text-pink-400 bg-pink-500/10',
  };
  return (
    <span className={`text-[9px] font-data uppercase tracking-widest px-2 py-0.5 rounded-full border ${colors[type] || 'border-white/10 text-white/40 bg-white/5'}`}>
      {type?.replace('_', ' ')}
    </span>
  );
}

// ── Vote Buttons ─────────────────────────────────────────────────────────────
function VoteButtons({ targetType, targetId, upvotes = 0, downvotes = 0, onVoted }) {
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
        setCounts(prev => ({
          ...prev,
          [voteType === 'up' ? 'up' : 'down']: Math.max(0, prev[voteType === 'up' ? 'up' : 'down'] - 1)
        }));
        setUserVote(null);
      } else if (result.action === 'switched') {
        setCounts(prev => ({
          up: voteType === 'up' ? prev.up + 1 : Math.max(0, prev.up - 1),
          down: voteType === 'down' ? prev.down + 1 : Math.max(0, prev.down - 1),
        }));
        setUserVote(voteType);
      } else {
        setCounts(prev => ({
          ...prev,
          [voteType === 'up' ? 'up' : 'down']: prev[voteType === 'up' ? 'up' : 'down'] + 1
        }));
        setUserVote(voteType);
      }
      onVoted?.();
    }
  };

  const score = counts.up - counts.down;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); handleVote('up'); }}
        className={`p-1.5 rounded-lg transition-colors ${userVote === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <span className={`text-xs font-data font-bold min-w-[20px] text-center ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-white/30'}`}>
        {score}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); handleVote('down'); }}
        className={`p-1.5 rounded-lg transition-colors ${userVote === 'down' ? 'bg-red-500/20 text-red-400' : 'text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onClick }) {
  const { i18n } = useTranslation();

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

  return (
    <div
      onClick={() => onClick(post)}
      className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 cursor-pointer group hover-lift click-scale focus-ring"
      tabIndex="0"
      role="article"
      aria-label={`Post by ${post.author_name || 'Anonymous'}: ${post.title}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-white/90">
          {post.author_name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-white/80">{post.author_name || 'Anonymous'}</span>
          <div className="flex items-center gap-2 text-[9px] font-data text-white/30">
            <Clock className="w-2.5 h-2.5" />
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <PostTypeBadge type={post.post_type} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white/90 mb-2 line-clamp-2 group-hover:text-emerald-300 transition-colors">
        {post.title}
      </h3>

      {/* Content Preview */}
      <p className="text-xs text-white/50 line-clamp-3 mb-3 leading-relaxed">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[9px] font-data px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5">
              #{tag}
            </span>
          ))}
          {post.tags.length > 4 && (
            <span className="text-[9px] font-data text-white/20">+{post.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Location */}
      {post.location_name && (
        <div className="flex items-center gap-1 mb-3 text-[10px] font-data text-emerald-400/60">
          <MapPin className="w-3 h-3" />
          {post.location_name}
        </div>
      )}

      {/* Footer: Votes + Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <VoteButtons
          targetType="post"
          targetId={post.id}
          upvotes={post.upvotes}
          downvotes={post.downvotes}
        />
        <div className="flex items-center gap-3 text-[10px] font-data text-white/30">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {post.comment_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {post.view_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({ onClose, onCreated, forests = [] }) {
  const { t } = useTranslation();
  const [postType, setPostType] = useState('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(localStorage.getItem('fg_author_name') || '');
  const [forestId, setForestId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    localStorage.setItem('fg_author_name', authorName);

    const result = await createPost({
      postType,
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim() || 'Anonymous',
      forestId: forestId || null,
      locationName: locationName.trim() || null,
      tags,
    });

    setSubmitting(false);
    if (result) {
      onCreated(result);
      onClose();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[#0A140E]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <h2 className="text-lg font-bold text-white/90">{t('community.createPost', 'Create Post')}</h2>
          <button onClick={onClose} aria-label={t('common.close', 'Close')} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors focus-ring">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Post Type */}
          <div className="flex flex-wrap gap-1.5">
            {POST_TYPES.filter(t => t.id !== 'all').map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setPostType(type.id)}
                aria-label={`Post type: ${type.label}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-data uppercase tracking-widest border transition-colors focus-ring ${
                  postType === type.id
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : 'border-white/10 text-white/40 hover:text-white/60 bg-white/5 cursor-pointer'
                }`}
              >
                <type.icon className="w-3 h-3" />
                {type.label}
              </button>
            ))}
          </div>

          {/* Author Name */}
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t('community.yourName', 'Your name (optional)')}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40"
          />

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('community.postTitle', 'Post title...')}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40"
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('community.postContent', 'Share your experience, ask a question, or recommend a place...')}
            required
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40 resize-none"
          />

          {/* Forest Selector */}
          <div className="relative">
            <TreePine className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select
              value={forestId}
              onChange={(e) => setForestId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 appearance-none"
            >
              <option value="">{t('community.selectForest', 'Link to a forest (optional)')}</option>
              {forests.map(f => (
                <option key={f.id} value={f.id}>{f.nameAr ? `${f.nameAr} / ${f.name}` : f.name}</option>
              ))}
            </select>
          </div>

          {/* Location Name */}
          <div className="relative">
            <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={t('community.locationName', 'Location name (e.g., Ajloun Trail #3)')}
              className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Tag className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder={t('community.addTag', 'Add tag...')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40"
                />
              </div>
              <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] font-data px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Submit */}
        <div className="p-5 border-t border-white/5 bg-black/20">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-ring click-scale"
          >
            <Send className="w-4 h-4" />
            {submitting ? t('community.submitting', 'Posting...') : t('community.submit', 'Publish Post')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Community Page ──────────────────────────────────────────────────────
export default function Community() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeType, setActiveType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags] = useState([]);
  const [trending, setTrending] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [forests, setForests] = useState([]);
  const configured = isSupabaseConfigured();

  // Load posts
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const result = await fetchPosts({
      page,
      type: activeType,
      tag: selectedTag,
      search: searchQuery,
      sort: sortBy,
    });
    setPosts(result.data);
    setTotalPosts(result.count);
    setLoading(false);
  }, [page, activeType, selectedTag, searchQuery, sortBy]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Load tags + trending
  useEffect(() => {
    fetchTags().then(setTags);
    fetchTrending().then(setTrending);
  }, []);

  // Load forests for the create modal
  useEffect(() => {
    fetch('/api/forests')
      .then(r => r.json())
      .then(data => setForests(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Subscribe to real-time new posts
  useEffect(() => {
    const sub = subscribeToNewPosts((newPost) => {
      setPosts(prev => [newPost, ...prev]);
      setTotalPosts(prev => prev + 1);
    });
    return () => sub.unsubscribe();
  }, []);

  const handlePostClick = (post) => {
    navigate(`/community/${post.id}`);
  };

  const totalPages = Math.ceil(totalPosts / 12);

  return (
    <div className="bg-[#050A07] min-h-screen text-white/80 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="scanline"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A140E]/80 backdrop-blur-xl border-b border-white/5 py-3 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" aria-label={t('community.backToDashboard', 'Back to Dashboard')} className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h1 className="text-lg font-bold tracking-tight">{t('community.title', 'Community')}</h1>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            aria-label={t('community.createNewPost', 'Create new post')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('community.newPost', 'New Post')}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row gap-6">

        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* Supabase Not Configured Banner */}
          {!configured && (
            <div className="mb-6 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-1">{t('community.setupRequired', 'Supabase Setup Required')}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {t('community.setupDesc', 'Add your Supabase URL and Anon Key to the .env file (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) and run the migration SQL in your Supabase SQL Editor.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={t('community.search', 'Search posts...')}
              className="w-full bg-white/5 border border-white/10 rounded-2xl ps-11 pe-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/30"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex overflow-x-auto gap-1 mb-4 pb-1 hide-scrollbar">
            {POST_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setActiveType(type.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-data uppercase tracking-widest whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 ${
                  activeType === type.id
                    ? 'bg-white/10 text-white border border-white/15'
                    : 'text-white/40 hover:text-white/60 border border-transparent cursor-pointer'
                }`}
              >
                <type.icon className="w-3 h-3" />
                {type.label}
              </button>
            ))}
          </div>

          {/* Sort + Info */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-data text-white/30 uppercase tracking-widest">
              {totalPosts} {t('community.postsCount', 'posts')}
            </span>
            <div className="flex items-center gap-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-data uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 ${
                    sortBy === opt.id ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50 cursor-pointer'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-xs text-white/30 font-data uppercase tracking-widest mt-4">{t('community.loading', 'Loading posts...')}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/20">
              <MessageSquare className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-bold mb-2">{t('community.noPosts', 'No posts yet')}</h3>
              <p className="text-xs text-white/15 mb-4">{t('community.beFirst', 'Be the first to share!')}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" /> {t('community.createFirst', 'Create First Post')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} onClick={handlePostClick} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-data transition-colors ${
                    page === p ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/30 hover:text-white/60 bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">

          {/* Trending Posts */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">{t('community.trending', 'Trending')}</h3>
            </div>
            <div className="p-3 space-y-1">
              {trending.length === 0 ? (
                <p className="text-xs text-white/20 text-center py-4">{t('community.noTrending', 'No trending posts')}</p>
              ) : trending.map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  aria-label={`View trending post: ${post.title}`}
                  className="w-full text-start p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors flex items-start gap-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/10"
                >
                  <span className="text-[10px] font-data font-bold text-amber-400/60 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate">{post.title}</p>
                    <span className="text-[9px] font-data text-white/30">{post.upvotes} ↑ · {post.comment_count} 💬</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">{t('community.popularTags', 'Popular Tags')}</h3>
            </div>
            <div className="p-4 flex flex-wrap gap-1.5">
              {tags.length === 0 ? (
                <p className="text-xs text-white/20 text-center w-full py-2">{t('community.noTags', 'No tags yet')}</p>
              ) : tags.slice(0, 12).map(tag => (
                <button
                  key={tag.id || tag.name}
                  onClick={() => { setSelectedTag(selectedTag === tag.name ? '' : tag.name); setPage(1); }}
                  aria-label={`Filter by tag: ${tag.name}`}
                  className={`text-[10px] font-data px-2.5 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                    selectedTag === tag.name
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                      : 'border-white/10 text-white/40 hover:text-white/60 bg-white/5 cursor-pointer'
                  }`}
                >
                  #{tag.name}
                  {tag.usage_count > 0 && <span className="text-white/20 ms-1">{tag.usage_count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <FileText className="w-4 h-4" />
              <span>{totalPosts} {t('community.totalPosts', 'total posts')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Tag className="w-4 h-4" />
              <span>{tags.length} {t('community.totalTags', 'tags in use')}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setTotalPosts(prev => prev + 1);
          }}
          forests={forests}
        />
      )}
    </div>
  );
}
