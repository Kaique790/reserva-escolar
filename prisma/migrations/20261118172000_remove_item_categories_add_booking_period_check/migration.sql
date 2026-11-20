-- Remove item categories; items are managed directly by each school.
ALTER TABLE `items` DROP FOREIGN KEY `items_category_id_fkey`;
ALTER TABLE `items` DROP COLUMN `category_id`;
DROP TABLE `item_categories`;

-- Prisma does not represent CHECK constraints in the schema, so enforce
-- the period range directly in the database migration.
ALTER TABLE `bookings`
    ADD CONSTRAINT `bookings_period_range_check`
    CHECK (`period` BETWEEN 1 AND 7);

ALTER TABLE `booking_items`
    ADD CONSTRAINT `booking_items_period_range_check`
    CHECK (`period` BETWEEN 1 AND 7);
