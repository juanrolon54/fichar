CREATE TABLE `attendees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`firstname` text NOT NULL,
	`surname` text NOT NULL,
	`government_document_id` text NOT NULL,
	`course` integer NOT NULL,
	FOREIGN KEY (`course`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`created` integer DEFAULT (unixepoch()) NOT NULL,
	`teacher` integer NOT NULL,
	FOREIGN KEY (`teacher`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_uuid_unique` ON `courses` (`uuid`);--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`created` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_name_unique` ON `teachers` (`name`);