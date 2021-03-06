CREATE TABLE IF NOT EXISTS `test_drives` (
`id` SERIAL,
`article_id` BIGINT(20) UNSIGNED NOT NULL,
`user_id`  BIGINT(20) UNSIGNED NOT NULL,
`title` VARCHAR(50) NOT NULL,
`tnc` TEXT NOT NULL,
`start` DATETIME NOT NULL,
`end` DATETIME NOT NULL,
`valid` BOOL NOT NULL DEFAULT 1,
`created` DATETIME NOT NULL,
`modified` DATETIME NOT NULL,
INDEX(`article_id`)
)Engine=MyISAM CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `test_drives_users` (
`id` SERIAL,
`article_id` BIGINT(20) UNSIGNED NOT NULL,
`test_drive_id`  BIGINT(20) UNSIGNED NOT NULL,
`name` VARCHAR(30) NOT NULL,
`title` VARCHAR(10) NOT NULL,
`phone` VARCHAR(15) NOT NULL,
`email` VARCHAR(65) NOT NULL,
`valid` BOOL NOT NULL DEFAULT 1,
`created` DATETIME NOT NULL,
`modified` DATETIME NOT NULL,
INDEX(`article_id`)
)Engine=MyISAM CHARSET=utf8;