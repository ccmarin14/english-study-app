-- English Study App - Row Level Security Policies
-- Version: 1.0

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE words                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_translations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrases                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress             ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_words                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_word_translations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_phrases                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_word_progress            ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_turns                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attempts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_submissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_turn_confirmations    ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- WORDS y WORD TRANSLATIONS
-- ============================================
CREATE POLICY words_all ON words FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY wt_all ON word_translations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM words
    WHERE words.id = word_translations.word_id
    AND words.owner_id = auth.uid()
  ));

-- ============================================
-- PHRASES
-- ============================================
CREATE POLICY phrases_all ON phrases FOR ALL
  USING (auth.uid() = owner_id);

-- ============================================
-- USER WORD PROGRESS
-- ============================================
CREATE POLICY uwp_all ON user_word_progress FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- GROUPS y GROUP MEMBERS
-- ============================================
CREATE OR REPLACE FUNCTION is_group_member(gid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY groups_select ON groups FOR SELECT
  USING (is_group_member(id));

CREATE POLICY groups_insert ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY groups_update ON groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY gm_select ON group_members FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY gm_insert ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY gm_delete ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GROUP WORDS, TRANSLATIONS y PHRASES
-- ============================================
CREATE POLICY gw_select ON group_words FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY gw_insert ON group_words FOR INSERT
  WITH CHECK (is_group_member(group_id));

CREATE POLICY gwt_select ON group_word_translations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_words
    WHERE group_words.id = group_word_translations.group_word_id
    AND is_group_member(group_words.group_id)
  ));

CREATE POLICY gwt_insert ON group_word_translations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM group_words
    WHERE group_words.id = group_word_translations.group_word_id
    AND is_group_member(group_words.group_id)
  ));

CREATE POLICY gp_select ON group_phrases FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY gp_insert ON group_phrases FOR INSERT
  WITH CHECK (is_group_member(group_id));

-- ============================================
-- GROUP WORD PROGRESS
-- ============================================
CREATE POLICY gwp_select ON group_word_progress FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY gwp_insert ON group_word_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_group_member(group_id));

CREATE POLICY gwp_update ON group_word_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- SESSIONS y TABLAS RELACIONADAS
-- ============================================
CREATE POLICY gs_select ON group_sessions FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY gs_insert ON group_sessions FOR INSERT
  WITH CHECK (is_group_member(group_id));

CREATE POLICY gs_update ON group_sessions FOR UPDATE
  USING (is_group_member(group_id));

CREATE OR REPLACE FUNCTION is_session_member(sid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_sessions gs
    JOIN group_members gm ON gm.group_id = gs.group_id
    WHERE gs.id = sid AND gm.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY sa_all ON session_attendees FOR ALL
  USING (is_session_member(session_id));

CREATE POLICY st_all ON session_turns FOR ALL
  USING (is_session_member(session_id));

CREATE POLICY sat_all ON session_attempts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM session_turns
    WHERE id = turn_id AND is_session_member(session_id)
  ));

CREATE POLICY ss_all ON session_submissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM session_turns
    WHERE id = turn_id AND is_session_member(session_id)
  ));

CREATE POLICY sr_all ON session_reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM session_submissions ss
    JOIN session_turns st ON st.id = ss.turn_id
    WHERE ss.id = submission_id AND is_session_member(st.session_id)
  ));

CREATE POLICY stc_all ON session_turn_confirmations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM session_turns
    WHERE id = turn_id AND is_session_member(session_id)
  ));
