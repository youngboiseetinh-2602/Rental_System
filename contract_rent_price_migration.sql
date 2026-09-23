-- Use for existing databases whose contract table does not have rentPrice.
ALTER TABLE `contract` ADD COLUMN `rentPrice` decimal(12,2) NULL;

UPDATE `contract` c
JOIN `room` r ON r.`id` = c.`roomId`
JOIN `room_type` rt ON rt.`id` = r.`roomTypeId`
SET c.`rentPrice` = rt.`monthlyPrice`;

ALTER TABLE `contract` MODIFY COLUMN `rentPrice` decimal(12,2) NOT NULL;
