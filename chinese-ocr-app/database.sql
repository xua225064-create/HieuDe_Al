CREATE DATABASE IF NOT EXISTS hieude_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hieude_ai_db;

-- Bảng lưu trữ người dùng
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu trữ hiệu đề (từ hieu_de_database.json)
CREATE TABLE IF NOT EXISTS marks (
    id INT PRIMARY KEY,
    chu_han VARCHAR(100),
    chu_han_4 VARCHAR(100),
    chu_han_6 VARCHAR(100),
    bien_the JSON,
    phien_am VARCHAR(255),
    ten_viet VARCHAR(255),
    hoang_de VARCHAR(100),
    trieu_dai VARCHAR(100),
    nam_bat_dau INT,
    nam_ket_thuc INT,
    ghi_chu TEXT,
    hien_thi_chinh VARCHAR(255),
    nien_hieu VARCHAR(100),
    nien_dai VARCHAR(100),
    hieu_de_en VARCHAR(255),
    mo_ta TEXT,
    hieu_de_vi VARCHAR(255),
    thu_phap TEXT,
    nghe_thuat TEXT
);

-- Bảng lưu trữ lịch sử phân tích của người dùng
CREATE TABLE IF NOT EXISTS scan_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50),
    image_path VARCHAR(255),
    ocr_text VARCHAR(255),
    match_result JSON,  -- Lưu kết quả OCR json
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng lưu trữ hóa đơn nạp tiền
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount_vnd INT NOT NULL,
    credits INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    sepay_tx_id INT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
