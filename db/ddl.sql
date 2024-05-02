-- tg_bot_aut_it.cached_messages definition

CREATE TABLE `cached_messages` (
  `userId` bigint NOT NULL,
  `chatId` bigint NOT NULL,
  `messageId` bigint NOT NULL,
  `messageText` text,
  `messageDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_spam` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`messageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- tg_bot_aut_it.users definition

CREATE TABLE `users` (
  `userId` bigint NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `username` varchar(255) DEFAULT NULL,
  `attempts` int DEFAULT '0',
  `last_attempt` timestamp NULL DEFAULT NULL,
  `current_captcha_id` varchar(255) DEFAULT NULL,
  `current_captcha_answer` varchar(255) DEFAULT NULL,
  `is_spammer` tinyint(1) DEFAULT '0',
  `chatId` bigint DEFAULT NULL,
  `kicked` tinyint(1) DEFAULT '0',
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;