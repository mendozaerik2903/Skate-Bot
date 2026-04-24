-- migrate:up
CREATE TABLE skate_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_games INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE trick_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trick_name TEXT NOT NULL,
    landed_count INTEGER NOT NULL DEFAULT 0
);
-- migrate:down
DROP TABLE IF EXISTS trick_stats;
DROP TABLE IF EXISTS skate_stats;