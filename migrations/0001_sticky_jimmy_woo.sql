PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`schedule` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`created` integer DEFAULT (unixepoch()) NOT NULL,
	`teacher` integer NOT NULL,
	FOREIGN KEY (`teacher`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "code", "name", "description", "schedule", "start", "end", "created", "teacher") SELECT "id", "code", "name", "description", "schedule", "start", "end", "created", "teacher" FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;