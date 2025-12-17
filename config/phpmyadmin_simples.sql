-- Execute APENAS as tabelas (sem INSERT)
-- Depois use o ficheiro criar_admin.php para criar o utilizador

-- Remover tabelas existentes
DROP TABLE IF EXISTS `administracoes`;
DROP TABLE IF EXISTS `terapeutica_horarios`;
DROP TABLE IF EXISTS `terapeuticas`;
DROP TABLE IF EXISTS `stocks`;
DROP TABLE IF EXISTS `medicamentos`;
DROP TABLE IF EXISTS `utentes`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `lares`;

-- Criar todas as tabelas
CREATE TABLE `lares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `morada` text NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `capacidade` int(11) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin_geral','admin_lar','tecnico') NOT NULL,
  `lar_id` int(11) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `lar_id` (`lar_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`lar_id`) REFERENCES `lares` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `utentes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `data_nascimento` date NOT NULL,
  `numero_utente` varchar(50) NOT NULL,
  `lar_id` int(11) NOT NULL,
  `contacto_emergencia_nome` varchar(255) DEFAULT NULL,
  `contacto_emergencia_telefone` varchar(20) DEFAULT NULL,
  `contacto_emergencia_relacao` varchar(100) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_utente` (`numero_utente`),
  KEY `lar_id` (`lar_id`),
  CONSTRAINT `utentes_ibfk_1` FOREIGN KEY (`lar_id`) REFERENCES `lares` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `medicamentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `principio_ativo` varchar(255) NOT NULL,
  `marca` varchar(255) NOT NULL,
  `dose` varchar(100) NOT NULL,
  `toma` enum('oral','injetavel','topica','sublingual','inalacao','retal','ocular','auricular','nasal') NOT NULL,
  `minimo` int(11) NOT NULL DEFAULT 0,
  `validade` date DEFAULT NULL,
  `lar_id` int(11) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `lar_id` (`lar_id`),
  CONSTRAINT `medicamentos_ibfk_1` FOREIGN KEY (`lar_id`) REFERENCES `lares` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `terapeuticas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `utente_id` int(11) NOT NULL,
  `medicamento_id` int(11) NOT NULL,
  `tipo` enum('continua','temporaria','sos') NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_por` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `utente_id` (`utente_id`),
  KEY `medicamento_id` (`medicamento_id`),
  KEY `criado_por` (`criado_por`),
  CONSTRAINT `terapeuticas_ibfk_1` FOREIGN KEY (`utente_id`) REFERENCES `utentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `terapeuticas_ibfk_2` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `terapeuticas_ibfk_3` FOREIGN KEY (`criado_por`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `terapeutica_horarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `terapeutica_id` int(11) NOT NULL,
  `hora` time NOT NULL,
  `dias_semana` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `terapeutica_id` (`terapeutica_id`),
  CONSTRAINT `terapeutica_horarios_ibfk_1` FOREIGN KEY (`terapeutica_id`) REFERENCES `terapeuticas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `medicamento_id` int(11) NOT NULL,
  `utente_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 0,
  `quantidade_minima` int(11) DEFAULT 10,
  `lote` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stock` (`medicamento_id`,`utente_id`),
  KEY `medicamento_id` (`medicamento_id`),
  KEY `utente_id` (`utente_id`),
  CONSTRAINT `stocks_ibfk_1` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stocks_ibfk_2` FOREIGN KEY (`utente_id`) REFERENCES `utentes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `administracoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `terapeutica_id` int(11) NOT NULL,
  `data_hora` datetime NOT NULL,
  `administrada` tinyint(1) NOT NULL,
  `motivo_nao_administracao` text DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `administrado_por` int(11) NOT NULL,
  `validada` tinyint(1) DEFAULT 0,
  `validada_por` int(11) DEFAULT NULL,
  `data_validacao` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `terapeutica_id` (`terapeutica_id`),
  KEY `administrado_por` (`administrado_por`),
  KEY `validada_por` (`validada_por`),
  CONSTRAINT `administracoes_ibfk_1` FOREIGN KEY (`terapeutica_id`) REFERENCES `terapeuticas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `administracoes_ibfk_2` FOREIGN KEY (`administrado_por`) REFERENCES `users` (`id`),
  CONSTRAINT `administracoes_ibfk_3` FOREIGN KEY (`validada_por`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelas criadas! Agora execute: http://localhost:8000/criar_admin.php
