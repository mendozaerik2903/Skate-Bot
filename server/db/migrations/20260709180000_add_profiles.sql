-- migrate:up
CREATE TABLE user_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  favorite_trick_name TEXT,
  favorite_spot_id UUID REFERENCES spots(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE user_profile;