CREATE TABLE `discount_codes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `code` varchar(64) NOT NULL,
  `type` enum('percentage','fixed') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `minimum_order_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `maximum_discount_amount` decimal(10,2),
  `usage_limit` int,
  `used_count` int NOT NULL DEFAULT 0,
  `starts_at` timestamp,
  `expires_at` timestamp,
  `is_active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `discount_codes_id` PRIMARY KEY(`id`),
  CONSTRAINT `discount_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `orders`
  ADD COLUMN `coupon_type` varchar(16),
  ADD COLUMN `coupon_value` decimal(10,2);
