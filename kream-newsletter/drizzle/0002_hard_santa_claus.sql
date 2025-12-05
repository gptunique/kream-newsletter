CREATE TABLE `userAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`productUrl` text NOT NULL,
	`productName` text,
	`currentPrice` int,
	`thresholdPercent` int NOT NULL DEFAULT 10,
	`isActive` int NOT NULL DEFAULT 1,
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userAlerts_id` PRIMARY KEY(`id`)
);
