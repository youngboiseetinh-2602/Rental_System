-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: rental_room_system
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contract`
--

DROP TABLE IF EXISTS `contract`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL,
  `endDate` date DEFAULT NULL,
  `startDate` date NOT NULL,
  `status` enum('PENDING','APPROVED','CANCELLED','TERMINATED','EXPIRED') NOT NULL,
  `roomId` bigint NOT NULL,
  `tenantId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtp9g9kr3vsgqp2sobfu3n3xym` (`roomId`),
  KEY `FKor6gdifay0p52t4y49kpkf2yy` (`tenantId`),
  CONSTRAINT `FKor6gdifay0p52t4y49kpkf2yy` FOREIGN KEY (`tenantId`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtp9g9kr3vsgqp2sobfu3n3xym` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract`
--

LOCK TABLES `contract` WRITE;
/*!40000 ALTER TABLE `contract` DISABLE KEYS */;
/*!40000 ALTER TABLE `contract` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation`
--

DROP TABLE IF EXISTS `conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','BLOCKED') NOT NULL,
  `blockedById` bigint DEFAULT NULL,
  `participantOneId` bigint NOT NULL,
  `participantTwoId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conversation_participant_pair` (`participantOneId`,`participantTwoId`),
  KEY `FKlkrrcnmq32bkvjs5u0dx08mw0` (`blockedById`),
  KEY `FKlbqx55koeeu005fp35qkiiokb` (`participantTwoId`),
  CONSTRAINT `FK8spftd3n1fx6h374rudp4lduy` FOREIGN KEY (`participantOneId`) REFERENCES `users` (`id`),
  CONSTRAINT `FKlbqx55koeeu005fp35qkiiokb` FOREIGN KEY (`participantTwoId`) REFERENCES `users` (`id`),
  CONSTRAINT `FKlkrrcnmq32bkvjs5u0dx08mw0` FOREIGN KEY (`blockedById`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation`
--

