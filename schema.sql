-- MySQL schema for VCV patch archive (minimal)

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  display_name VARCHAR(255),
  role TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS patches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255),
  category_id INT,
  file_path VARCHAR(1024) NOT NULL,
  description TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plugin VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_module (plugin, model)
);

CREATE TABLE IF NOT EXISTS patch_modules (
  patch_id INT NOT NULL,
  module_id INT NOT NULL,
  PRIMARY KEY (patch_id, module_id),
  FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Tags and mapping table for patch tagging
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS patch_tags (
  patch_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (patch_id, tag_id),
  FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
