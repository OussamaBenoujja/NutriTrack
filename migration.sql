-- Migration script to revert the meals table source column
-- Run this script to update your existing database

USE NutriTrackDB;

-- Revert the source column to only allow 'image' and 'manual'
ALTER TABLE meals MODIFY COLUMN source ENUM('image','manual') NOT NULL;

-- Verify the change
DESCRIBE meals;
