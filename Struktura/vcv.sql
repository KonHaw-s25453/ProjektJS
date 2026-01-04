-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 06, 2025 at 09:25 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vcv`
--
DROP DATABASE IF EXISTS `vcv`;
CREATE DATABASE IF NOT EXISTS `vcv` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `vcv`;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `categories`:
--

--
-- Dumping data for table `categories`
--

INSERT DELAYED IGNORE INTO `categories` (`id`, `name`) VALUES
(1, 'Ambient'),
(2, 'Bass'),
(3, 'Experimental');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `modules`
--

DROP TABLE IF EXISTS `modules`;
CREATE TABLE IF NOT EXISTS `modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plugin` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_module` (`plugin`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `modules`:
--

--
-- Dumping data for table `modules`
--

INSERT DELAYED IGNORE INTO `modules` (`id`, `plugin`, `model`) VALUES
(1, 'T', 'M');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `patches`
--

DROP TABLE IF EXISTS `patches`;
CREATE TABLE IF NOT EXISTS `patches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `file_path` varchar(1024) NOT NULL,
  `description` text DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `patches`:
--   `category_id`
--       `categories` -> `id`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `patch_modules`
--

DROP TABLE IF EXISTS `patch_modules`;
CREATE TABLE IF NOT EXISTS `patch_modules` (
  `patch_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  PRIMARY KEY (`patch_id`,`module_id`),
  KEY `module_id` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `patch_modules`:
--   `patch_id`
--       `patches` -> `id`
--   `module_id`
--       `modules` -> `id`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `patch_tags`
--

DROP TABLE IF EXISTS `patch_tags`;
CREATE TABLE IF NOT EXISTS `patch_tags` (
  `patch_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  PRIMARY KEY (`patch_id`,`tag_id`),
  KEY `tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `patch_tags`:
--   `patch_id`
--       `patches` -> `id`
--   `tag_id`
--       `tags` -> `id`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `tags`
--

DROP TABLE IF EXISTS `tags`;
CREATE TABLE IF NOT EXISTS `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `tags`:
--

--
-- Dumping data for table `tags`
--

INSERT DELAYED IGNORE INTO `tags` (`id`, `name`) VALUES
(1, 'ambient'),
(2, 'drone'),
(3, 'experimental');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `notes`
--

DROP TABLE IF EXISTS `notes`;
CREATE TABLE IF NOT EXISTS `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patch_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patch_id` (`patch_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `notes`:
--   `patch_id`
--       `patches` -> `id`
--   `user_id`
--       `users` -> `id`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `password_hash` varchar(255) DEFAULT NULL,
  `role` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=289 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELACJE DLA TABELI `users`:
--

--
-- Constraints for dumped tables
--

--
-- Constraints for table `patches`
--
ALTER TABLE `patches`
  ADD CONSTRAINT `patches_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patch_modules`
--
ALTER TABLE `patch_modules`
  ADD CONSTRAINT `patch_modules_ibfk_1` FOREIGN KEY (`patch_id`) REFERENCES `patches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patch_modules_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patch_tags`
--
ALTER TABLE `patch_tags`
  ADD CONSTRAINT `patch_tags_ibfk_1` FOREIGN KEY (`patch_id`) REFERENCES `patches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patch_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`patch_id`) REFERENCES `patches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