LOCK TABLES `conversation` WRITE;
/*!40000 ALTER TABLE `conversation` DISABLE KEYS */;
INSERT INTO `conversation` VALUES (1,NULL,'ACTIVE',NULL,1,2),(2,NULL,'ACTIVE',NULL,1,3),(3,NULL,'ACTIVE',NULL,2,3);
/*!40000 ALTER TABLE `conversation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facilities`
--

DROP TABLE IF EXISTS `facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facilities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `facilityName` varchar(100) NOT NULL,
  `quantity` int NOT NULL,
  `roomTypeId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqn4m472ax63hwsrc0ju4m066m` (`roomTypeId`),
  CONSTRAINT `FKqn4m472ax63hwsrc0ju4m066m` FOREIGN KEY (`roomTypeId`) REFERENCES `room_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facilities`
--

LOCK TABLES `facilities` WRITE;
/*!40000 ALTER TABLE `facilities` DISABLE KEYS */;
INSERT INTO `facilities` VALUES (1,'điều hòa',1,1),(2,'tủ nhỏ',1,1),(3,'giường',1,1);
/*!40000 ALTER TABLE `facilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `image`
--

DROP TABLE IF EXISTS `image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `image` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `imageUrl` varchar(255) NOT NULL,
  `rentalPropertyId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdr1v1vdx5ugx6uovxrc3nxsei` (`rentalPropertyId`),
  CONSTRAINT `FKdr1v1vdx5ugx6uovxrc3nxsei` FOREIGN KEY (`rentalPropertyId`) REFERENCES `rental_property` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image`
--

LOCK TABLES `image` WRITE;
/*!40000 ALTER TABLE `image` DISABLE KEYS */;
/*!40000 ALTER TABLE `image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `note` varchar(255) DEFAULT NULL,
  `sentAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('SENT','READ') NOT NULL,
  `conversationId` bigint NOT NULL,
  `senderId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_message_conversation_hidden_id` (`conversationId`,`hidden`,`id`),
  KEY `FK5dpcb9p23cqcvqra1n5qtcb4s` (`senderId`),
  CONSTRAINT `FK1g2sehpsg9rquyu63fi157fcp` FOREIGN KEY (`conversationId`) REFERENCES `conversation` (`id`),
  CONSTRAINT `FK5dpcb9p23cqcvqra1n5qtcb4s` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES (1,'dmm',0,NULL,'2026-08-16 23:18:27','READ',1,2),(2,'fuck',0,NULL,'2026-08-16 23:18:42','READ',1,1),(3,'kjijw',0,NULL,'2026-08-16 23:19:05','READ',1,2),(4,'lolo',0,NULL,'2026-08-16 23:22:56','SENT',2,1),(5,'sss',0,NULL,'2026-08-16 23:23:01','READ',1,1),(6,'sa',0,NULL,'2026-08-16 23:23:22','SENT',3,2),(7,'fuck',0,NULL,'2026-08-16 23:27:53','READ',1,2),(8,'dsd',0,NULL,'2026-08-16 23:28:00','SENT',3,2),(9,'sdsc',0,NULL,'2026-08-16 23:28:44','READ',1,2);
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `readAt` datetime(6) DEFAULT NULL,
  `sentAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('READ','UNREAD') NOT NULL,
  `title` varchar(150) NOT NULL,
  `receiverId` bigint NOT NULL,
  `senderId` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_receiver_status_sent_at` (`receiverId`,`status`,`sentAt`),
  KEY `idx_notification_sender_sent_at` (`senderId`,`sentAt`),
  KEY `idx_notification_receiver_id` (`receiverId`,`id`),
  CONSTRAINT `FK21bwrttfconkgciki2e5fo58t` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`),
  CONSTRAINT `FKn1aeokpi44n0o3w7beahsjwdh` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rental_property`
--

DROP TABLE IF EXISTS `rental_property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rental_property` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `city` varchar(100) DEFAULT NULL,
  `description` text,
  `detailedAddress` varchar(255) DEFAULT NULL,
  `houseNumber` varchar(50) DEFAULT NULL,
  `houseRules` text,
  `name` varchar(150) NOT NULL,
  `street` varchar(100) DEFAULT NULL,
  `ward` varchar(100) DEFAULT NULL,
  `ownerId` bigint NOT NULL,
  `rentalTypeId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKi7sf2yu9a185r4t9s1wv139jx` (`ownerId`),
  KEY `FKryxxl8ogbuqc5lgujbfgewn4` (`rentalTypeId`),
  CONSTRAINT `FKi7sf2yu9a185r4t9s1wv139jx` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`),
  CONSTRAINT `FKryxxl8ogbuqc5lgujbfgewn4` FOREIGN KEY (`rentalTypeId`) REFERENCES `rental_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rental_property`
--

LOCK TABLES `rental_property` WRITE;
/*!40000 ALTER TABLE `rental_property` DISABLE KEYS */;
INSERT INTO `rental_property` VALUES (1,'hà nội','gần PTIT , KMA , ...','','số 7 , ngõ 10','giữ gìn vệ sinh , không về sau 23h , ko tàng chữ chất cấm','nhà trọ anh bình','nguyễn xiển','văn quán',1,1);
/*!40000 ALTER TABLE `rental_property` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rental_type`
--

DROP TABLE IF EXISTS `rental_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rental_type` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` text,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rental_type`
--

LOCK TABLES `rental_type` WRITE;
/*!40000 ALTER TABLE `rental_type` DISABLE KEYS */;
INSERT INTO `rental_type` VALUES (1,NULL,'chung cư mini');
/*!40000 ALTER TABLE `rental_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text,
  `createdAt` datetime(6) DEFAULT NULL,
  `rentalPropertyId` bigint NOT NULL,
  `userId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_review_rental_property` (`userId`,`rentalPropertyId`),
  KEY `FKrrbcul4dd6xhghj1o7bonvmkg` (`rentalPropertyId`),
  CONSTRAINT `FKplc2ti9ai9cv8dqhogm5uw811` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrrbcul4dd6xhghj1o7bonvmkg` FOREIGN KEY (`rentalPropertyId`) REFERENCES `rental_property` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review`
--

LOCK TABLES `review` WRITE;
/*!40000 ALTER TABLE `review` DISABLE KEYS */;
/*!40000 ALTER TABLE `review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `status` enum('AVAILABLE','RENTED') NOT NULL,
  `currentTenantId` bigint DEFAULT NULL,
  `roomTypeId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3mr8n2qomhjxqjohqf6kd4iyl` (`currentTenantId`),
  KEY `FKgk4m9p1t7pt8y1d7i5df70l88` (`roomTypeId`),
  CONSTRAINT `FK3mr8n2qomhjxqjohqf6kd4iyl` FOREIGN KEY (`currentTenantId`) REFERENCES `users` (`id`),
  CONSTRAINT `FKgk4m9p1t7pt8y1d7i5df70l88` FOREIGN KEY (`roomTypeId`) REFERENCES `room_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (1,'101','AVAILABLE',NULL,1),(2,'102','AVAILABLE',NULL,1);
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_type`
--

DROP TABLE IF EXISTS `room_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_type` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `area` decimal(8,2) DEFAULT NULL,
  `maxGuests` int DEFAULT NULL,
  `monthlyPrice` decimal(12,2) NOT NULL,
  `name` varchar(100) NOT NULL,
  `rentalPropertyId` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKsx8xkjilggtgahvht2k9316s2` (`rentalPropertyId`),
  CONSTRAINT `FKsx8xkjilggtgahvht2k9316s2` FOREIGN KEY (`rentalPropertyId`) REFERENCES `rental_property` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_type`
--

LOCK TABLES `room_type` WRITE;
/*!40000 ALTER TABLE `room_type` DISABLE KEYS */;
INSERT INTO `room_type` VALUES (1,15.00,1,2500000.00,'phòng đơn',1);
/*!40000 ALTER TABLE `room_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `citizenId` varchar(12) DEFAULT NULL,
  `fullName` varchar(100) NOT NULL,
  `gender` enum('MALE','FEMALE') DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phoneNumber` varchar(20) DEFAULT NULL,
  `role` enum('ADMIN','OWNER','CUSTOMER') NOT NULL,
  `status` enum('ACTIVE','INACTIVE','LOCKED') NOT NULL,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  UNIQUE KEY `UKq54e2p8dcbwiwjhvlc2py865e` (`citizenId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'001205033385','hoàng minh hải','MALE','{bcrypt}$2a$10$5r4FCBrQGBopo1QLaEggE.Be.Ru3VQFcVkf2pqRDkkQo3evFmU9fi','0904924800','OWNER','ACTIVE','haingu'),(2,NULL,'001205033386','Nguyễn Hữu Khánh Duy','MALE','{bcrypt}$2a$10$Hl95GU2Db0LJyv.VFN2HzOENpExSXsyKesil4pQQzdDonUAD.DgfG','0384408064','CUSTOMER','ACTIVE','nguyenduy'),(3,NULL,'003200000001','System Administrator','MALE','$2a$10$HlRPL12QJHhj7FWlaiI2rO0Fp2bayBvD8rKYKx4JTltC15p.8nWLW','0903000001','ADMIN','ACTIVE','admin');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'rental_room_system'
--

--
-- Dumping routines for database 'rental_room_system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-19 14:42:56
