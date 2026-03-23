-- ============================================
-- ENGLISH STUDY APP - COMPLETE SCHEMA
-- Execute this in Supabase Dashboard → SQL Editor
-- ============================================

-- Extension required for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       text        NOT NULL UNIQUE,
  avatar_color   text        NOT NULL DEFAULT '#4F46E5',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $
BEGIN
  INSERT INTO profiles (id, username, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    '#4F46E5'
  );
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- WORDS Y WORD TRANSLATIONS
-- ============================================
CREATE TABLE words (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  word_en      text        NOT NULL,
  phonetic     text,
  owner_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_words_owner ON words(owner_id);

CREATE TABLE word_translations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id          uuid        NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  translation_es   text        NOT NULL,
  example_en       text,
  example_es       text,
  explanation      text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_word_translations_word ON word_translations(word_id);

-- ============================================
-- PHRASES
-- ============================================
CREATE TABLE phrases (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_en            text        NOT NULL,
  phrase_es            text        NOT NULL,
  owner_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_translation_id  uuid        REFERENCES word_translations(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phrases_owner       ON phrases(owner_id);
CREATE INDEX idx_phrases_translation ON phrases(word_translation_id);

-- ============================================
-- USER WORD PROGRESS
-- ============================================
CREATE TABLE user_word_progress (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id             uuid        NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  level               int         NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 5),
  correct_streak      int         NOT NULL DEFAULT 0 CHECK (correct_streak BETWEEN 0 AND 1),
  last_practiced_at   timestamptz,
  UNIQUE (user_id, word_id)
);

CREATE INDEX idx_uwp_user ON user_word_progress(user_id);

-- ============================================
-- GROUPS Y GROUP MEMBERS
-- ============================================
CREATE TABLE groups (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  invite_code         text        NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  words_per_session   int         NOT NULL DEFAULT 10 CHECK (words_per_session > 0),
  created_by          uuid        NOT NULL REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_user  ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);

-- ============================================
-- GROUP WORDS Y GROUP WORD TRANSLATIONS
-- ============================================
CREATE TABLE group_words (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  word_en       text        NOT NULL,
  phonetic      text,
  exported_by   uuid        NOT NULL REFERENCES profiles(id),
  exported_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_words_group ON group_words(group_id);

CREATE TABLE group_word_translations (
  id               uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  group_word_id    uuid  NOT NULL REFERENCES group_words(id) ON DELETE CASCADE,
  translation_es   text  NOT NULL,
  example_en       text,
  example_es       text,
  explanation      text
);

CREATE INDEX idx_gwt_word ON group_word_translations(group_word_id);

-- ============================================
-- GROUP PHRASES
-- ============================================
CREATE TABLE group_phrases (
  id                         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id                   uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  phrase_en                  text        NOT NULL,
  phrase_es                  text        NOT NULL,
  group_word_translation_id  uuid        REFERENCES group_word_translations(id) ON DELETE SET NULL,
  exported_by                uuid        NOT NULL REFERENCES profiles(id),
  exported_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_phrases_group ON group_phrases(group_id);

-- ============================================
-- GROUP WORD PROGRESS
-- ============================================
CREATE TABLE group_word_progress (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id            uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  group_word_id       uuid        NOT NULL REFERENCES group_words(id) ON DELETE CASCADE,
  level               int         NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 5),
  correct_streak      int         NOT NULL DEFAULT 0 CHECK (correct_streak BETWEEN 0 AND 1),
  last_practiced_at   timestamptz,
  UNIQUE (user_id, group_id, group_word_id)
);

CREATE INDEX idx_gwp_user  ON group_word_progress(user_id);
CREATE INDEX idx_gwp_group ON group_word_progress(group_id);

-- ============================================
-- GROUP SESSIONS
-- ============================================
CREATE TABLE group_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by    uuid        NOT NULL REFERENCES profiles(id),
  mode          text        NOT NULL CHECK (mode IN ('remote', 'presential')),
  conductor_id  uuid        REFERENCES profiles(id),
  status        text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  word_count    int         NOT NULL,
  started_at    timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz,
  CONSTRAINT presential_requires_conductor
    CHECK (mode != 'presential' OR conductor_id IS NOT NULL)
);

CREATE INDEX idx_sessions_group  ON group_sessions(group_id);
CREATE INDEX idx_sessions_status ON group_sessions(group_id, status);

CREATE UNIQUE INDEX idx_one_active_session
  ON group_sessions(group_id)
  WHERE status = 'active';

-- ============================================
-- SESSION ATTENDEES
-- ============================================
CREATE TABLE session_attendees (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid  NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
  user_id      uuid  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  turn_order   int   NOT NULL,
  UNIQUE (session_id, user_id)
);

-- ============================================
-- SESSION TURNS
-- ============================================
CREATE TABLE session_turns (
  id               uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid  NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
  group_word_id    uuid  NOT NULL REFERENCES group_words(id),
  turn_order       int   NOT NULL,
  elector_id       uuid  REFERENCES profiles(id),
  discoverer_id    uuid  REFERENCES profiles(id),
  constructor_id   uuid  REFERENCES profiles(id),
  current_step     int   NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
  status           text  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  UNIQUE (session_id, turn_order)
);

CREATE INDEX idx_turns_session ON session_turns(session_id);

-- ============================================
-- SESSION ATTEMPTS
-- ============================================
CREATE TABLE session_attempts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id       uuid        NOT NULL REFERENCES session_turns(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES profiles(id),
  step          int         NOT NULL CHECK (step IN (1, 2)),
  answer        text        NOT NULL,
  is_correct    boolean     NOT NULL,
  answered_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_turn ON session_attempts(turn_id);

-- ============================================
-- SESSION SUBMISSIONS Y REVIEWS
-- ============================================
CREATE TABLE session_submissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id          uuid        NOT NULL REFERENCES session_turns(id) ON DELETE CASCADE,
  constructor_id   uuid        NOT NULL REFERENCES profiles(id),
  phrase_en        text        NOT NULL,
  approved         boolean,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE session_reviews (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid        NOT NULL REFERENCES session_submissions(id) ON DELETE CASCADE,
  reviewer_id     uuid        NOT NULL REFERENCES profiles(id),
  approved        boolean     NOT NULL,
  observation     text,
  reviewed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, reviewer_id)
);

-- ============================================
-- SESSION TURN CONFIRMATIONS
-- ============================================
CREATE TABLE session_turn_confirmations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id        uuid        NOT NULL REFERENCES session_turns(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES profiles(id),
  confirmed_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turn_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY - ENABLE RLS
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
-- ROW LEVEL SECURITY - POLICIES
-- ============================================

-- PROFILES
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- WORDS Y WORD TRANSLATIONS
CREATE POLICY words_all ON words FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY wt_all ON word_translations FOR ALL USING (EXISTS (
  SELECT 1 FROM words WHERE words.id = word_translations.word_id AND words.owner_id = auth.uid()
));

-- PHRASES
CREATE POLICY phrases_all ON phrases FOR ALL USING (auth.uid() = owner_id);

-- USER WORD PROGRESS
CREATE POLICY uwp_all ON user_word_progress FOR ALL USING (auth.uid() = user_id);

-- GROUPS Y GROUP MEMBERS
CREATE OR REPLACE FUNCTION is_group_member(gid uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY groups_select ON groups FOR SELECT USING (is_group_member(id));
CREATE POLICY groups_insert ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY groups_update ON groups FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY gm_select ON group_members FOR SELECT USING (is_group_member(group_id));
CREATE POLICY gm_insert ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY gm_delete ON group_members FOR DELETE USING (auth.uid() = user_id);

-- GROUP WORDS, TRANSLATIONS Y PHRASES
CREATE POLICY gw_select ON group_words FOR SELECT USING (is_group_member(group_id));
CREATE POLICY gw_insert ON group_words FOR INSERT WITH CHECK (is_group_member(group_id));

CREATE POLICY gwt_select ON group_word_translations FOR SELECT USING (EXISTS (
  SELECT 1 FROM group_words WHERE group_words.id = group_word_translations.group_word_id AND is_group_member(group_words.group_id)
));

CREATE POLICY gwt_insert ON group_word_translations FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM group_words WHERE group_words.id = group_word_translations.group_word_id AND is_group_member(group_words.group_id)
));

CREATE POLICY gp_select ON group_phrases FOR SELECT USING (is_group_member(group_id));
CREATE POLICY gp_insert ON group_phrases FOR INSERT WITH CHECK (is_group_member(group_id));

-- GROUP WORD PROGRESS
CREATE POLICY gwp_select ON group_word_progress FOR SELECT USING (is_group_member(group_id));
CREATE POLICY gwp_insert ON group_word_progress FOR INSERT WITH CHECK (auth.uid() = user_id AND is_group_member(group_id));
CREATE POLICY gwp_update ON group_word_progress FOR UPDATE USING (auth.uid() = user_id);

-- SESSIONS Y TABLAS RELACIONADAS
CREATE POLICY gs_select ON group_sessions FOR SELECT USING (is_group_member(group_id));
CREATE POLICY gs_insert ON group_sessions FOR INSERT WITH CHECK (is_group_member(group_id));
CREATE POLICY gs_update ON group_sessions FOR UPDATE USING (is_group_member(group_id));

CREATE OR REPLACE FUNCTION is_session_member(sid uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_sessions gs
    JOIN group_members gm ON gm.group_id = gs.group_id
    WHERE gs.id = sid AND gm.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY sa_all ON session_attendees FOR ALL USING (is_session_member(session_id));
CREATE POLICY st_all ON session_turns FOR ALL USING (is_session_member(session_id));

CREATE POLICY sat_all ON session_attempts FOR ALL USING (EXISTS (
  SELECT 1 FROM session_turns WHERE id = turn_id AND is_session_member(session_id)
));

CREATE POLICY ss_all ON session_submissions FOR ALL USING (EXISTS (
  SELECT 1 FROM session_turns WHERE id = turn_id AND is_session_member(session_id)
));

CREATE POLICY sr_all ON session_reviews FOR ALL USING (EXISTS (
  SELECT 1 FROM session_submissions ss
  JOIN session_turns st ON st.id = ss.turn_id
  WHERE ss.id = submission_id AND is_session_member(st.session_id)
));

CREATE POLICY stc_all ON session_turn_confirmations FOR ALL USING (EXISTS (
  SELECT 1 FROM session_turns WHERE id = turn_id AND is_session_member(session_id)
));
