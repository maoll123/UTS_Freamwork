-- ==========================================================
-- UTS PEMROGRAMAN FRAMEWORK - SECURITY MODEL DATABASE
-- Target DBMS : MySQL / MariaDB (XAMPP phpMyAdmin)
-- ==========================================================

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS `uts_framework_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `uts_framework_db`;

-- Matikan foreign key check sementara untuk reset tabel jika ada
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `produk`;
DROP TABLE IF EXISTS `kategori`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- 1. Tabel: kategori
-- Struktur: id (Primary Key), nama_kategori (VARCHAR)
-- ----------------------------------------------------------
CREATE TABLE `kategori` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_kategori` VARCHAR(100) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Tabel: produk
-- Struktur: id (Primary Key), nama_produk, harga_produk, 
--           foto_produk, id_kategori (Foreign Key ke kategori.id)
-- ----------------------------------------------------------
CREATE TABLE `produk` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_produk` VARCHAR(150) NOT NULL,
    `harga_produk` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `foto_produk` VARCHAR(255) NULL,
    `id_kategori` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_produk_kategori` 
        FOREIGN KEY (`id_kategori`) 
        REFERENCES `kategori` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- SEED DATA AWAL (Sample Data)
-- ----------------------------------------------------------

-- Insert Kategori
INSERT INTO `kategori` (`id`, `nama_kategori`) VALUES
(1, 'Elektronik & Gadget'),
(2, 'Fashion Pria & Wanita'),
(3, 'Makanan & Minuman'),
(4, 'Peralatan Rumah Tangga'),
(5, 'Buku & Alat Tulis');

-- Insert Produk
INSERT INTO `produk` (`nama_produk`, `harga_produk`, `foto_produk`, `id_kategori`) VALUES
('Laptop Ultra Slim Pro 14 Inch', 12500000.00, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60', 1),
('Wireless Noise-Cancelling Headphones', 1850000.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', 1),
('Mechanical Keyboard RGB Tenkeyless', 799000.00, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60', 1),
('Jaket Parka Outdoor Anti Air', 389000.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60', 2),
('Sepatu Sneakers Casual Hitam Putih', 499000.00, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60', 2),
('Kopi Arabika Gayo Single Origin 250g', 85000.00, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60', 3),
('Matcha Ceremonial Grade Powder 100g', 120000.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60', 3),
('Smart Air Purifier HEPA Filter', 1450000.00, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&auto=format&fit=crop&q=60', 4);

-- Opsional: Database B (Jika dosen mensyaratkan 2 database fisik terpisah sesuai DB A dan DB B pada diagram)
CREATE DATABASE IF NOT EXISTS `uts_framework_db_b` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `uts_framework_db_b`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `produk`;
DROP TABLE IF EXISTS `kategori`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `kategori` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_kategori` VARCHAR(100) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `produk` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_produk` VARCHAR(150) NOT NULL,
    `harga_produk` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `foto_produk` VARCHAR(255) NULL,
    `id_kategori` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_produk_kategori_b` 
        FOREIGN KEY (`id_kategori`) 
        REFERENCES `kategori` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Replikasi data awal ke DB B
INSERT INTO `kategori` (`id`, `nama_kategori`) SELECT `id`, `nama_kategori` FROM `uts_framework_db`.`kategori`;
INSERT INTO `produk` (`nama_produk`, `harga_produk`, `foto_produk`, `id_kategori`) SELECT `nama_produk`, `harga_produk`, `foto_produk`, `id_kategori` FROM `uts_framework_db`.`produk`;
