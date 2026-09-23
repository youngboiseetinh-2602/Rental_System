-- Renames the owner-specific relationship without changing existing rows.
ALTER TABLE `monthlyRevenue` DROP FOREIGN KEY `fk_owner_revenue_owner`;
ALTER TABLE `monthlyRevenue` RENAME COLUMN `owner_id` TO `user_id`;
ALTER TABLE `monthlyRevenue` RENAME INDEX `uk_owner_revenue_month` TO `uk_monthly_revenue_user_month`;
ALTER TABLE `monthlyRevenue`
  ADD CONSTRAINT `fk_monthly_revenue_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
