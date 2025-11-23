CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scrapingId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrapings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`urls` text NOT NULL,
	`resultsLimit` int NOT NULL DEFAULT 200,
	`status` enum('pending','processing','completed','error') NOT NULL DEFAULT 'pending',
	`currentStep` text,
	`progress` int DEFAULT 0,
	`spreadsheetUrl` text,
	`analysisUrl` text,
	`assistantId` text,
	`assistantUrl` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `scrapings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_scrapingId_scrapings_id_fk` FOREIGN KEY (`scrapingId`) REFERENCES `scrapings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scrapings` ADD CONSTRAINT `scrapings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;