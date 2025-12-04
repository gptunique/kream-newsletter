CREATE TABLE `dailySnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`data` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailySnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailySnapshots_snapshotDate_unique` UNIQUE(`snapshotDate`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kreamId` varchar(128),
	`brand` varchar(128),
	`name` text,
	`nameKo` text,
	`thumbnailUrl` text,
	`detailUrl` text,
	`category` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_kreamId_unique` UNIQUE(`kreamId`)
);
--> statement-breakpoint
CREATE TABLE `rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`rank` int NOT NULL,
	`price` int,
	`tradeVolume` varchar(64),
	`wishCount` int,
	`recordedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rankings_id` PRIMARY KEY(`id`)
);
