CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  open_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kream_id VARCHAR(255) NOT NULL UNIQUE,
  name_en VARCHAR(255) NOT NULL,
  name_ko VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  thumbnail_url TEXT,
  product_url TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS rankings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  rank_position INT NOT NULL,
  price INT NOT NULL,
  interest_count INT DEFAULT 0,
  trade_volume INT DEFAULT 0,
  scraped_at BIGINT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  price INT NOT NULL,
  interest_count INT DEFAULT 0,
  trade_volume INT DEFAULT 0,
  snapshot_date DATE NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_date (product_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS user_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  product_url TEXT NOT NULL,
  alert_type ENUM('percent_change', 'price_below', 'price_above') DEFAULT 'percent_change',
  threshold_percent INT,
  target_price INT,
  last_notified_price INT,
  last_notified_at BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scraping_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scrape_type ENUM('mock', 'realtime', 'popular') NOT NULL,
  products_count INT NOT NULL,
  status ENUM('success', 'failed') NOT NULL,
  error_message TEXT,
  scraped_at BIGINT NOT NULL
);
