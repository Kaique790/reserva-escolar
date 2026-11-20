-- Cancellations delete bookings instead of retaining cancelled records.
ALTER TABLE `bookings`
    DROP COLUMN `status`,
    DROP COLUMN `cancelled_at`;
