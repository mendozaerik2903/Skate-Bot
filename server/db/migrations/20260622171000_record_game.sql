-- migrate:up
ALTER TABLE games ADD COLUMN bot_persona TEXT;
ALTER TABLE games ADD COLUMN score_word TEXT NOT NULL DEFAULT 'SKATE';
ALTER TABLE game_turns ADD COLUMN is_user_turn BOOLEAN NOT NULL;

-- migrate:down
ALTER TABLE game_turns DROP COLUMN is_user_turn;
ALTER TABLE games DROP COLUMN score_word;
ALTER TABLE games DROP COLUMN bot_persona;