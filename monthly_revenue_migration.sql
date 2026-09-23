-- Use for databases that do not yet have monthlyRevenue.
CREATE TABLE IF NOT EXISTS `monthlyRevenue` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `year` smallint NOT NULL,
  `month` tinyint NOT NULL,
  `revenue` decimal(15,2) NOT NULL DEFAULT 0.00,
  `commissionPercent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `profit` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_monthly_revenue_user_month` (`user_id`, `year`, `month`),
  CONSTRAINT `fk_monthly_revenue_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_owner_revenue_month` CHECK (`month` BETWEEN 1 AND 12),
  CONSTRAINT `chk_owner_revenue_amount` CHECK (`revenue` >= 0),
  CONSTRAINT `chk_owner_revenue_commission` CHECK (`commissionPercent` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
