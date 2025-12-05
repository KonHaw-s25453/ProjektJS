-- Example seeds for categories and a demo user
INSERT INTO categories (name) VALUES ('Ambient') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Bass') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Experimental') ON DUPLICATE KEY UPDATE name=name;

-- Optional demo user placeholder
-- Create owner, admin, and test user accounts (passwords are bcrypt hashes)
INSERT INTO users (username, display_name, password_hash, role) VALUES
('Własc', 'Właściciel', '$2a$10$D6Lv0plfMHjZ7f78K2J2mucZsj/BGcZZdfIOVZZrzRnyqm/ZBmbEe', 3)
ON DUPLICATE KEY UPDATE username = username, password_hash = VALUES(password_hash), role = VALUES(role);
INSERT INTO users (username, display_name, password_hash, role) VALUES
('Adm', 'Test Admin', '$2a$10$KFG5/TKhU6VMj7T6MJ6k3.tq0grqQn5ZI8LkPwLCKiN7sFVPrX5.6', 2)
ON DUPLICATE KEY UPDATE username = username, password_hash = VALUES(password_hash), role = VALUES(role);
INSERT INTO users (username, display_name, password_hash, role) VALUES
('Usr', 'Test User', '$2a$10$47RQNjOHf4lQPxkYhcwB3OrwlHu5crK7/WoGdLSRvN9/lqDByKjNa', 1)
ON DUPLICATE KEY UPDATE username = username, password_hash = VALUES(password_hash), role = VALUES(role);
INSERT INTO users (username, display_name, password_hash, role) VALUES
('tagger', 'Tag Test', '$2a$10$47RQNjOHf4lQPxkYhcwB3OrwlHu5crK7/WoGdLSRvN9/lqDByKjNa', 1)
ON DUPLICATE KEY UPDATE username = username, password_hash = VALUES(password_hash), role = VALUES(role);
INSERT INTO users (username, display_name, password_hash, role) VALUES
('tester', 'Test Upload', '$2a$10$47RQNjOHf4lQPxkYhcwB3OrwlHu5crK7/WoGdLSRvN9/lqDByKjNa', 1)
ON DUPLICATE KEY UPDATE username = username, password_hash = VALUES(password_hash), role = VALUES(role);

-- Example tags
INSERT INTO tags (name) VALUES ('ambient') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO tags (name) VALUES ('drone') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO tags (name) VALUES ('experimental') ON DUPLICATE KEY UPDATE name=name;
