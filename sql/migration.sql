ALTER TABLE `articles` ADD `valid` bool NOT NULL DEFAULT 1 AFTER `modified`;
ALTER TABLE `categories` ADD `valid` bool NOT NULL DEFAULT 1 AFTER `modified`;
ALTER TABLE `users` ADD `valid` bool NOT NULL DEFAULT 1 AFTER `modified`;
ALTER TABLE `banners` ADD `valid` bool NOT NULL DEFAULT 1 AFTER `modified`;
ALTER TABLE `images` ADD `valid` bool NOT NULL DEFAULT 1 AFTER `modified`;
ALTER TABLE `banner_displays` ADD `modified` DATETIME DEFAULT NULL AFTER `created`;