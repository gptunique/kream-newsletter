ALTER TABLE `userAlerts` MODIFY COLUMN `thresholdPercent` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `userAlerts` ADD `alertType` enum('percent_change','price_below','price_above') DEFAULT 'percent_change' NOT NULL;--> statement-breakpoint
ALTER TABLE `userAlerts` ADD `targetPrice` int;