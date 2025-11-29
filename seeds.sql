-- Example seeds for categories and a demo user
INSERT INTO categories (name) VALUES ('Ambient') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Bass') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Experimental') ON DUPLICATE KEY UPDATE name=name;

-- Optional demo user placeholder
INSERT INTO users (username, display_name) VALUES ('demo', 'Demo User') ON DUPLICATE KEY UPDATE username=username;

-- Example tags
INSERT INTO tags (name) VALUES ('ambient') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO tags (name) VALUES ('drone') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO tags (name) VALUES ('experimental') ON DUPLICATE KEY UPDATE name=name;
