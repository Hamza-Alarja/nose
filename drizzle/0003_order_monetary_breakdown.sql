ALTER TABLE `orders`
  ADD COLUMN `subtotal_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  ADD COLUMN `shipping_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  ADD COLUMN `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  ADD COLUMN `tax_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  ADD COLUMN `currency` varchar(3) NOT NULL DEFAULT 'AED',
  ADD COLUMN `coupon_code` varchar(64) NULL;
