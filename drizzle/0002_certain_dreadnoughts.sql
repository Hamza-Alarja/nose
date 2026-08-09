CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`preferred_language` varchar(5) NOT NULL DEFAULT 'en',
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` timestamp,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`product_name_ar` varchar(255) NOT NULL,
	`product_name_en` varchar(255) NOT NULL,
	`product_image` text,
	`variant` varchar(64),
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_number` varchar(32) NOT NULL,
	`customer_name` varchar(255) NOT NULL,
	`customer_phone` varchar(32) NOT NULL,
	`customer_email` varchar(320),
	`shipping_address` text NOT NULL,
	`city` varchar(128),
	`country` varchar(64) DEFAULT 'AE',
	`status` enum('pending','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
	`total_amount` decimal(10,2) NOT NULL,
	`payment_status` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`payment_link_id` varchar(255),
	`payment_link_url` text,
	`notes` text,
	`user_id` int,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(64) NOT NULL,
	`name_ar` varchar(255) NOT NULL,
	`name_en` varchar(255) NOT NULL,
	`description_ar` text,
	`description_en` text,
	`scent_notes_ar` text,
	`scent_notes_en` text,
	`category` varchar(64) DEFAULT 'perfume',
	`price` decimal(10,2) NOT NULL,
	`compare_at_price` decimal(10,2),
	`stock_quantity` int NOT NULL DEFAULT 0,
	`images` json,
	`variants` json,
	`is_featured` boolean NOT NULL DEFAULT false,
	`is_new` boolean NOT NULL DEFAULT false,
	`is_bestseller` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	`lastSignedIn` timestamp NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
