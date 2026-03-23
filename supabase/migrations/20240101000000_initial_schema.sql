-- English Study App - Initial Schema
-- Version: 1.0

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PROFILES
CREATE TABLE profiles (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       text        NOT NULL UNIQUE,
  avatar_color   text        NOT NULL DEFAULT '#4F46E5',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- WORDS
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

-- PHRASES
CREATE TABLE phrases (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_en            text        NOT NULL,
  phrase_es            text        NOT NULL,
  owner_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_translation_id  uuid        REFERENCES word_translations(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phrases_owner ON phrases(owner_id);
CREATE INDEX idx_phrases_translation ON phrases(word_translation_id);

-- USER WORD PROGRESS
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

-- GROUPS
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

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);

-- GROUP WORDS
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

-- GROUP PHRASES
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

-- GROUP WORD PROGRESS
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

CREATE INDEX idx_gwp_user ON group_word_progress(user_id);
CREATE INDEX idx_gwp_group ON group_word_progress(group_id);

-- GROUP SESSIONS
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

CREATE INDEX idx_sessions_group ON group_sessions(group_id);
CREATE INDEX idx_sessions_status ON group_sessions(group_id, status);

CREATE UNIQUE INDEX idx_one_active_session
  ON group_sessions(group_id)
  WHERE status = 'active';

-- SESSION ATTENDEES
CREATE TABLE session_attendees (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid  NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
  user_id      uuid  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  turn_order   int   NOT NULL,
  UNIQUE (session_id, user_id)
);

-- SESSION TURNS
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

-- SESSION ATTEMPTS
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

-- SESSION SUBMISSIONS
CREATE TABLE session_submissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id          uuid        NOT NULL REFERENCES session_turns(id) ON DELETE CASCADE,
  constructor_id   uuid        NOT NULL REFERENCES profiles(id),
  phrase_en        text        NOT NULL,
  approved         boolean,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- SESSION REVIEWS
CREATE TABLE session_reviews (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid        NOT NULL REFERENCES session_submissions(id) ON DELETE CASCADE,
  reviewer_id     uuid        NOT NULL REFERENCES profiles(id),
  approved        boolean     NOT NULL,
  observation     text,
  reviewed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, reviewer_id)
);

-- SESSION TURN CONFIRMATIONS
CREATE TABLE session_turn_confirmations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id        uuid        NOT NULL REFERENCES session_turns(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES profiles(id),
  confirmed_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turn_id, user_id)
);
