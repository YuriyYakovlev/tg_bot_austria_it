-- tg_bot_aut_it.cached_messages definition

CREATE TABLE `cached_messages` (
  `userId` bigint NOT NULL,
  `chatId` bigint NOT NULL,
  `messageId` bigint NOT NULL,
  `msg_text` text,
  `msg_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `spam` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`messageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- tg_bot_aut_it.users definition

CREATE TABLE `users` (
  `userId` bigint NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `attempts` int DEFAULT '0',
  `last_attempt` timestamp NULL DEFAULT NULL,
  `captcha_id` varchar(255) DEFAULT NULL,
  `captcha_answer` varchar(255) DEFAULT NULL,
  `spam` tinyint(1) DEFAULT '0',
  `chatId` bigint DEFAULT NULL,
  `kicked` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `users_test`
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- tg_bot_aut_it.chat_settings definition

CREATE TABLE `chat_settings` (
  `chatId` bigint NOT NULL,
  `title` varchar(255),
  `language` varchar(10),
  PRIMARY KEY (`chatId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- scheduled events

CREATE EVENT delete_old_cached_messages
ON SCHEDULE EVERY 4 DAY
DO
  DELETE FROM cached_messages
  WHERE msg_date <= NOW() - INTERVAL 1 DAY;

CREATE EVENT delete_old_unverified_users
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM users
  WHERE verified = 0 AND created_at <= NOW() - INTERVAL 1 DAY;