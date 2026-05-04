-- Migration: Update notes table to support datetime deadline
-- Change deadline column from DATE to TIMESTAMP WITH TIME ZONE

ALTER TABLE notes 
ALTER COLUMN deadline SET DATA TYPE timestamp with time zone USING deadline::timestamp with time zone;
