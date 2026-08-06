-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: rental_room_system
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `rental_room_system`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `rental_room_system` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `rental_room_system`;

--
-- Table structure for table `contract`
--

DROP TABLE IF EXISTS `contract`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `roomId` bigint NOT NULL,
  `tenantId` bigint NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `status` enum('PENDING','APPROVED','CANCELLED','TERMINATED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_contract_room` (`roomId`),
  KEY `fk_contract_tenant` (`tenantId`),
  CONSTRAINT `fk_contract_room` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`),
  CONSTRAINT `fk_contract_tenant` FOREIGN KEY (`tenantId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract`
--

LOCK TABLES `contract` WRITE;
/*!40000 ALTER TABLE `contract` DISABLE KEYS */;
INSERT INTO `contract` VALUES (1,19,7,'2026-08-01','2027-07-31','APPROVED','2026-07-21 02:33:14.709754'),(2,31,19,'2026-07-28','2026-07-31','CANCELLED','2026-07-28 07:03:56.844475'),(3,31,19,'2026-07-28','2026-07-31','CANCELLED','2026-07-28 07:15:53.907187'),(4,31,19,'2026-07-28','2026-07-31','APPROVED','2026-07-28 07:41:40.104113');
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
  `participantOneId` bigint NOT NULL,
  `participantTwoId` bigint NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('ACTIVE','BLOCKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `blockedById` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conversation_participant_pair` (`participantOneId`,`participantTwoId`),
  KEY `idx_conversation_participant_two` (`participantTwoId`),
  KEY `idx_conversation_blocked_by` (`blockedById`),
  CONSTRAINT `fk_conversation_blocked_by` FOREIGN KEY (`blockedById`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_conversation_participant_one` FOREIGN KEY (`participantOneId`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_conversation_participant_two` FOREIGN KEY (`participantTwoId`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_conversation_participant_order` CHECK ((`participantOneId` < `participantTwoId`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation`
--

LOCK TABLES `conversation` WRITE;
/*!40000 ALTER TABLE `conversation` DISABLE KEYS */;
INSERT INTO `conversation` VALUES (1,19,20,'2026-07-29 10:27:00','ACTIVE',NULL),(2,18,20,'2026-07-29 13:06:09','ACTIVE',NULL);
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
  `roomTypeId` bigint NOT NULL,
  `facilityName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_facilities_room_type` (`roomTypeId`),
  CONSTRAINT `fk_facilities_room_type` FOREIGN KEY (`roomTypeId`) REFERENCES `room_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facilities`
--

LOCK TABLES `facilities` WRITE;
/*!40000 ALTER TABLE `facilities` DISABLE KEYS */;
INSERT INTO `facilities` VALUES (6,6,'Máy giặt mới',3),(8,7,'Máy lạnh',1),(9,7,'Giường',1),(10,7,'Tủ quần áo',1),(11,8,'máy lạnh',1),(12,8,'giường',1),(13,9,'gác lửng',1),(14,9,'máy lạnh',1),(15,10,'quạt trần',1),(16,10,'tủ quần áo',1),(17,11,'máy lạnh',1),(18,11,'tủ lạnh',1),(19,12,'giường',1),(20,12,'bàn học',2),(21,13,'ban công',1),(22,13,'máy lạnh',1),(23,14,'máy giặt',1),(24,14,'tủ quần áo',1),(25,15,'quạt treo tường',1),(26,15,'kệ bếp',1),(27,16,'máy lạnh',1),(28,16,'tủ lạnh',1),(29,16,'máy giặt',1),(30,17,'máy lạnh',1),(31,17,'kệ bếp',1),(32,17,'tủ quần áo',1),(33,18,'giường đơn',1),(34,18,'bàn',1),(35,18,'tủ lạnh mini',1),(36,18,'tủ quần áo',1),(37,18,'điều hòa',1),(38,19,'giường đơn',1),(39,19,'tủ lạnh mini',1),(40,19,'bàn',2),(41,19,'tủ quần áo',1),(42,19,'điều hòa',1),(43,19,'quạt',1),(44,20,'giường đôi',1),(45,20,'điều hòa',1),(46,20,'bàn',2),(47,20,'tủ lạnh',1),(48,20,'tủ quần áo',1),(49,20,'máy giặt',1);
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
  `rentalPropertyId` bigint NOT NULL,
  `imageUrl` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_image_rental_property` (`rentalPropertyId`),
  CONSTRAINT `fk_image_rental_property` FOREIGN KEY (`rentalPropertyId`) REFERENCES `rental_property` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image`
--

LOCK TABLES `image` WRITE;
/*!40000 ALTER TABLE `image` DISABLE KEYS */;
INSERT INTO `image` VALUES (1,3,'https://example.com/rental-1.jpg'),(2,3,'https://example.com/room-1.jpg'),(3,3,'https://example.com/room-2.jpg'),(4,4,'https://example.com/images/nha-tro-binh-an-1.jpg'),(5,4,'https://example.com/images/nha-tro-binh-an-2.jpg'),(6,5,'https://example.com/images/binh-minh.jpg'),(7,6,'https://example.com/images/anh-duong.jpg'),(8,7,'https://example.com/images/thanh-binh.jpg'),(9,8,'https://example.com/images/hoang-gia.jpg'),(10,9,'https://example.com/images/sinh-vien.jpg'),(11,10,'https://example.com/images/phuc-an.jpg'),(12,11,'https://example.com/images/hanh-phuc.jpg'),(13,12,'https://example.com/images/thien-phu.jpg'),(14,13,'https://example.com/images/thanh-cong.jpg'),(15,14,'https://example.com/images/ngoc-lan.jpg'),(16,15,'https://ik.imagekit.io/rentalroomsystem/rental-room/properties/property-1785220637476-10-chot-10-web-1662033333779794718887_BNw-4XcQP.webp'),(17,15,'https://ik.imagekit.io/rentalroomsystem/rental-room/properties/property-1785220683383-269683117_4980152548_M4Dt-HFhp.jpg');
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
  `conversationId` bigint NOT NULL,
  `senderId` bigint NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('SENT','READ') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SENT',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_message_sender` (`senderId`),
  KEY `idx_message_conversation_hidden_id` (`conversationId`,`hidden`,`id`),
  CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversationId`) REFERENCES `conversation` (`id`),
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES (1,1,19,'lo','2026-07-28 20:32:19','READ',0,NULL),(2,1,20,'hello','2026-07-28 20:32:56','READ',0,'Đã chỉnh sửa'),(3,1,19,'.','2026-07-28 20:34:55','READ',0,NULL),(4,1,19,'.','2026-07-28 20:34:57','READ',0,NULL),(5,1,19,'.','2026-07-28 20:34:58','READ',0,NULL),(6,1,19,'.','2026-07-28 20:35:00','READ',0,NULL),(7,1,19,'.','2026-07-28 20:35:01','READ',0,NULL),(8,1,19,'.','2026-07-28 20:35:02','READ',0,NULL),(9,1,19,'.','2026-07-28 20:35:04','READ',0,NULL),(10,1,19,'.','2026-07-28 20:35:05','READ',0,NULL),(11,1,19,'.','2026-07-28 20:35:11','READ',0,NULL),(12,1,19,'.','2026-07-28 20:35:12','READ',0,NULL),(13,1,19,'hhkk','2026-07-28 20:53:46','READ',0,NULL),(14,1,20,'sdfsfs','2026-07-28 21:03:16','SENT',1,NULL),(15,1,20,'dfdf','2026-07-28 21:04:37','SENT',0,NULL),(16,1,20,'sdfsfs','2026-07-28 21:04:38','SENT',0,NULL),(17,1,20,'fsf','2026-07-28 21:04:39','SENT',0,NULL),(18,1,20,'j','2026-07-28 21:26:37','SENT',0,NULL);
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
  `senderId` bigint NOT NULL,
  `receiverId` bigint NOT NULL,
  `sentAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('READ','UNREAD') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNREAD',
  `readAt` datetime DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_receiver_status_sent_at` (`receiverId`,`status`,`sentAt`),
  KEY `idx_notification_sender_sent_at` (`senderId`,`sentAt`),
  KEY `idx_notification_receiver_id` (`receiverId`,`id`),
  CONSTRAINT `fk_notification_receiver` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_notification_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,6,7,'2026-07-21 02:40:59','UNREAD',NULL,'Yeu cau thue phong P101 da duoc chu tro chap nhan','Yeu cau thue da duoc chap nhan'),(2,20,19,'2026-07-28 07:11:05','READ','2026-07-28 11:45:39','Yeu cau thue phong P101 da bi chu tro tu choi','Yeu cau thue da bi tu choi'),(3,20,19,'2026-07-28 07:16:31','READ','2026-07-28 07:21:13','Yeu cau thue phong P101 da bi chu tro tu choi. Ly do: phòng đang được sửa chữa','Yeu cau thue da bi tu choi'),(4,20,19,'2026-07-28 07:42:01','READ','2026-07-28 11:45:32','Yeu cau thue phong P101 da duoc chu tro chap nhan','Yeu cau thue da duoc chap nhan'),(5,20,19,'2026-07-29 03:48:39','UNREAD',NULL,'....','thanh toán'),(6,20,19,'2026-07-29 03:49:43','UNREAD',NULL,'.','.');
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
  `ownerId` bigint NOT NULL,
  `rentalTypeId` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `street` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `houseNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detailedAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `houseRules` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_rental_property_owner` (`ownerId`),
  KEY `fk_rental_property_type` (`rentalTypeId`),
  CONSTRAINT `fk_rental_property_owner` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_rental_property_type` FOREIGN KEY (`rentalTypeId`) REFERENCES `rental_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rental_property`
--

LOCK TABLES `rental_property` WRITE;
/*!40000 ALTER TABLE `rental_property` DISABLE KEYS */;
INSERT INTO `rental_property` VALUES (3,6,4,'Nhà trọ Bình Minh mới','Hà Nội','Dịch Vọng','Trần Thái Tông','20','20 Trần Thái Tông, Cầu Giấy','Giữ vệ sinh chung','Nhà trọ đã được cập nhật'),(4,6,5,'Nhà trọ Bình An','Thành phố Hồ Chí Minh','Phường Linh Trung','Đường Hoàng Diệu 2','25','25 Đường Hoàng Diệu 2, Phường Linh Trung, Thành phố Hồ Chí Minh','Không hút thuốc, không gây tiếng ồn sau 22 giờ.','Nhà trọ mới xây, khu vực an ninh, gần trường học và chợ.'),(5,17,5,'Nhà trọ Bình Minh','Hồ Chí Minh','Phường Linh Trung','Lê Văn Chí','12','12 Lê Văn Chí, Phường Linh Trung, Thủ Đức','Không gây ồn sau 22 giờ','Nhà trọ yên tĩnh, gần chợ và trường học'),(6,17,5,'Nhà trọ Ánh Dương','Hồ Chí Minh','Phường Hiệp Bình Chánh','Quốc lộ 13','25','25 Quốc lộ 13, Hiệp Bình Chánh, Thủ Đức','Giữ vệ sinh khu vực chung','Phòng mới xây, có chỗ để xe'),(7,17,5,'Nhà trọ Thanh Bình','Hồ Chí Minh','Phường Tân Chánh Hiệp','Tô Ký','38','38 Tô Ký, Tân Chánh Hiệp, Quận 12','Khóa cổng trước 23 giờ','Khu trọ an ninh, có camera giám sát'),(8,17,6,'Nhà trọ Hoàng Gia','Hồ Chí Minh','Phường 15','Phan Văn Trị','45','45 Phan Văn Trị, Phường 15, Gò Vấp','Không nuôi thú cưng','Phòng rộng, nội thất đầy đủ'),(9,17,5,'Nhà trọ Sinh Viên','Hồ Chí Minh','Phường Đông Hòa','Nguyễn Văn Thương','60','60 Nguyễn Văn Thương, Đông Hòa, Dĩ An','Không sử dụng chất kích thích','Giá rẻ, phù hợp sinh viên'),(10,17,5,'Nhà trọ Phúc An','Hồ Chí Minh','Phường Tân Thới Nhất','Trường Chinh','72','72 Trường Chinh, Tân Thới Nhất, Quận 12','Không mở nhạc lớn','Khu dân cư an ninh và yên tĩnh'),(11,17,5,'Nhà trọ Hạnh Phúc','Hồ Chí Minh','Phường 11','Lạc Long Quân','88','88 Lạc Long Quân, Phường 11, Tân Bình','Không hút thuốc trong phòng','Phòng sạch sẽ, có lối đi riêng'),(12,17,5,'Nhà trọ Thiên Phú','Bình Dương','Phường An Bình','Nguyễn Tri Phương','95','95 Nguyễn Tri Phương, An Bình, Dĩ An','Không để xe chắn lối đi','Gần khu công nghiệp và siêu thị'),(13,17,6,'Căn hộ mini Thành Công','Hồ Chí Minh','Phường 7','Nguyễn Văn Đậu','108','108 Nguyễn Văn Đậu, Phường 7, Bình Thạnh','Không tổ chức tiệc trong phòng','Căn hộ mini đầy đủ nội thất'),(14,17,5,'Nhà trọ Ngọc Lan','Hồ Chí Minh','Phường Long Trường','Nguyễn Duy Trinh','120','120 Nguyễn Duy Trinh, Long Trường, Thủ Đức','Tuân thủ quy định phòng cháy chữa cháy','Không gian thoáng mát, khu vực an ninh'),(15,20,3,'nhà trọ 001','Hà Nội','Văn Quán','Nguyễn Khuyến','số 1 , ngõ 1','','không làm ồn sau 22h và trước 6h ,\nkhông tàng trữ chất cấm\ngiữ gìn vệ sinh','gần ptit , kma , utt');
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
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rental_type`
--

LOCK TABLES `rental_type` WRITE;
/*!40000 ALTER TABLE `rental_type` DISABLE KEYS */;
INSERT INTO `rental_type` VALUES (3,'chung cư mini',NULL),(4,'chung cư mini',NULL),(5,'nhà trọ',NULL),(6,'căn hộ mini',NULL),(7,'nhà nguyên căn','rộng , tiện nghi , riêng tư vcl');
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
  `userId` bigint NOT NULL,
  `rentalPropertyId` bigint NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_review_rental_property` (`userId`,`rentalPropertyId`),
  KEY `fk_review_rental_property` (`rentalPropertyId`),
  CONSTRAINT `fk_review_rental_property` FOREIGN KEY (`rentalPropertyId`) REFERENCES `rental_property` (`id`),
  CONSTRAINT `fk_review_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `roomTypeId` bigint NOT NULL,
  `currentTenantId` bigint DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('AVAILABLE','RENTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  PRIMARY KEY (`id`),
  KEY `fk_room_room_type` (`roomTypeId`),
  KEY `fk_room_current_tenant` (`currentTenantId`),
  CONSTRAINT `fk_room_current_tenant` FOREIGN KEY (`currentTenantId`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_room_room_type` FOREIGN KEY (`roomTypeId`) REFERENCES `room_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (17,6,NULL,'P201','AVAILABLE'),(18,6,NULL,'P202','AVAILABLE'),(19,7,7,'P101','RENTED'),(20,7,NULL,'P102','AVAILABLE'),(21,8,NULL,'BM-101','AVAILABLE'),(22,9,NULL,'AD-101','AVAILABLE'),(23,10,NULL,'TB-101','AVAILABLE'),(24,11,NULL,'HG-101','AVAILABLE'),(25,12,NULL,'SV-101','AVAILABLE'),(26,13,NULL,'PA-101','AVAILABLE'),(27,14,NULL,'HP-101','AVAILABLE'),(28,15,NULL,'TP-101','AVAILABLE'),(29,16,NULL,'TC-101','AVAILABLE'),(30,17,NULL,'NL-101','AVAILABLE'),(31,18,19,'P101','RENTED'),(32,18,NULL,'P102','AVAILABLE'),(33,19,NULL,'P203','AVAILABLE'),(34,19,NULL,'P201','AVAILABLE'),(35,20,NULL,'P101','AVAILABLE');
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
  `rentalPropertyId` bigint NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area` decimal(8,2) DEFAULT NULL,
  `monthlyPrice` decimal(12,2) NOT NULL,
  `maxGuests` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_room_type_rental_property` (`rentalPropertyId`),
  CONSTRAINT `fk_room_type_rental_property` FOREIGN KEY (`rentalPropertyId`) REFERENCES `rental_property` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_type`
--

LOCK TABLES `room_type` WRITE;
/*!40000 ALTER TABLE `room_type` DISABLE KEYS */;
INSERT INTO `room_type` VALUES (6,3,'phòng đôi',40.00,6000000.00,5),(7,4,'phòng tiêu chuẩn',25.00,3000000.00,2),(8,5,'phòng tiêu chuẩn',20.00,2500000.00,2),(9,6,'phòng có gác',25.00,3200000.00,3),(10,7,'phòng đơn',18.00,2200000.00,2),(11,8,'căn hộ studio',30.00,4500000.00,2),(12,9,'phòng sinh viên',16.00,1800000.00,2),(13,10,'phòng ban công',24.00,3000000.00,2),(14,11,'phòng lối đi riêng',22.00,2900000.00,2),(15,12,'phòng công nhân',20.00,2000000.00,3),(16,13,'studio cao cấp',35.00,5500000.00,2),(17,14,'phòng gia đình',32.00,4000000.00,4),(18,15,'phòng đơn',15.00,2000000.00,1),(19,15,'phòng gác xép',15.00,2500000.00,2),(20,15,'căn hộ mini',25.00,3500000.00,3);
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
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneNumber` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `citizenId` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatarUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('MALE','FEMALE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','OWNER','CUSTOMER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE','LOCKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `citizenId` (`citizenId`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (6,'owner','Nguyễn Văn Owner','0912345679','$2a$10$bg3h77867Z.49oDI6GzV/OhWM20208rrqgg51xXuPCyljAorN1yRa','012345678902',NULL,'MALE','OWNER','ACTIVE'),(7,'customer','Nguyễn Văn Customer','0912345678','$2a$10$BpyUuxLYz.aGmqsmiJD9TOBA7vPCyvmO9Z/dIAf1o7U58MQ7nuOYG','012345678901',NULL,'MALE','CUSTOMER','ACTIVE'),(8,'customer02','Nguyen Van An','0987654321','$2a$10$3TFV1Ih0lSO3zggqPLrTaOfQ99wRBfzM1BuGy.Q.KRnQnacXYunJC','079203001234',NULL,'MALE','CUSTOMER','ACTIVE'),(9,'customer01','Nguyen Van Customer 01','0901000001','$2a$10$KUGmju.Vb1p40reTDj6D/u9tuQtdZ7AQqeppR4n3O1aWYvQxfW/XC','001200000001',NULL,'MALE','CUSTOMER','ACTIVE'),(10,'customer00','Tran Thi Customer 02','0901000002','$2a$10$3OOOXVNoKmmoRDZ5C7BnGOj37Brj3uX5wgNLeeIyi/nlpsRYN2p/S','001200000002',NULL,'FEMALE','CUSTOMER','ACTIVE'),(11,'customer03','Le Van Customer 03','0901000003','$2a$10$pSnH3kI5BnxLWpClXQex5.cAHbyIZlTXfy6A/pMVAKG6/ZDE9PNTG','001200000003',NULL,'MALE','CUSTOMER','ACTIVE'),(12,'customer04','Pham Thi Customer 04','0901000004','$2a$10$fmqbJU/N9UgHwU/jrpxdpeyB4vy256RUHpWAhZEcQWnZCV8HizFVO','001200000004',NULL,'FEMALE','CUSTOMER','LOCKED'),(13,'customer05','Hoang Van Customer 05','0901000005','$2a$10$zVQCfOjyYIRBVfsUCGBw8u8qbjF94W0aVL9gSlegVQ4Xq3uneao0a','001200000005',NULL,'MALE','CUSTOMER','ACTIVE'),(14,'owner01','Nguyen Van Owner 01','0902000001','$2a$10$10iu9r4SV3uJ2SnR4raYdOZ.AxPpBqpa/uqmpd42koE5TGLunsdca','002200000001',NULL,'MALE','OWNER','ACTIVE'),(15,'owner02','Tran Thi Owner 02','0902000002','$2a$10$Ct82wBWEGD6sUu3fTrVsSezU3s20rX90o8WzxaU8e1EWXDr2CvgCG','002200000002',NULL,'FEMALE','OWNER','ACTIVE'),(16,'owner04','Pham Thi Owner 04','0902000004','$2a$10$GP70CJEVrhaUttfp6/lgYO4.OxN3ZrzOj5nsRJ/At3hkwHzasc9XW','002200000004',NULL,'FEMALE','OWNER','ACTIVE'),(17,'owner05','Hoang Van Owner 05','0902000005','$2a$10$DSyV.0x.cVXeVUV7xjphLO8Uc1HFFvU.LYjQXi546oDM5pjZwM43O','002200000005',NULL,'MALE','OWNER','ACTIVE'),(18,'admin','System Administrator','0903000001','$2a$10$HlRPL12QJHhj7FWlaiI2rO0Fp2bayBvD8rKYKx4JTltC15p.8nWLW','003200000001','','MALE','ADMIN','ACTIVE'),(19,'tuitenduy','Nguyễn Hữu Khánh Duy','0904924800','{bcrypt}$2a$10$7qqmbCZ6Y61VmY.t1JQmxeBJxiD.gPSlsm8pYcvzYG2c1yJfp1TLu','111111111111','https://ik.imagekit.io/rentalroomsystem/rental-room/avatars/avatar-1785210713083-1785210073867_120079037538067110_2955678045354681352_77d06ea166e50704f6e4edd5b5f76f03_pnu_HxcrO.jpg','MALE','CUSTOMER','ACTIVE'),(20,'hoangtuhadong','nguyên ivan','1111111111','{bcrypt}$2a$10$eydd8xp0mRppEYGStuzFfe0N4g8WeQOi17lrtrloRQztsdd5Z2dnu','120000000000','','MALE','OWNER','ACTIVE');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-07-29 14:43:37
