-- ════════════════════════════════════════════════════════════════════════════
-- ForestGuard AI — Supabase Community Tables Migration
-- Run this SQL in your Supabase SQL Editor to create the community tables.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Community Posts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  author_avatar TEXT,
  post_type TEXT NOT NULL DEFAULT 'discussion'
    CHECK (post_type IN ('discussion', 'question', 'recommendation', 'trip_report', 'photo')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  forest_id TEXT,
  tags TEXT[] DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  image_urls TEXT[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Community Comments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Community Votes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  voter_identifier TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_type, target_id, voter_identifier)
);

-- ── Community Tags ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  name_ar TEXT,
  category TEXT DEFAULT 'topic'
    CHECK (category IN ('activity', 'location', 'topic')),
  usage_count INTEGER DEFAULT 0
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_forest ON community_posts(forest_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON community_posts(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON community_votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON community_tags(usage_count DESC);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Enable RLS but allow public reads and inserts for the community features.

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_tags ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON community_tags FOR SELECT USING (true);

-- Public insert access (anonymous community)
CREATE POLICY "Public insert posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert comments" ON community_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert votes" ON community_votes FOR INSERT WITH CHECK (true);

-- Public update for vote counts
CREATE POLICY "Public update post votes" ON community_posts FOR UPDATE USING (true);
CREATE POLICY "Public update comment votes" ON community_comments FOR UPDATE USING (true);
CREATE POLICY "Public update tag usage" ON community_tags FOR UPDATE USING (true);

-- ── Seed Popular Tags ───────────────────────────────────────────────────────
INSERT INTO community_tags (name, name_ar, category) VALUES
  ('hiking', 'المشي لمسافات طويلة', 'activity'),
  ('camping', 'تخييم', 'activity'),
  ('photography', 'تصوير', 'activity'),
  ('birdwatching', 'مراقبة الطيور', 'activity'),
  ('trail-running', 'الجري على المسارات', 'activity'),
  ('rock-climbing', 'تسلق الصخور', 'activity'),
  ('wildlife', 'الحياة البرية', 'topic'),
  ('conservation', 'حماية البيئة', 'topic'),
  ('fire-safety', 'السلامة من الحرائق', 'topic'),
  ('flora', 'النباتات', 'topic'),
  ('water-sources', 'مصادر المياه', 'topic'),
  ('seasonal-tips', 'نصائح موسمية', 'topic'),
  ('family-friendly', 'مناسب للعائلات', 'topic'),
  ('beginner-trail', 'مسار للمبتدئين', 'topic'),
  ('expert-trail', 'مسار للخبراء', 'topic'),
  ('night-hike', 'رحلة ليلية', 'activity'),
  ('gear-review', 'مراجعة المعدات', 'topic'),
  ('eco-tourism', 'السياحة البيئية', 'topic')
ON CONFLICT (name) DO NOTHING;

-- ── Auto-update updated_at trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
